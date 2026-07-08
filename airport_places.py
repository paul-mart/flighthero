import json
import time
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).resolve().parent / "data" / "airports.json"
METRO_DATA_PATH = Path(__file__).resolve().parent / "data" / "metroCodes.json"
_PLACE_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_PLACE_CACHE_TTL_SECONDS = 600
_PLACE_CACHE_MAX_ENTRIES = 256
_airports_by_iata: dict[str, dict[str, Any]] | None = None
_metros_by_code: list[dict[str, Any]] | None = None


def data_available() -> bool:
    return DATA_PATH.exists()


def get_airport_name(iata: str) -> str | None:
    if not data_available():
        return None
    entry = _load_airports().get(iata.strip().upper())
    if not entry:
        return None
    name = (entry.get("name") or "").strip()
    return name or None


def get_airport_timezone(iata: str) -> str | None:
    if not data_available():
        return None
    entry = _load_airports().get(iata.strip().upper())
    if not entry:
        return None
    tz = (entry.get("tz") or "").strip()
    return tz or None


def _load_airports() -> dict[str, dict[str, Any]]:
    global _airports_by_iata
    if _airports_by_iata is not None:
        return _airports_by_iata

    with DATA_PATH.open(encoding="utf-8") as handle:
        raw = json.load(handle)

    by_iata: dict[str, dict[str, Any]] = {}
    for entry in raw.values():
        iata = (entry.get("iata") or "").strip().upper()
        if len(iata) != 3 or not iata.isalpha():
            continue
        if iata not in by_iata:
            by_iata[iata] = entry

    _airports_by_iata = by_iata
    return by_iata


def _load_metros() -> list[dict[str, Any]]:
    global _metros_by_code
    if _metros_by_code is not None:
        return _metros_by_code

    if not METRO_DATA_PATH.exists():
        _metros_by_code = []
        return _metros_by_code

    with METRO_DATA_PATH.open(encoding="utf-8") as handle:
        raw = json.load(handle)

    metros: list[dict[str, Any]] = []
    for entry in raw:
        code = (entry.get("code") or "").strip().upper()
        name = (entry.get("name") or "").strip()
        airports = [
            code.strip().upper()
            for code in entry.get("airports") or []
            if isinstance(code, str) and len(code.strip()) == 3
        ]
        if len(code) != 3 or not name or not airports:
            continue
        metros.append(
            {
                "code": code,
                "name": name,
                "country": (entry.get("country") or "").strip().upper(),
                "airports": airports,
                "keywords": [
                    keyword.strip().lower()
                    for keyword in entry.get("keywords") or []
                    if isinstance(keyword, str) and keyword.strip()
                ],
            }
        )

    _metros_by_code = metros
    return _metros_by_code


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


def _score_metro(metro: dict[str, Any], query: str) -> int:
    code = metro["code"]
    name = metro["name"].lower()
    query_lower = query.lower()
    query_upper = query.upper()

    if code == query_upper:
        return 1100
    if len(query_upper) >= 2 and code.startswith(query_upper):
        return 950
    if name == query_lower:
        return 900
    if len(query_lower) >= 3 and name.startswith(query_lower):
        return 850
    for keyword in metro.get("keywords") or []:
        if keyword == query_lower:
            return 820
        if len(query_lower) >= 3 and keyword.startswith(query_lower):
            return 780
        if len(query_lower) >= 4 and query_lower in keyword:
            return 650
    if len(query_lower) >= 4 and query_lower in name:
        return 700
    return 0


def _score_airport(airport: dict[str, Any], query: str) -> int:
    iata = (airport.get("iata") or "").upper()
    iata_query = query.upper()
    name = (airport.get("name") or "").lower()
    city = (airport.get("city") or "").lower()
    state = (airport.get("state") or "").lower()
    country = (airport.get("country") or "").upper()

    if iata == iata_query:
        return 1000
    if len(iata_query) >= 2 and iata.startswith(iata_query):
        return 900
    if city == query:
        return 800
    if len(query) >= 3 and city.startswith(query):
        return 700
    if len(query) >= 3 and state.startswith(query):
        return 600
    if len(query) >= 3 and name.startswith(query):
        return 550
    if len(query) >= 4 and query in city:
        return 450
    if len(query) >= 4 and query in name:
        return 400
    if country.lower() == query:
        return 250
    return 0


def _format_metro_suggestion(metro: dict[str, Any]) -> dict[str, Any]:
    airport_list = ", ".join(metro["airports"])
    return {
        "id": f"metro-{metro['code']}",
        "code": metro["code"],
        "name": metro["name"],
        "subtitle": f"All {metro['name']} airports ({airport_list})",
        "type": "city",
    }


def _format_suggestion(airport: dict[str, Any]) -> dict[str, Any]:
    iata = airport["iata"].upper()
    name = (airport.get("name") or iata).strip()
    city = (airport.get("city") or "").strip()
    state = (airport.get("state") or "").strip()
    country = (airport.get("country") or "").strip()

    display_name = city or name
    location_parts = [part for part in [state or country, country] if part]
    subtitle_parts = [part for part in [name, ", ".join(dict.fromkeys(location_parts))] if part and part != display_name]
    subtitle = ", ".join(subtitle_parts) if subtitle_parts else name

    return {
        "id": iata,
        "code": iata,
        "name": display_name,
        "subtitle": subtitle,
        "type": "airport",
    }


def search_place_suggestions(query: str, limit: int = 8) -> list[dict[str, Any]]:
    if not data_available():
        raise FileNotFoundError(f"Airport dataset not found at {DATA_PATH}")

    trimmed = query.strip()
    if len(trimmed) < 2:
        return []

    cached = _read_place_cache(trimmed)
    if cached is not None:
        return cached[:limit]

    normalized = trimmed.lower()
    ranked: list[tuple[int, str, str, dict[str, Any]]] = []

    for metro in _load_metros():
        score = _score_metro(metro, normalized)
        if score:
            ranked.append((score, metro["code"], "metro", metro))

    for airport in _load_airports().values():
        score = _score_airport(airport, normalized)
        if score:
            ranked.append((score, airport["iata"], "airport", airport))

    ranked.sort(key=lambda item: (-item[0], item[1]))

    results: list[dict[str, Any]] = []
    for _, _, kind, item in ranked[:limit]:
        if kind == "metro":
            results.append(_format_metro_suggestion(item))
        else:
            results.append(_format_suggestion(item))

    _write_place_cache(trimmed, results)
    return results
