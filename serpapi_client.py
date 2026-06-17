import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from html import escape
from json import dumps as json_dumps
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus

import httpx
from dotenv import load_dotenv

from flight_itinerary import parse_serpapi_itinerary
from flight_times import build_flight_time_fields

ENV_PATH = Path(__file__).resolve().parent / ".env"
SERPAPI_URL = "https://serpapi.com/search.json"
_PLACE_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_PLACE_CACHE_TTL_SECONDS = 600
_PLACE_CACHE_MAX_ENTRIES = 256
_RETURN_DETAIL_LIMIT = 50
_RETURN_FETCH_WORKERS = 6
_http_client: httpx.Client | None = None

TRAVEL_CLASS_MAP = {
    "economy": "1",
    "premium-economy": "2",
    "business": "3",
    "first": "4",
}


def _load_env() -> None:
    load_dotenv(ENV_PATH, override=True)


def _get_settings() -> dict[str, str]:
    _load_env()
    return {
        "api_key": (os.getenv("SERPAPI_API_KEY") or "").strip(),
        "currency": (os.getenv("SERPAPI_CURRENCY") or "USD").strip().upper(),
        "gl": (os.getenv("SERPAPI_GL") or "us").strip().lower(),
        "hl": (os.getenv("SERPAPI_HL") or "en").strip().lower(),
    }


class SerpAPIConfigError(Exception):
    pass


class SerpAPIError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def credentials_configured() -> bool:
    return bool(_get_settings()["api_key"])


def _get_http_client() -> httpx.Client:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.Client(timeout=90.0)
    return _http_client


def _read_place_cache(query: str) -> list[dict[str, Any]] | None:
    key = query.strip().lower()
    cached = _PLACE_CACHE.get(key)
    if not cached:
        return None
    cached_at, results = cached
    if time.time() - cached_at > _PLACE_CACHE_TTL_SECONDS:
        _PLACE_CACHE.pop(key, None)
        return None
    return results


def _write_place_cache(query: str, results: list[dict[str, Any]]) -> None:
    key = query.strip().lower()
    _PLACE_CACHE[key] = (time.time(), results)
    if len(_PLACE_CACHE) <= _PLACE_CACHE_MAX_ENTRIES:
        return
    oldest_key = min(_PLACE_CACHE, key=lambda item: _PLACE_CACHE[item][0])
    _PLACE_CACHE.pop(oldest_key, None)


def normalize_airport_code(value: str) -> str:
    cleaned = value.strip().upper()
    trailing_code = re.search(r"\(([A-Z]{3})\)\s*$", cleaned)
    if trailing_code:
        return trailing_code.group(1)
    paren_codes = re.findall(r"\(([A-Z]{3})\)", cleaned)
    if paren_codes:
        return paren_codes[-1]
    match = re.search(r"\b([A-Z]{3})\b", cleaned)
    if match:
        return match.group(1)
    if len(cleaned) == 3 and cleaned.isalpha():
        return cleaned
    raise ValueError(f"Invalid airport code: {value}")


def format_duration_minutes(minutes: int) -> str:
    hours = minutes // 60
    mins = minutes % 60
    parts: list[str] = []
    if hours:
        parts.append(f"{hours}h")
    if mins:
        parts.append(f"{mins}m")
    return " ".join(parts) if parts else "—"


def format_local_time(value: str) -> str:
    if not value:
        return ""
    cleaned = value.strip().split("+")[0].strip()
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"):
        try:
            dt = datetime.strptime(cleaned, fmt)
            break
        except ValueError:
            dt = None
    if dt is None:
        try:
            dt = datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
        except ValueError:
            return value
    hour = dt.hour % 12 or 12
    suffix = "AM" if dt.hour < 12 else "PM"
    return f"{hour}:{dt.minute:02d} {suffix}"


def _raise_for_serpapi_error(payload: dict[str, Any], http_status: int, fallback: str) -> None:
    detail = fallback
    status_code = http_status

    metadata = payload.get("search_metadata") or {}
    if metadata.get("status") == "Error":
        detail = metadata.get("error") or payload.get("error") or detail

    if isinstance(payload.get("error"), str):
        detail = payload["error"]

    lowered = detail.lower()
    if "quota" in lowered or "limit" in lowered or "run out" in lowered:
        status_code = 429
        detail = "SerpAPI quota reached. Check your plan at serpapi.com/dashboard."

    raise SerpAPIError(detail, status_code=status_code)


