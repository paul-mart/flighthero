import json
import os
import re
import time
from datetime import date, timedelta
from typing import Any

import httpx

from flight_matching import enrich_awards_with_cash_prices
from seats_aero_client import SeatsAeroConfigError, SeatsAeroError, search_award_offers
from serpapi_client import SerpAPIError, credentials_configured as serpapi_configured, search_flight_offers

IATA_PATTERN = re.compile(r"\b([A-Z]{3})\b")
CABIN_KEYWORDS = {
    "first": "first",
    "business": "business",
    "premium": "premium-economy",
    "economy": "economy",
}

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GEMINI_FALLBACK_MODELS = (
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
)

TITLE_CHAR_MAX = 48


def _default_departure_date() -> str:
    return (date.today() + timedelta(days=45)).isoformat()


def _detect_cabin_class(text: str) -> str:
    lower = text.lower()
    for keyword, cabin in CABIN_KEYWORDS.items():
        if keyword in lower:
            return cabin
    return "business"


def _extract_route(text: str, home_airport: str | None) -> tuple[str, str, str] | None:
    codes = IATA_PATTERN.findall(text.upper())
    unique = []
    for code in codes:
        if code not in unique:
            unique.append(code)

    home = (home_airport or "").upper()
    if len(unique) >= 2:
        return unique[0], unique[1], _detect_cabin_class(text)
    if len(unique) == 1 and home and unique[0] != home:
        if " to " in text.lower() or " from " in text.lower():
            lower = text.lower()
            if lower.find(" from ") >= 0 and lower.find(" to ") >= 0:
                return home, unique[0], _detect_cabin_class(text)
        return home, unique[0], _detect_cabin_class(text)
    return None


def _flight_to_result(flight: dict[str, Any]) -> dict[str, Any]:
    award = flight.get("award_details") or {}
    points = award.get("points_required") or 0
    taxes = award.get("taxes_and_fees") or 0
    cash = flight.get("cash_price") or 0
    cpp = None
    if points > 0 and cash > 0:
        net = cash - taxes
        if net > 0:
            cpp = round((net / points) * 100, 2)

    return {
        "origin": flight.get("origin", ""),
        "destination": flight.get("destination", ""),
        "cabinClass": flight.get("cabin_class", "economy"),
        "airline": flight.get("carrier", ""),
        "program": award.get("mileage_program", ""),
        "pointsCost": points,
        "taxesAndFees": taxes,
        "cashPrice": cash if cash > 0 else None,
        "cpp": cpp,
        "departureDate": flight.get("departure_date"),
        "tripType": "one-way",
    }


def _search_flights_for_message(
    message: str,
    home_airport: str | None,
) -> list[dict[str, Any]]:
    route = _extract_route(message, home_airport)
    if not route:
        return []

    origin, destination, cabin = route
    departure = _default_departure_date()
    try:
        results = search_award_offers(
            origin=origin,
            destination=destination,
            departure_date=departure,
            cabin_class=cabin,
            max_results=5,
        )
        if serpapi_configured() and results:
            try:
                cash_offers = search_flight_offers(
                    origin=origin,
                    destination=destination,
                    departure_date=departure,
                    cabin_class=cabin,
                )
                results = enrich_awards_with_cash_prices(results, cash_offers)
            except SerpAPIError:
                pass
        return [_flight_to_result(f) for f in results[:5]]
    except (SeatsAeroConfigError, SeatsAeroError, ValueError):
        return []


def build_system_prompt(user_context: dict[str, Any]) -> str:
    home = user_context.get("homeAirport") or user_context.get("homeAirportLabel") or "unknown"
    valuations = user_context.get("cppValuations") or {}

    valuation_lines = []
    for key, value in valuations.items():
        if isinstance(value, (int, float)) and value > 0:
            valuation_lines.append(f"- {key}: {value}¢/pt baseline")

    valuations_text = (
        "\n".join(valuation_lines)
        if valuation_lines
        else "No custom cent-per-point valuations saved yet."
    )

    return f"""You are FlightHero's expert award travel advisor. Help users find great award flight deals, evaluate redemptions, and plan trips using points and miles.

User context:
- Home airport: {home}
- Points program valuations (user baselines):
{valuations_text}

Conversation style:
- Be conversational and concise — avoid long bullet-point walls of text.
- NEVER ask clarifying questions one at a time. If you need more info, ask everything you need in a single message (maximum 3 questions combined).
- If the user is vague, respond with ONE message that asks for destination or region, timeframe, and points currency — all at once, conversationally.
- Once you have enough to work with, give concrete recommendations with clear reasoning.
- Always explain WHY a deal is good or bad (cpp value vs their baselines, fuel surcharges/taxes, partner availability, routing, seasonality, etc.).

Search results and recommendations:
- When live search data is provided in the conversation, use it to give specific recommendations.
- When you find or recommend specific flights, include a JSON array wrapped in <results></results> tags so the frontend can render cards.
- Each result object must use these fields: origin, destination, cabinClass, airline, program, pointsCost, taxesAndFees (optional), cashPrice (optional), cpp (optional), departureDate (optional), tripType (optional).
- Only include <results> when you have real availability data from the search context — do not invent flights.
- Outside of <results> blocks, write natural conversational text (light markdown is OK).
- For general advice without search data, answer helpfully without fabricating specific flight results."""


