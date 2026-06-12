import os
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"
SERPAPI_URL = "https://serpapi.com/search.json"
_PLACE_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_PLACE_CACHE_TTL_SECONDS = 600
_PLACE_CACHE_MAX_ENTRIES = 256
_RETURN_DETAIL_LIMIT = 15
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


def _serpapi_search(params: dict[str, Any]) -> dict[str, Any]:
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


def _parse_leg(segments: list[dict[str, Any]], origin_fallback: str, destination_fallback: str) -> dict[str, Any]:
    if not segments:
        raise ValueError("SerpAPI flight is missing segments")

    first = segments[0]
    last = segments[-1]
    departure = first.get("departure_airport") or {}
    arrival = last.get("arrival_airport") or {}
    duration_minutes = sum(int(segment.get("duration") or 0) for segment in segments)

    return {
        "origin": (departure.get("id") or origin_fallback).upper(),
        "destination": (arrival.get("id") or destination_fallback).upper(),
        "departure_time": format_local_time(departure.get("time", "")),
        "arrival_time": format_local_time(arrival.get("time", "")),
        "carrier": _format_carrier_label(_segment_carrier_names(segments)),
        "flight_number": _format_flight_numbers(segments),
        "duration": format_duration_minutes(duration_minutes),
        "duration_minutes": duration_minutes,
        "stops": max(len(segments) - 1, 0),
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
) -> dict[str, Any] | None:
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
            }
        )
    except SerpAPIError:
        return None

    options = _collect_flight_options(payload)
    if not options:
        return None

    segments = options[0].get("flights") or []
    if not segments:
        return None

    try:
        return _parse_leg(segments, destination_code, origin_code)
    except ValueError:
        return None


def _parse_flight_option(
    option: dict[str, Any],
    origin_code: str,
    destination_code: str,
    departure_date: str,
    return_date: str | None,
    return_cache: dict[str, dict[str, Any] | None],
    return_fetch_count: list[int],
) -> dict[str, Any] | None:
    segments = option.get("flights") or []
    if not segments:
        return None

    outbound = _parse_leg(segments, origin_code, destination_code)
    price = option.get("price")
    if price is None:
        return None

    result: dict[str, Any] = {
        "id": option.get("departure_token") or option.get("booking_token") or "",
        "origin": outbound["origin"],
        "destination": outbound["destination"],
        "departure_date": departure_date,
        "departure_time": outbound["departure_time"],
        "arrival_time": outbound["arrival_time"],
        "carrier": outbound["carrier"],
        "flight_number": outbound["flight_number"],
        "duration": outbound["duration"],
        "duration_minutes": int(option.get("total_duration") or outbound["duration_minutes"]),
        "stops": outbound["stops"],
        "cash_price": round(float(price), 2),
    }

    if not return_date:
        return result

    departure_token = option.get("departure_token")
    if not departure_token:
        return result

    if departure_token not in return_cache:
        if return_fetch_count[0] < _RETURN_DETAIL_LIMIT:
            return_cache[departure_token] = _fetch_return_leg(
                departure_token,
                origin_code,
                destination_code,
                departure_date,
                return_date,
            )
            return_fetch_count[0] += 1
        else:
            return_cache[departure_token] = None

    inbound = return_cache.get(departure_token)
    if inbound:
        result["return_departure_time"] = inbound["departure_time"]
        result["return_arrival_time"] = inbound["arrival_time"]
        result["return_flight_number"] = inbound["flight_number"]
        result["return_stops"] = inbound["stops"]
        result["duration_minutes"] += inbound["duration_minutes"]

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
    return_cache: dict[str, dict[str, Any] | None] = {}
    return_fetch_count = [0]

    parsed: list[dict[str, Any]] = []
    for option in _collect_flight_options(payload):
        try:
            flight = _parse_flight_option(
                option,
                origin_code,
                destination_code,
                departure_date,
                return_date,
                return_cache,
                return_fetch_count,
            )
            if flight:
                parsed.append(flight)
        except ValueError:
            continue

    deduped = _dedupe_flights(parsed)
    deduped.sort(key=lambda flight: flight["cash_price"])
    return deduped[:max_results]


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
    from duffel_places import DuffelPlacesError, credentials_configured as duffel_places_configured
    from duffel_places import search_place_suggestions as duffel_search_place_suggestions

    if duffel_places_configured():
        try:
            return duffel_search_place_suggestions(query, limit)
        except DuffelPlacesError:
            pass

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