def _serpapi_search(params: dict[str, Any], *, client: httpx.Client | None = None) -> dict[str, Any]:
    settings = _get_settings()
    if not settings["api_key"]:
        raise SerpAPIConfigError(
            "SerpAPI key is missing. Set SERPAPI_API_KEY in your .env file."
        )

    query = {
        "api_key": settings["api_key"],
        "currency": settings["currency"],
        "gl": settings["gl"],
        "hl": settings["hl"],
        **params,
    }

    if client is None:
        client = _get_http_client()
    response = client.get(SERPAPI_URL, params=query)

    try:
        payload = response.json()
    except ValueError as exc:
        raise SerpAPIError(
            "SerpAPI returned an invalid response.",
            status_code=response.status_code,
        ) from exc

    if response.status_code != 200:
        _raise_for_serpapi_error(payload, response.status_code, "SerpAPI request failed.")

    metadata = payload.get("search_metadata") or {}
    if metadata.get("status") == "Error":
        _raise_for_serpapi_error(payload, 502, "SerpAPI search failed.")

    return payload


def _segment_carrier_names(segments: list[dict[str, Any]]) -> list[str]:
    names: list[str] = []
    for segment in segments:
        name = (segment.get("airline") or "").strip()
        if name and name not in names:
            names.append(name)
    return names


def _segment_carrier_logos(segments: list[dict[str, Any]]) -> list[str]:
    logos: list[str] = []
    for segment in segments:
        logo = (segment.get("airline_logo") or "").strip()
        if logo and logo not in logos:
            logos.append(logo)
    return logos


def _format_carrier_label(names: list[str]) -> str:
    if not names:
        return "Unknown"
    label = " / ".join(names[:2])
    if len(names) > 2:
        label += f" +{len(names) - 2}"
    return label


def _format_flight_numbers(segments: list[dict[str, Any]]) -> str:
    numbers: list[str] = []
    for segment in segments:
        number = (segment.get("flight_number") or "").strip()
        if number and number not in numbers:
            numbers.append(number)
    return " · ".join(numbers)


def _parse_leg(
    segments: list[dict[str, Any]],
    origin_fallback: str,
    destination_fallback: str,
    travel_date: str = "",
    layovers: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    if not segments:
        raise ValueError("SerpAPI flight is missing segments")

    first = segments[0]
    last = segments[-1]
    departure = first.get("departure_airport") or {}
    arrival = last.get("arrival_airport") or {}
    duration_minutes = sum(int(segment.get("duration") or 0) for segment in segments)

    origin = (departure.get("id") or origin_fallback).upper()
    destination = (arrival.get("id") or destination_fallback).upper()
    dep_raw = str(departure.get("time") or "")
    arr_raw = str(arrival.get("time") or "")

    dep_fields = build_flight_time_fields(dep_raw, origin, travel_date)
    arr_fields = build_flight_time_fields(arr_raw, destination, travel_date)

    return {
        "origin": origin,
        "destination": destination,
        "departure_time": dep_fields["time"] or format_local_time(dep_raw),
        "arrival_time": arr_fields["time"] or format_local_time(arr_raw),
        "departure_timezone": dep_fields["timezone"],
        "arrival_timezone": arr_fields["timezone"],
        "departure_at": dep_fields["at"],
        "arrival_at": arr_fields["at"],
        "carrier": _format_carrier_label(_segment_carrier_names(segments)),
        "carrier_logos": _segment_carrier_logos(segments),
        "flight_number": _format_flight_numbers(segments),
        "duration": format_duration_minutes(duration_minutes),
        "duration_minutes": duration_minutes,
        "stops": max(len(segments) - 1, 0),
        "itinerary": parse_serpapi_itinerary(segments, layovers, travel_date),
    }


def _collect_flight_options(payload: dict[str, Any]) -> list[dict[str, Any]]:
    options: list[dict[str, Any]] = []
    for key in ("best_flights", "other_flights"):
        options.extend(payload.get(key) or [])
    return options


def _fetch_return_leg(
    departure_token: str,
    origin_code: str,
    destination_code: str,
    departure_date: str,
    return_date: str,
    *,
    client: httpx.Client | None = None,
) -> dict[str, Any] | None:
    owns_client = client is None
    if owns_client:
        client = httpx.Client(timeout=90.0)
    try:
        payload = _serpapi_search(
            {
                "engine": "google_flights",
                "departure_id": origin_code,
                "arrival_id": destination_code,
                "outbound_date": departure_date,
                "return_date": return_date,
                "type": "1",
                "departure_token": departure_token,
            },
            client=client,
        )
    except SerpAPIError:
        return None
    finally:
        if owns_client:
            client.close()

    options = _collect_flight_options(payload)
    if not options:
        return None

    option = options[0]
    segments = option.get("flights") or []
    if not segments:
        return None

    try:
        return _parse_leg(
            segments,
            destination_code,
            origin_code,
            return_date,
            option.get("layovers"),
        )
    except ValueError:
        return None


def _fetch_return_legs_parallel(
    departure_tokens: list[str],
    origin_code: str,
    destination_code: str,
    departure_date: str,
    return_date: str,
) -> dict[str, dict[str, Any] | None]:
    if not departure_tokens:
        return {}

    cache: dict[str, dict[str, Any] | None] = {}
    workers = min(_RETURN_FETCH_WORKERS, len(departure_tokens))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(
                _fetch_return_leg,
                token,
                origin_code,
                destination_code,
                departure_date,
                return_date,
            ): token
            for token in departure_tokens
        }
        for future in as_completed(futures):
            token = futures[future]
            try:
                cache[token] = future.result()
            except Exception:
                cache[token] = None

    return cache