def _format_search_context(results: list[dict[str, Any]]) -> str:
    if not results:
        return ""
    return (
        "Live award search results (use these for <results> if relevant):\n"
        + json.dumps(results, indent=2)
    )


def _build_gemini_contents(messages: list[dict[str, str]]) -> list[dict[str, Any]]:
    contents: list[dict[str, Any]] = []
    for msg in messages:
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if role not in ("user", "assistant") or not content:
            continue
        gemini_role = "user" if role == "user" else "model"
        contents.append({
            "role": gemini_role,
            "parts": [{"text": content}],
        })
    return contents


def _is_rate_limit_error(exc: RuntimeError) -> bool:
    msg = str(exc).lower()
    return "rate limit" in msg or "429" in msg


def _format_gemini_error(status_code: int, detail: str) -> str:
    if status_code == 429:
        return (
            "Ask Hero hit Gemini's rate limit. Wait a minute and try again, "
            "or add GROQ_API_KEY as a fallback. Usage: https://ai.dev/rate-limit"
        )
    if status_code == 404:
        return (
            f"Gemini model not found ({detail[:120]}). "
            "Set GEMINI_MODEL=gemini-2.5-flash-lite in .env and restart the server."
        )
    if status_code == 503:
        return (
            "Gemini is temporarily overloaded (high demand). "
            "Ask Hero will try alternate models automatically."
        )
    if status_code == 502:
        return "Gemini is temporarily unavailable. Retrying with another model."
    if status_code == 403:
        return "Gemini API key is invalid or lacks access. Check GEMINI_API_KEY in .env."
    return f"Gemini API error ({status_code}): {detail[:200]}"


def _is_transient_overload(exc: RuntimeError) -> bool:
    msg = str(exc).lower()
    return (
        "503" in msg
        or "502" in msg
        or "high demand" in msg
        or "unavailable" in msg
        or "overloaded" in msg
    )


def _is_retryable_gemini_error(exc: RuntimeError) -> bool:
    msg = str(exc).lower()
    return (
        "rate limit" in msg
        or "429" in msg
        or "404" in msg
        or "not found" in msg
        or _is_transient_overload(exc)
    )


def _resolve_hero_primary(api_key: str, groq_key: str) -> str:
    explicit = (os.getenv("ASK_HERO_PRIMARY") or "").strip().lower()
    if explicit in ("gemini", "groq"):
        return explicit
    if groq_key and not api_key:
        return "groq"
    if api_key and not groq_key:
        return "gemini"
    # Both keys: prefer Groq so Gemini free-tier RPM is not exhausted on every message.
    return "groq"


def _is_groq_auth_error(exc: RuntimeError) -> bool:
    msg = str(exc).lower()
    return "401" in msg or "403" in msg or "invalid api key" in msg


def _raise_combined_fallback_error(
    primary_error: RuntimeError,
    fallback_error: RuntimeError,
) -> None:
    if _is_rate_limit_error(primary_error):
        raise RuntimeError(
            "Ask Hero hit Gemini's rate limit and the Groq fallback also failed. "
            "Wait a minute and try again."
        ) from fallback_error
    raise RuntimeError(
        "Ask Hero couldn't complete your request. Gemini failed, and the Groq fallback "
        "also failed. Wait a minute and try again."
    ) from fallback_error


def _raise_gemini_exhausted(
    last_error: RuntimeError,
    *,
    groq_configured: bool,
) -> None:
    if groq_configured and _is_rate_limit_error(last_error):
        raise RuntimeError(
            "Ask Hero hit Gemini's rate limit and the Groq fallback also failed. "
            "Wait a minute and try again."
        ) from last_error
    if _is_transient_overload(last_error):
        raise RuntimeError(
            "Ask Hero couldn't reach Gemini right now — Google's servers are busy. "
            "Wait a minute and try again, or add a free GROQ_API_KEY in .env for backup."
        ) from last_error
    if _is_rate_limit_error(last_error) and not groq_configured:
        raise RuntimeError(
            "Ask Hero hit Gemini's rate limit. Wait a minute and try again, "
            "or add GROQ_API_KEY on the server for automatic fallback. "
            "Free key: https://console.groq.com"
        ) from last_error
    raise last_error


