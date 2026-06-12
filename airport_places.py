import json
import time
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).resolve().parent / "data" / "airports.json"
_PLACE_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_PLACE_CACHE_TTL_SECONDS = 600
_PLACE_CACHE_MAX_ENTRIES = 256
_airports_by_iata: dict[str, dict[str, Any]] | None = None


def data_available() -> bool:
    return DATA_PATH.exists()


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
    airports = _load_airports()
    ranked: list[tuple[int, str, dict[str, Any]]] = []

    for airport in airports.values():
        score = _score_airport(airport, normalized)
        if score:
            ranked.append((score, airport["iata"], airport))

    ranked.sort(key=lambda item: (-item[0], item[1]))
    results = [_format_suggestion(airport) for _, _, airport in ranked[:limit]]

    _write_place_cache(trimmed, results)
    return results
