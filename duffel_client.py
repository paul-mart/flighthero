import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"
DUFFEL_API_URL = "https://api.duffel.com"

CABIN_CLASS_MAP = {
    "economy": "economy",
    "premium-economy": "premium_economy",
    "business": "business",
    "first": "first",
}


def _load_env() -> None:
    load_dotenv(ENV_PATH, override=True)


def _get_settings() -> dict[str, str]:
    _load_env()
    return {
        "access_token": (os.getenv("DUFFEL_ACCESS_TOKEN") or "").strip(),
        "api_version": (os.getenv("DUFFEL_API_VERSION") or "v2").strip(),
    }


class DuffelConfigError(Exception):
    pass


class DuffelAPIError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def credentials_configured() -> bool:
    return bool(_get_settings()["access_token"])


def normalize_airport_code(value: str) -> str:
    cleaned = value.strip().upper()
    match = re.search(r"\b([A-Z]{3})\b", cleaned)
    if match:
        return match.group(1)
    if len(cleaned) == 3 and cleaned.isalpha():
        return cleaned
    raise ValueError(f"Invalid airport code: {value}")


def format_duration(iso_duration: str) -> str:
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?", iso_duration or "")
    if not match:
        return iso_duration or "—"
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    parts: list[str] = []
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    return " ".join(parts) if parts else "—"


def parse_duration_minutes(iso_duration: str) -> int:
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?", iso_duration or "")
    if not match:
        return 0
    return int(match.group(1) or 0) * 60 + int(match.group(2) or 0)


def total_trip_duration_minutes(slices: list[dict[str, Any]]) -> int:
    total = 0
    for slice_data in slices:
        total += parse_duration_minutes(slice_data.get("duration", ""))
    return total


def format_local_time(iso_at: str) -> str:
    if not iso_at:
        return ""
    try:
        dt = datetime.fromisoformat(iso_at.replace("Z", "+00:00"))
    except ValueError:
        return iso_at
    hour = dt.hour % 12 or 12
    suffix = "AM" if dt.hour < 12 else "PM"
    return f"{hour}:{dt.minute:02d} {suffix}"


def _build_passengers(adults: int, children: int) -> list[dict[str, str]]:
    passengers: list[dict[str, str]] = [{"type": "adult"} for _ in range(adults)]
    passengers.extend({"type": "child"} for _ in range(children))
    return passengers


def _build_slices(
    origin_code: str,
    destination_code: str,
    departure_date: str,
    return_date: str | None,
) -> list[dict[str, str]]:
    slices = [
        {
            "origin": origin_code,
            "destination": destination_code,
            "departure_date": departure_date,
        }
    ]
    if return_date:
        slices.append(
            {
                "origin": destination_code,
                "destination": origin_code,
                "departure_date": return_date,
            }
        )
    return slices


def _duffel_headers(settings: dict[str, str]) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings['access_token']}",
        "Duffel-Version": settings["api_version"],
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _raise_for_duffel_error(response: httpx.Response, fallback: str) -> None:
    detail = fallback
    try:
        errors = response.json().get("errors") or []
        if errors:
            detail = errors[0].get("message") or errors[0].get("title") or detail
    except ValueError:
        detail = response.text or fallback
    raise DuffelAPIError(detail, status_code=response.status_code)


def _segment_carrier_names(segments: list[dict[str, Any]]) -> list[str]:
    names: list[str] = []
    for segment in segments:
        carrier = segment.get("marketing_carrier") or segment.get("operating_carrier") or {}
        name = carrier.get("name")
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
        code = (segment.get("marketing_carrier") or {}).get("iata_code", "")
        number = segment.get("marketing_carrier_flight_number", "")
        if code and number:
            numbers.append(f"{code} {number}")
    return " · ".join(numbers)


def _parse_offer(
    offer: dict[str, Any],
    origin: str,
    destination: str,
    departure_date: str,
) -> dict[str, Any]:
    slices = offer.get("slices") or []
    if not slices:
        raise ValueError("Duffel offer is missing slices")

    outbound = slices[0]
    segments = outbound.get("segments") or []
    if not segments:
        raise ValueError("Duffel offer is missing segments")

    first_segment = segments[0]
    last_segment = segments[-1]
    carrier_names = _segment_carrier_names(segments)
    owner = offer.get("owner") or {}
    if owner.get("name") and owner["name"] not in carrier_names:
        carrier_names.insert(0, owner["name"])

    origin_code = (
        (first_segment.get("origin") or {}).get("iata_code")
        or (first_segment.get("origin") or {}).get("iata_city_code")
        or origin
    )
    destination_code = (
        (last_segment.get("destination") or {}).get("iata_code")
        or (last_segment.get("destination") or {}).get("iata_city_code")
        or destination
    )

    return {
        "id": offer.get("id", ""),
        "origin": origin_code,
        "destination": destination_code,
        "departure_date": departure_date,
        "departure_time": format_local_time(first_segment.get("departing_at", "")),
        "arrival_time": format_local_time(last_segment.get("arriving_at", "")),
        "carrier": _format_carrier_label(carrier_names),
        "flight_number": _format_flight_numbers(segments),
        "duration": format_duration(outbound.get("duration") or first_segment.get("duration", "")),
        "duration_minutes": total_trip_duration_minutes(slices),
        "stops": max(len(segments) - 1, 0),
        "cash_price": round(float(offer.get("total_amount") or 0), 2),
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
    settings = _get_settings()
    if not settings["access_token"]:
        raise DuffelConfigError(
            "Duffel access token is missing. Set DUFFEL_ACCESS_TOKEN in your .env file."
        )

    origin_code = normalize_airport_code(origin)
    destination_code = normalize_airport_code(destination)

    payload = {
        "data": {
            "slices": _build_slices(origin_code, destination_code, departure_date, return_date),
            "passengers": _build_passengers(adults, children),
            "cabin_class": CABIN_CLASS_MAP.get(cabin_class, "economy"),
        }
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{DUFFEL_API_URL}/air/offer_requests",
            params={"return_offers": "true"},
            headers=_duffel_headers(settings),
            json=payload,
        )

    if response.status_code not in (200, 201):
        _raise_for_duffel_error(response, "Duffel flight search failed.")

    offer_request = response.json().get("data") or {}
    offers = offer_request.get("offers") or []

    results: list[dict[str, Any]] = []
    for offer in offers[:max_results]:
        try:
            results.append(
                _parse_offer(
                    offer,
                    origin_code,
                    destination_code,
                    departure_date,
                )
            )
        except ValueError:
            continue

    return results