def _normalize_groq_model(model: str) -> str:
    normalized = (model or "llama-3.3-70b-versatile").strip()
    if not normalized:
        return "llama-3.3-70b-versatile"
    if normalized.startswith(("llama-", "openai/", "meta-llama/", "whisper")):
        return normalized
    # Common copy/paste mistake: "3.3-70b-versatile" instead of "llama-3.3-70b-versatile"
    if normalized[0].isdigit() or normalized.startswith("3."):
        return f"llama-{normalized}"
    return normalized


def _call_groq(
    api_key: str,
    model: str,
    system_instruction: str,
    messages: list[dict[str, str]],
) -> str:
    api_messages: list[dict[str, str]] = [
        {"role": "system", "content": system_instruction},
    ]
    for msg in messages:
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            api_messages.append({"role": role, "content": content})

    payload = {
        "model": model,
        "messages": api_messages,
        "temperature": 0.6,
        "max_tokens": 1200,
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if response.status_code >= 400:
        detail = response.text[:200]
        if response.status_code == 429:
            raise RuntimeError(
                "Ask Hero hit Groq's rate limit. Wait a minute and try again."
            )
        if response.status_code in (401, 403):
            raise RuntimeError(
                "Groq API key is invalid or lacks access. "
                "Check GROQ_API_KEY in Railway Variables and redeploy."
            )
        if response.status_code == 404 or "model_not_found" in detail:
            raise RuntimeError(
                f"Groq model not found ({model}). "
                "Set GROQ_MODEL=llama-3.3-70b-versatile in Railway Variables."
            )
        raise RuntimeError(f"Groq API error ({response.status_code}): {detail}")

    data = response.json()
    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError("Groq returned an empty response.")

    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise RuntimeError("Groq returned an empty message.")
    return content.strip()


def _call_gemini(
    api_key: str,
    model: str,
    system_instruction: str,
    messages: list[dict[str, str]],
) -> str:
    url = f"{GEMINI_API_BASE}/models/{model}:generateContent"
    payload: dict[str, Any] = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": _build_gemini_contents(messages),
        "generationConfig": {
            "temperature": 0.6,
            "maxOutputTokens": 1200,
        },
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            url,
            params={"key": api_key},
            headers={"Content-Type": "application/json"},
            json=payload,
        )

    if response.status_code >= 400:
        detail = response.text[:300]
        raise RuntimeError(_format_gemini_error(response.status_code, detail))

    data = response.json()
    candidates = data.get("candidates") or []
    if not candidates:
        raise RuntimeError("Gemini returned an empty response.")

    parts = candidates[0].get("content", {}).get("parts") or []
    text_parts = [part.get("text", "") for part in parts if part.get("text")]
    content = "".join(text_parts).strip()
    if not content:
        raise RuntimeError("Gemini returned an empty message.")

    return content


def _call_gemini_with_fallback(
    api_key: str,
    model: str,
    system_instruction: str,
    messages: list[dict[str, str]],
    *,
    groq_key: str = "",
    groq_model: str = "llama-3.3-70b-versatile",
) -> str:
    models: list[str] = []
    for candidate in (model, *GEMINI_FALLBACK_MODELS):
        if candidate and candidate not in models:
            models.append(candidate)

    last_error: RuntimeError | None = None
    for index, candidate in enumerate(models):
        for attempt in range(2):
            try:
                return _call_gemini(api_key, candidate, system_instruction, messages)
            except RuntimeError as exc:
                last_error = exc
                if _is_rate_limit_error(exc):
                    if groq_key:
                        try:
                            return _call_groq(
                                groq_key, groq_model, system_instruction, messages,
                            )
                        except RuntimeError as groq_exc:
                            _raise_combined_fallback_error(exc, groq_exc)
                    if attempt == 0:
                        time.sleep(2.0)
                        continue
                    break
                if not _is_retryable_gemini_error(exc):
                    raise
                if _is_transient_overload(exc):
                    time.sleep(1.0)
                break
        if last_error and _is_rate_limit_error(last_error):
            break

    if last_error:
        _raise_gemini_exhausted(last_error, groq_configured=bool(groq_key))
    raise RuntimeError("Gemini request failed.")


