from __future__ import annotations

from typing import Any

from airport_places import get_airport_name
from flight_times import parse_flight_datetime


def _airport_label(airport: dict[str, Any], code: str) -> str:
    name = (airport.get("name") or "").strip()
    if name:
        return name
    return get_airport_name(code) or code


def _layover_from_times(
    arrival_raw: str,
    next_departure_raw: str,
    date_hint: str,
) -> int | None:
    arrival = parse_flight_datetime(arrival_raw, date_hint)
    departure = parse_flight_datetime(next_departure_raw, date_hint)
    if not arrival or not departure:
        return None
    minutes = int((departure - arrival).total_seconds() // 60)
    if minutes < 0:
        minutes += 24 * 60
    return minutes if minutes > 0 else None


def _layover_lookup(
    layovers: list[dict[str, Any]] | None,
    index: int,
    airport: str,
) -> tuple[int | None, str]:
    if not layovers:
        return None, ""
    if index < len(layovers):
        layover = layovers[index]
        duration = int(layover.get("duration") or 0)
        name = (layover.get("name") or "").strip()
        return (duration if duration > 0 else None), name
    for layover in layovers:
        if (layover.get("id") or "").upper() == airport:
            duration = int(layover.get("duration") or 0)
            name = (layover.get("name") or "").strip()
            return (duration if duration > 0 else None), name
    return None, ""


def parse_serpapi_itinerary(
    segments: list[dict[str, Any]],
    layovers: list[dict[str, Any]] | None,
    travel_date: str,
) -> dict[str, Any]:
    nodes: list[dict[str, Any]] = []
    segment_rows: list[dict[str, Any]] = []

    for index, segment in enumerate(segments):
        departure = segment.get("departure_airport") or {}
        arrival = segment.get("arrival_airport") or {}
        dep_code = (departure.get("id") or "").upper()
        arr_code = (arrival.get("id") or "").upper()
        duration = int(segment.get("duration") or 0)
        is_last_segment = index >= len(segments) - 1

        if index == 0 and dep_code:
            nodes.append(
                {
                    "airport": dep_code,
                    "airport_name": _airport_label(departure, dep_code),
                    "is_layover": False,
                }
            )

        segment_rows.append(
            {
                "duration_minutes": duration,
                "flight_number": (segment.get("flight_number") or "").strip(),
                "carrier": (segment.get("airline") or "").strip(),
            }
        )

        layover_name = ""
        layover_minutes: int | None = None
        if not is_last_segment:
            layover_minutes, layover_name = _layover_lookup(layovers, index, arr_code)
            if layover_minutes is None:
                next_departure = segments[index + 1].get("departure_airport") or {}
                layover_minutes = _layover_from_times(
                    str(arrival.get("time") or ""),
                    str(next_departure.get("time") or ""),
                    travel_date,
                )

        node: dict[str, Any] = {
            "airport": arr_code,
            "airport_name": layover_name or _airport_label(arrival, arr_code),
            "is_layover": not is_last_segment,
        }
        if layover_minutes:
            node["layover_minutes"] = layover_minutes
        nodes.append(node)

    return {"nodes": nodes, "segments": segment_rows, "partial": False}


def build_basic_itinerary(
    origin: str,
    destination: str,
    duration_minutes: int | None,
    stops: int,
) -> dict[str, Any]:
    origin_code = (origin or "").upper()
    destination_code = (destination or "").upper()
    safe_stops = max(int(stops or 0), 0)
    total = max(int(duration_minutes or 0), 0)

    nodes: list[dict[str, Any]] = [
        {
            "airport": origin_code,
            "airport_name": get_airport_name(origin_code) or origin_code,
            "is_layover": False,
        },
        {
            "airport": destination_code,
            "airport_name": get_airport_name(destination_code) or destination_code,
            "is_layover": False,
        },
    ]

    return {
        "nodes": nodes,
        "segments": [{"duration_minutes": total}],
        "partial": safe_stops > 0,
    }