def _attach_return_leg(flight: dict[str, Any], inbound: dict[str, Any]) -> None:
    flight["return_departure_time"] = inbound["departure_time"]
    flight["return_arrival_time"] = inbound["arrival_time"]
    flight["return_departure_timezone"] = inbound.get("departure_timezone", "")
    flight["return_arrival_timezone"] = inbound.get("arrival_timezone", "")
    flight["return_departure_at"] = inbound.get("departure_at", "")
    flight["return_arrival_at"] = inbound.get("arrival_at", "")
    flight["return_flight_number"] = inbound["flight_number"]
    flight["return_carrier"] = inbound["carrier"]
    flight["return_stops"] = inbound["stops"]
    flight["return_itinerary"] = inbound.get("itinerary")
    flight["duration_minutes"] += inbound["duration_minutes"]


def _parse_flight_option(
    option: dict[str, Any],
    origin_code: str,
    destination_code: str,
    departure_date: str,
    return_cache: dict[str, dict[str, Any] | None] | None = None,
) -> dict[str, Any] | None:
    segments = option.get("flights") or []
    if not segments:
        return None

    outbound = _parse_leg(segments, origin_code, destination_code, departure_date, option.get("layovers"))
    price = option.get("price")
    if price is None:
        return None

    departure_token = option.get("departure_token")

    result: dict[str, Any] = {
        "id": departure_token or option.get("booking_token") or "",
        "departure_token": departure_token,
        "booking_token": option.get("booking_token") or "",
        "origin": outbound["origin"],
        "destination": outbound["destination"],
        "departure_date": departure_date,
        "departure_time": outbound["departure_time"],
        "arrival_time": outbound["arrival_time"],
        "departure_timezone": outbound.get("departure_timezone", ""),
        "arrival_timezone": outbound.get("arrival_timezone", ""),
        "departure_at": outbound.get("departure_at", ""),
        "arrival_at": outbound.get("arrival_at", ""),
        "carrier": outbound["carrier"],
        "carrier_logos": outbound["carrier_logos"]
        or ([option["airline_logo"]] if option.get("airline_logo") else []),
        "flight_number": outbound["flight_number"],
        "duration": outbound["duration"],
        "duration_minutes": int(option.get("total_duration") or outbound["duration_minutes"]),
        "stops": outbound["stops"],
        "itinerary": outbound["itinerary"],
        "cash_price": round(float(price), 2),
    }

    if return_cache and departure_token:
        inbound = return_cache.get(departure_token)
        if inbound:
            _attach_return_leg(result, inbound)

    return result