def _call_hero_llm(
    api_key: str,
    groq_key: str,
    model: str,
    groq_model: str,
    system_instruction: str,
    messages: list[dict[str, str]],
) -> str:
    primary = _resolve_hero_primary(api_key, groq_key)

    if primary == "groq":
        if not groq_key:
            raise RuntimeError(
                "ASK_HERO_PRIMARY=groq but GROQ_API_KEY is not set on the server."
            )
        try:
            return _call_groq(groq_key, groq_model, system_instruction, messages)
        except RuntimeError as groq_exc:
            if api_key and not _is_groq_auth_error(groq_exc):
                try:
                    return _call_gemini_with_fallback(
                        api_key,
                        model,
                        system_instruction,
                        messages,
                        groq_key="",
                    )
                except RuntimeError as gemini_exc:
                    _raise_combined_fallback_error(groq_exc, gemini_exc)
            raise

    if api_key:
        try:
            return _call_gemini_with_fallback(
                api_key,
                model,
                system_instruction,
                messages,
                groq_key=groq_key,
                groq_model=groq_model,
            )
        except RuntimeError as exc:
            if groq_key and _is_retryable_gemini_error(exc):
                try:
                    return _call_groq(groq_key, groq_model, system_instruction, messages)
                except RuntimeError as groq_exc:
                    _raise_combined_fallback_error(exc, groq_exc)
            raise

    if groq_key:
        return _call_groq(groq_key, groq_model, system_instruction, messages)

    raise RuntimeError(
        "Ask Hero is not configured. Set GEMINI_API_KEY or GROQ_API_KEY on the server."
    )


def _sanitize_chat_title(raw: str) -> str:
    title = raw.strip().strip("\"'").strip()
    title = re.sub(r"^(label|title)\s*:\s*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"\s+", " ", title).strip(" .")
    if not title:
        return "New chat"
    if len(title) > TITLE_CHAR_MAX:
        return f"{title[: TITLE_CHAR_MAX - 1]}…"
    return title


def _fallback_chat_title(message: str) -> str:
    text = message.strip()
    lower = text.lower()
    for prefix in (
        "find me ",
        "is ",
        "can you ",
        "could you ",
        "help me ",
        "tell me ",
        "what about ",
    ):
        if lower.startswith(prefix):
            text = text[len(prefix) :].strip()
            break
    for sep in ("?", ".", "!", "—", " - "):
        if sep in text:
            text = text.split(sep)[0].strip()
            break
    return _sanitize_chat_title(text)


def generate_chat_title(
    user_message: str,
    api_key: str,
    groq_key: str,
    model: str,
    groq_model: str,
) -> str:
    # Avoid a second LLM call on the first message — saves quota and prevents
    # parallel Gemini/Groq requests from tripping rate limits.
    return _fallback_chat_title(user_message)


def _run_hero_chat(
    messages: list[dict[str, str]],
    user_context: dict[str, Any],
    api_key: str,
    groq_key: str,
    model: str,
    groq_model: str,
) -> str:
    home_airport = user_context.get("homeAirport")

    last_user = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_user = msg.get("content", "")
            break

    search_results = _search_flights_for_message(last_user, home_airport)
    system_prompt = build_system_prompt(user_context)
    if search_results:
        system_prompt = f"{system_prompt}\n\n{_format_search_context(search_results)}"

    content = _call_hero_llm(
        api_key,
        groq_key,
        model,
        groq_model,
        system_prompt,
        messages,
    )

    if search_results and "<results>" not in content.lower():
        content = (
            f"{content.strip()}\n\n<results>\n"
            f"{json.dumps(search_results, indent=2)}\n</results>"
        )

    return content.strip()


def chat_with_hero(
    messages: list[dict[str, str]],
    user_context: dict[str, Any],
) -> dict[str, str | None]:
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    groq_key = (os.getenv("GROQ_API_KEY") or "").strip()
    if not api_key and not groq_key:
        raise RuntimeError(
            "Ask Hero is not configured. Set GEMINI_API_KEY or GROQ_API_KEY on the server."
        )

    model = (os.getenv("GEMINI_MODEL") or "gemini-2.5-flash-lite").strip()
    groq_model = _normalize_groq_model(os.getenv("GROQ_MODEL") or "")

    is_first_message = len(messages) == 1 and messages[0].get("role") == "user"
    first_user_message = messages[0]["content"] if is_first_message else ""

    if is_first_message:
        content = _run_hero_chat(
            messages,
            user_context,
            api_key,
            groq_key,
            model,
            groq_model,
        )
        title = generate_chat_title(
            first_user_message,
            api_key,
            groq_key,
            model,
            groq_model,
        )
    else:
        content = _run_hero_chat(
            messages,
            user_context,
            api_key,
            groq_key,
            model,
            groq_model,
        )
        title = None

    return {"content": content, "title": title}