def _flight_identity_key(flight: dict[str, Any]) -> tuple[Any, ...]:
    key: tuple[Any, ...] = (
        flight["origin"],
        flight["destination"],
        flight["departure_date"],
        flight["departure_time"],
        flight["arrival_time"],
        flight["flight_number"],
        flight["stops"],
    )
    if flight.get("return_flight_number"):
        key += (
            flight.get("return_departure_time", ""),
            flight.get("return_arrival_time", ""),
            flight["return_flight_number"],
            flight.get("return_stops", 0),
        )
    return key


def _dedupe_flights(flights: list[dict[str, Any]]) -> list[dict[str, Any]]:
    best_by_key: dict[tuple[Any, ...], dict[str, Any]] = {}
    for flight in flights:
        key = _flight_identity_key(flight)
        existing = best_by_key.get(key)
        if existing is None or flight["cash_price"] < existing["cash_price"]:
            best_by_key[key] = flight
    return list(best_by_key.values())


def _return_leg_fields(inbound: dict[str, Any]) -> dict[str, Any]:
    return {
        "return_departure_time": inbound["departure_time"],
        "return_arrival_time": inbound["arrival_time"],
        "return_departure_timezone": inbound.get("departure_timezone", ""),
        "return_arrival_timezone": inbound.get("arrival_timezone", ""),
        "return_departure_at": inbound.get("departure_at", ""),
        "return_arrival_at": inbound.get("arrival_at", ""),
        "return_flight_number": inbound["flight_number"],
        "return_carrier": inbound["carrier"],
        "return_stops": inbound["stops"],
        "return_duration_minutes": inbound["duration_minutes"],
        "return_itinerary": inbound.get("itinerary"),
    }


def fetch_return_legs(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str,
    departure_tokens: list[str],
    max_tokens: int = _RETURN_DETAIL_LIMIT,
) -> dict[str, dict[str, Any]]:
    origin_code = normalize_airport_code(origin)
    destination_code = normalize_airport_code(destination)

    tokens_to_fetch: list[str] = []
    seen_tokens: set[str] = set()
    for token in departure_tokens:
        cleaned = (token or "").strip()
        if not cleaned or cleaned in seen_tokens:
            continue
        seen_tokens.add(cleaned)
        tokens_to_fetch.append(cleaned)
        if len(tokens_to_fetch) >= max_tokens:
            break

    if not tokens_to_fetch:
        return {}

    cache = _fetch_return_legs_parallel(
        tokens_to_fetch,
        origin_code,
        destination_code,
        departure_date,
        return_date,
    )
    return {
        token: _return_leg_fields(inbound)
        for token, inbound in cache.items()
        if inbound
    }


def search_flight_offers(
    origin: str,
    destination: str,
    departure_date: str,
    adults: int = 1,
    children: int = 0,
    return_date: str | None = None,
    cabin_class: str = "economy",
    max_results: int = 50,
) -> list[dict[str, Any]]:
    origin_code = normalize_airport_code(origin)
    destination_code = normalize_airport_code(destination)

    params: dict[str, Any] = {
        "engine": "google_flights",
        "departure_id": origin_code,
        "arrival_id": destination_code,
        "outbound_date": departure_date,
        "type": "1" if return_date else "2",
        "travel_class": TRAVEL_CLASS_MAP.get(cabin_class, "1"),
        "adults": adults,
        "children": children,
    }
    if return_date:
        params["return_date"] = return_date

    payload = _serpapi_search(params)
    options = _collect_flight_options(payload)

    parsed: list[dict[str, Any]] = []
    for option in options:
        try:
            flight = _parse_flight_option(
                option,
                origin_code,
                destination_code,
                departure_date,
            )
            if flight:
                parsed.append(flight)
        except ValueError:
            continue

    deduped = _dedupe_flights(parsed)
    deduped.sort(key=lambda flight: flight["cash_price"])
    return deduped[:max_results]


def build_google_flights_search_url(
    origin_code: str,
    destination_code: str,
    departure_date: str,
    return_date: str | None = None,
) -> str:
    query = f"Flights from {origin_code} to {destination_code} on {departure_date}"
    if return_date:
        query += f" returning {return_date}"
    return f"https://www.google.com/travel/flights?q={quote_plus(query)}"


def _extract_booking_option(option: dict[str, Any]) -> dict[str, Any] | None:
    together = option.get("together")
    if isinstance(together, dict):
        return together
    if isinstance(option, dict) and option.get("booking_request"):
        return option
    return None


def fetch_preferred_booking_request(
    booking_token: str,
    origin_code: str,
    destination_code: str,
    departure_date: str,
    return_date: str | None = None,
) -> dict[str, Any]:
    params: dict[str, Any] = {
        "engine": "google_flights",
        "departure_id": origin_code,
        "arrival_id": destination_code,
        "outbound_date": departure_date,
        "booking_token": booking_token,
        "type": "1" if return_date else "2",
    }
    if return_date:
        params["return_date"] = return_date

    payload = _serpapi_search(params)
    options = payload.get("booking_options") or []

    airline_option: dict[str, Any] | None = None
    fallback_option: dict[str, Any] | None = None
    for option in options:
        candidate = _extract_booking_option(option)
        if not candidate:
            continue
        booking_request = candidate.get("booking_request") or {}
        if not booking_request.get("url") or not booking_request.get("post_data"):
            continue
        if fallback_option is None:
            fallback_option = candidate
        if candidate.get("airline"):
            airline_option = candidate
            break

    chosen = airline_option or fallback_option
    if not chosen:
        raise SerpAPIError("No booking options were returned for this flight.")

    booking_request = chosen["booking_request"]
    return {
        "book_with": chosen.get("book_with") or chosen.get("option_title") or "Partner",
        "price": chosen.get("price"),
        "booking_request": booking_request,
    }


def build_booking_redirect_html(url: str, post_data: str) -> str:
    payload = post_data[2:] if post_data.startswith("u=") else post_data
    safe_url = json_dumps(url)
    safe_payload = json_dumps(payload)
    title = escape("Redirecting to booking…")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <style>
    body {{
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
      color: #334155;
    }}
    p {{ font-size: 16px; }}
  </style>
</head>
<body>
  <p>Redirecting to booking partner…</p>
  <script>
    (function () {{
      var form = document.createElement("form");
      form.method = "POST";
      form.action = {safe_url};
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = "u";
      input.value = {safe_payload};
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    }})();
  </script>
</body>
</html>"""


def _format_airport_suggestion(
    code: str,
    name: str,
    city: str = "",
    description: str = "",
) -> dict[str, Any] | None:
    airport_code = code.strip().upper()
    if not re.fullmatch(r"[A-Z]{3}", airport_code):
        return None

    airport_name = name.strip() or airport_code
    city_name = city.strip()
    display_name = city_name or airport_name
    subtitle_parts = [part for part in [airport_name, description] if part and part != display_name]
    subtitle = ", ".join(subtitle_parts) if subtitle_parts else airport_name

    return {
        "id": airport_code,
        "code": airport_code,
        "name": display_name,
        "subtitle": subtitle,
        "type": "airport",
    }


def search_place_suggestions(query: str, limit: int = 8) -> list[dict[str, Any]]:
    trimmed = query.strip()
    if len(trimmed) < 2:
        return []

    cached = _read_place_cache(trimmed)
    if cached is not None:
        return cached[:limit]

    payload = _serpapi_search(
        {
            "engine": "google_flights_autocomplete",
            "q": trimmed,
        }
    )

    seen_codes: set[str] = set()
    results: list[dict[str, Any]] = []

    def add_suggestion(suggestion: dict[str, Any] | None) -> None:
        if not suggestion or suggestion["code"] in seen_codes:
            return
        seen_codes.add(suggestion["code"])
        results.append(suggestion)

    for entry in payload.get("suggestions") or []:
        for airport in entry.get("airports") or []:
            add_suggestion(
                _format_airport_suggestion(
                    airport.get("id", ""),
                    airport.get("name", ""),
                    airport.get("city", ""),
                    entry.get("description", ""),
                )
            )

        entry_id = (entry.get("id") or "").strip()
        if re.fullmatch(r"[A-Za-z]{3}", entry_id):
            add_suggestion(
                _format_airport_suggestion(
                    entry_id,
                    entry.get("name", ""),
                    description=entry.get("description", ""),
                )
            )

    _write_place_cache(trimmed, results)
    return results[:limit]
