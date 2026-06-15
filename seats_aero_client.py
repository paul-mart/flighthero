import os
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

from flight_times import build_flight_time_fields
from serpapi_client import format_duration_minutes, normalize_airport_code

ENV_PATH = Path(__file__).resolve().parent / ".env"
SEATS_AERO_URL = "https://seats.aero/partnerapi/search"
_http_client: httpx.Client | None = None

CABIN_MAP = {
    "economy": "Y",
    "premium-economy": "W",
    "business": "J",
    "first": "F",
}

CABIN_TRIP_NAMES = {
    "Y": ("Economy", "economy"),
    "W": ("Premium Economy", "premium economy"),
    "J": ("Business", "business"),
    "F": ("First", "first"),
}

AIRLINE_NAMES: dict[str, str] = {
    "AA": "American Airlines",
    "AS": "Alaska Airlines",
    "B6": "JetBlue",
    "BA": "British Airways",
    "DL": "Delta Air Lines",
    "UA": "United Airlines",
    "WN": "Southwest Airlines",
    "NK": "Spirit Airlines",
    "F9": "Frontier Airlines",
    "AC": "Air Canada",
    "AF": "Air France",
    "KL": "KLM",
    "LH": "Lufthansa",
    "LX": "Swiss",
    "VS": "Virgin Atlantic",
    "EK": "Emirates",
    "QR": "Qatar Airways",
    "EY": "Etihad Airways",
    "TK": "Turkish Airlines",
    "SQ": "Singapore Airlines",
    "NH": "ANA",
    "JL": "Japan Airlines",
    "HA": "Hawaiian Airlines",
    "EI": "Aer Lingus",
    "IB": "Iberia",
    "AY": "Finnair",
    "SK": "SAS",
    "TP": "TAP Air Portugal",
    "AZ": "ITA Airways",
    "UX": "Air Europa",
}

GOOGLE_AIRLINE_LOGO = "https://www.gstatic.com/flights/airline_logos/70px/{code}.png"

PROGRAM_LABELS: dict[str, str] = {
    "aeroplan": "Air Canada Aeroplan",
    "alaska": "Alaska Mileage Plan",
    "american": "American AAdvantage",
    "delta": "Delta SkyMiles",
    "united": "United MileagePlus",
    "virginatlantic": "Virgin Atlantic Flying Club",
    "jetblue": "JetBlue TrueBlue",
    "southwest": "Southwest Rapid Rewards",
    "flyingblue": "Air France/KLM Flying Blue",
    "britishairways": "British Airways Avios",
    "qantas": "Qantas Frequent Flyer",
    "singapore": "Singapore KrisFlyer",
    "emirates": "Emirates Skywards",
    "etihad": "Etihad Guest",
    "qatar": "Qatar Privilege Club",
    "turkish": "Turkish Miles&Smiles",
    "lifemiles": "Avianca LifeMiles",
    "velocity": "Virgin Australia Velocity",
}

PROGRAM_BOOKING_URLS: dict[str, str] = {
    "aeroplan": "https://www.aircanada.com/aeroplan/redeem/availability/outbound",
    "alaska": "https://www.alaskaair.com/search/results",
    "american": "https://www.aa.com/booking/find-flights",
    "delta": "https://www.delta.com/flight-search/book-a-flight",
    "united": "https://www.united.com/en/us/fsb/book/travel/air",
    "virginatlantic": "https://www.virginatlantic.com/",
    "jetblue": "https://www.jetblue.com/booking/flights",
    "southwest": "https://www.southwest.com/air/booking/",
    "flyingblue": "https://www.flyingblue.com/en/search",
    "britishairways": "https://www.britishairways.com/travel/redeem/execclub/_gb/en/",
    "qantas": "https://www.qantas.com/au/en/book-a-trip/flights.html",
    "singapore": "https://www.singaporeair.com/en_UK/plan-and-book/your-booking/book-a-flight/",
    "emirates": "https://www.emirates.com/us/english/book/",
    "lifemiles": "https://www.lifemiles.com/discover/quote-trip",
}

TRANSFER_PARTNERS: dict[str, list[str]] = {
    "aeroplan": ["Amex Membership Rewards", "Chase Ultimate Rewards", "Capital One"],
    "alaska": ["Amex Membership Rewards", "Chase Ultimate Rewards", "Capital One", "Bilt Rewards"],
    "american": ["Citi ThankYou", "Bilt Rewards"],
    "delta": ["Amex Membership Rewards", "Capital One"],
    "united": ["Chase Ultimate Rewards", "Bilt Rewards"],
    "virginatlantic": ["Amex Membership Rewards", "Chase Ultimate Rewards", "Citi ThankYou", "Capital One", "Bilt Rewards"],
    "jetblue": ["Amex Membership Rewards", "Chase Ultimate Rewards", "Citi ThankYou", "Capital One"],
    "flyingblue": ["Amex Membership Rewards", "Chase Ultimate Rewards", "Citi ThankYou", "Capital One", "Bilt Rewards"],
    "britishairways": ["Amex Membership Rewards", "Chase Ultimate Rewards", "Citi ThankYou", "Capital One", "Bilt Rewards"],
    "singapore": ["Amex Membership Rewards", "Chase Ultimate Rewards", "Citi ThankYou", "Capital One"],
    "lifemiles": ["Amex Membership Rewards", "Citi ThankYou", "Capital One", "Bilt Rewards"],
}


class SeatsAeroConfigError(Exception):
    pass


class SeatsAeroError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def _load_env() -> None:
    load_dotenv(ENV_PATH, override=True)


def credentials_configured() -> bool:
    _load_env()
    return bool((os.getenv("SEATS_AERO_API_KEY") or "").strip())


def _get_api_key() -> str:
    _load_env()
    api_key = (os.getenv("SEATS_AERO_API_KEY") or "").strip()
    if not api_key:
        raise SeatsAeroConfigError(
            "Seats.aero API key is missing. Set SEATS_AERO_API_KEY in your .env file."
        )
    return api_key


def _get_http_client() -> httpx.Client:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.Client(timeout=90.0)
    return _http_client


def _parse_int(value: Any) -> int:
    if value is None:
        return 0
    cleaned = str(value).strip().replace(",", "")
    if not cleaned or cleaned.lower() == "null":
        return 0
    try:
        return int(float(cleaned))
    except ValueError:
        return 0


def _parse_money(value: Any) -> float:
    if value is None:
        return 0.0
    cleaned = str(value).strip().replace(",", "").replace("$", "")
    if not cleaned or cleaned.lower() == "null":
        return 0.0
    try:
        amount = float(cleaned)
    except ValueError:
        return 0.0
    if amount > 500:
        return round(amount / 100, 2)
    return round(amount, 2)


def _format_time(value: str) -> str:
    if not value:
        return ""
    cleaned = value.strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M"):
        try:
            dt = datetime.strptime(cleaned.replace("Z", ""), fmt.replace("Z", ""))
            hour = dt.hour % 12 or 12
            suffix = "AM" if dt.hour < 12 else "PM"
            return f"{hour}:{dt.minute:02d} {suffix}"
        except ValueError:
            continue
    try:
        dt = datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
        hour = dt.hour % 12 or 12
        suffix = "AM" if dt.hour < 12 else "PM"
        return f"{hour}:{dt.minute:02d} {suffix}"
    except ValueError:
        return cleaned


def _program_label(source: str) -> str:
    key = source.strip().lower()
    return PROGRAM_LABELS.get(key, source.replace("_", " ").title())


def _transfer_partners(source: str) -> list[str]:
    key = source.strip().lower()
    return TRANSFER_PARTNERS.get(key, ["Amex Membership Rewards", "Chase Ultimate Rewards", "Capital One"])


def _booking_links(source: str, origin: str, destination: str, travel_date: str) -> dict[str, str]:
    slug = source.strip().lower()
    return {
        "seats_aero": (
            f"https://seats.aero/search?"
            f"origin={origin}&destination={destination}&departure={travel_date}"
        ),
        "program": PROGRAM_BOOKING_URLS.get(slug, "https://seats.aero/"),
    }


def _airline_name(code: str) -> str:
    normalized = code.strip().upper()
    return AIRLINE_NAMES.get(normalized, normalized)


def _airline_logo(code: str) -> str:
    normalized = code.strip().upper()
    if re.fullmatch(r"[A-Z0-9]{2}", normalized):
        return GOOGLE_AIRLINE_LOGO.format(code=normalized)
    return ""


def _extract_airline_codes(*values: Any) -> list[str]:
    codes: list[str] = []
    for value in values:
        if not value:
            continue
        for part in re.split(r"[,/·|]", str(value)):
            match = re.search(r"\b([A-Z0-9]{2})\b", part.strip().upper())
            if not match:
                continue
            code = match.group(1)
            if code not in codes:
                codes.append(code)
    return codes


def _format_flight_number(raw: str) -> str:
    cleaned = raw.strip()
    if not cleaned:
        return ""

    segments: list[str] = []
    for part in re.split(r"[,/|]", cleaned):
        token = part.strip()
        if not token:
            continue
        compact = re.sub(r"\s+", "", token.upper())
        match = re.match(r"^([A-Z0-9]{2})(\d+[A-Z]?)$", compact)
        if match:
            segments.append(f"{match.group(1)} {match.group(2)}")
        elif token not in segments:
            segments.append(token)

    return " · ".join(segments)


def _trip_raw_time(trip: dict[str, Any] | None, *keys: str) -> str:
    if not trip:
        return ""
    for key in keys:
        value = str(trip.get(key) or "").strip()
        if value:
            return value
    return ""


def _trip_time(trip: dict[str, Any] | None, *keys: str) -> str:
    if not trip:
        return ""
    for key in keys:
        formatted = _format_time(str(trip.get(key) or ""))
        if formatted:
            return formatted
    return ""


def _cabins_param(cabin_class: str) -> str:
    cabin_key = CABIN_MAP.get(cabin_class, "Y")
    return CABIN_TRIP_NAMES[cabin_key][1]


def _trip_list(raw: Any) -> list[dict[str, Any]]:
    if not raw:
        return []
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]
    if isinstance(raw, dict):
        nested = raw.get("data")
        if isinstance(nested, list):
            return [item for item in nested if isinstance(item, dict)]
    return []


def _pick_trip(trips: list[dict[str, Any]], cabin_prefix: str) -> dict[str, Any] | None:
    if not trips:
        return None
    preferred_names = {CABIN_TRIP_NAMES[cabin_prefix][0].lower(), CABIN_TRIP_NAMES[cabin_prefix][1]}
    for trip in trips:
        cabin = str(trip.get("Cabin") or trip.get("cabin") or "").lower()
        if cabin in preferred_names:
            return trip
    return trips[0]


def _cached_search(
    origin_code: str,
    destination_code: str,
    travel_date: str,
    cabin_class: str,
) -> list[dict[str, Any]]:
    params = {
        "origin_airport": origin_code,
        "destination_airport": destination_code,
        "start_date": travel_date,
        "end_date": travel_date,
        "cabins": _cabins_param(cabin_class),
        "order_by": "lowest_mileage",
        "include_trips": "true",
        "take": 100,
    }

    client = _get_http_client()
    response = client.get(
        SEATS_AERO_URL,
        params=params,
        headers={"Partner-Authorization": _get_api_key()},
    )

    try:
        payload = response.json()
    except ValueError as exc:
        raise SeatsAeroError(
            "Seats.aero returned an invalid response.",
            status_code=response.status_code,
        ) from exc

    if response.status_code == 401:
        raise SeatsAeroError("Seats.aero API key is invalid.", status_code=401)
    if response.status_code == 429:
        raise SeatsAeroError(
            "Seats.aero API quota reached. Check your plan at seats.aero.",
            status_code=429,
        )
    if response.status_code != 200:
        detail = payload.get("error") or payload.get("message") or "Seats.aero search failed."
        raise SeatsAeroError(str(detail), status_code=response.status_code)

    data = payload.get("data") or []
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


def _parse_availability(
    item: dict[str, Any],
    origin_code: str,
    destination_code: str,
    travel_date: str,
    cabin_class: str,
) -> dict[str, Any] | None:
    cabin_prefix = CABIN_MAP.get(cabin_class, "Y")
    if not item.get(f"{cabin_prefix}Available"):
        return None

    points = _parse_int(item.get(f"{cabin_prefix}MileageCost"))
    if points <= 0:
        return None

    if (item.get("Date") or "")[:10] != travel_date:
        return None

    route = item.get("Route") or {}
    origin = (route.get("OriginAirport") or origin_code).upper()
    destination = (route.get("DestinationAirport") or destination_code).upper()
    source = str(item.get("Source") or route.get("Source") or "unknown").lower()
    airlines = str(item.get(f"{cabin_prefix}Airlines") or "").strip()
    is_direct = bool(item.get(f"{cabin_prefix}Direct"))
    seats = _parse_int(item.get(f"{cabin_prefix}RemainingSeats"))

    trip = _pick_trip(_trip_list(item.get("AvailabilityTrips")), cabin_prefix)
    taxes = _parse_money(trip.get("TotalTaxes") if trip else None)
    duration_minutes = _parse_int(
        (trip.get("TotalDuration") or trip.get("Duration")) if trip else None
    )
    stops = _parse_int(trip.get("Stops") if trip else None)
    if trip and stops == 0 and not is_direct:
        stops = max(stops, 1)
    if not trip:
        stops = 0 if is_direct else 1

    raw_flight_numbers = str(
        trip.get("FlightNumbers") or trip.get("FlightNumber") or "" if trip else ""
    ).strip()
    flight_numbers = _format_flight_number(raw_flight_numbers)

    airline_codes = _extract_airline_codes(
        trip.get("Carriers") if trip else None,
        airlines,
        raw_flight_numbers,
    )
    if not airline_codes and trip:
        airline_codes = _extract_airline_codes(trip.get("Carriers"))

    carrier_codes_label = ", ".join(airline_codes) if airline_codes else airlines
    primary_code = airline_codes[0] if airline_codes else ""
    carrier = _airline_name(primary_code) if primary_code else carrier_codes_label or _program_label(source)
    carrier_logos = [_airline_logo(code) for code in airline_codes if _airline_logo(code)]

    if not flight_numbers and airline_codes:
        flight_numbers = carrier_codes_label

    dep_raw = _trip_raw_time(trip, "DepartsAt", "DepartureTime")
    arr_raw = _trip_raw_time(trip, "ArrivesAt", "ArrivalTime")
    dep_fields = build_flight_time_fields(dep_raw, origin, travel_date)
    arr_fields = build_flight_time_fields(arr_raw, destination, travel_date)
    departure_time = dep_fields["time"] or _trip_time(trip, "DepartsAt", "DepartureTime")
    arrival_time = arr_fields["time"] or _trip_time(trip, "ArrivesAt", "ArrivalTime")

    duration_label = format_duration_minutes(duration_minutes) if duration_minutes else "—"

    return {
        "id": item.get("ID") or f"{source}-{travel_date}-{points}",
        "origin": origin,
        "destination": destination,
        "departure_date": travel_date,
        "departure_time": departure_time,
        "arrival_time": arrival_time,
        "departure_timezone": dep_fields["timezone"],
        "arrival_timezone": arr_fields["timezone"],
        "departure_at": dep_fields["at"],
        "arrival_at": arr_fields["at"],
        "carrier": carrier,
        "carrier_logos": carrier_logos,
        "flight_number": flight_numbers or "Award seat",
        "duration": duration_label,
        "duration_minutes": duration_minutes,
        "stops": stops,
        "cash_price": 0,
        "booking_links": _booking_links(source, origin, destination, travel_date),
        "award_details": {
            "points_required": points,
            "taxes_and_fees": taxes,
            "transfer_partners": _transfer_partners(source),
            "mileage_program": _program_label(source),
            "mileage_program_slug": source,
            "seats_remaining": seats,
            "is_direct": is_direct,
        },
    }


def _merge_round_trip(outbound: dict[str, Any], inbound: dict[str, Any]) -> dict[str, Any]:
    out_award = outbound["award_details"]
    in_award = inbound["award_details"]
    total_points = out_award["points_required"] + in_award["points_required"]
    total_taxes = round(out_award["taxes_and_fees"] + in_award["taxes_and_fees"], 2)
    duration_minutes = (outbound.get("duration_minutes") or 0) + (inbound.get("duration_minutes") or 0)

    merged = {
        **outbound,
        "id": f"{outbound['id']}-rt-{inbound['id']}",
        "duration_minutes": duration_minutes or None,
        "duration": format_duration_minutes(duration_minutes) if duration_minutes else outbound.get("duration", "—"),
        "award_details": {
            **out_award,
            "points_required": total_points,
            "taxes_and_fees": total_taxes,
            "return_points": in_award["points_required"],
            "return_taxes_and_fees": in_award["taxes_and_fees"],
        },
        "return_departure_time": inbound.get("departure_time") or "",
        "return_arrival_time": inbound.get("arrival_time") or "",
        "return_departure_timezone": inbound.get("departure_timezone") or "",
        "return_arrival_timezone": inbound.get("arrival_timezone") or "",
        "return_departure_at": inbound.get("departure_at") or "",
        "return_arrival_at": inbound.get("arrival_at") or "",
        "return_flight_number": inbound.get("flight_number") or "",
        "return_carrier": inbound.get("carrier") or out_award["mileage_program"],
        "return_duration": inbound.get("duration") or "—",
        "return_stops": inbound.get("stops", 0),
    }
    return merged


def _best_by_program(flights: list[dict[str, Any]]) -> list[dict[str, Any]]:
    best: dict[str, dict[str, Any]] = {}
    for flight in flights:
        slug = flight["award_details"]["mileage_program_slug"]
        existing = best.get(slug)
        if existing is None or flight["award_details"]["points_required"] < existing["award_details"]["points_required"]:
            best[slug] = flight
    results = list(best.values())
    results.sort(key=lambda flight: flight["award_details"]["points_required"])
    return results


def search_award_offers(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str | None = None,
    cabin_class: str = "economy",
    max_results: int = 50,
) -> list[dict[str, Any]]:
    origin_code = normalize_airport_code(origin)
    destination_code = normalize_airport_code(destination)

    if return_date:
        with ThreadPoolExecutor(max_workers=2) as executor:
            outbound_future = executor.submit(
                _cached_search,
                origin_code,
                destination_code,
                departure_date,
                cabin_class,
            )
            inbound_future = executor.submit(
                _cached_search,
                destination_code,
                origin_code,
                return_date,
                cabin_class,
            )
            outbound_raw = outbound_future.result()
            inbound_raw = inbound_future.result()

        outbound_flights = [
            parsed
            for item in outbound_raw
            if (parsed := _parse_availability(item, origin_code, destination_code, departure_date, cabin_class))
        ]
        inbound_flights = [
            parsed
            for item in inbound_raw
            if (parsed := _parse_availability(item, destination_code, origin_code, return_date, cabin_class))
        ]
        inbound_by_program = {
            flight["award_details"]["mileage_program_slug"]: flight
            for flight in _best_by_program(inbound_flights)
        }

        combined: list[dict[str, Any]] = []
        for outbound in outbound_flights:
            slug = outbound["award_details"]["mileage_program_slug"]
            inbound = inbound_by_program.get(slug)
            if inbound:
                combined.append(_merge_round_trip(outbound, inbound))

        combined.sort(key=lambda flight: flight["award_details"]["points_required"])
        return combined[:max_results]

    parsed = [
        flight
        for item in _cached_search(origin_code, destination_code, departure_date, cabin_class)
        if (flight := _parse_availability(item, origin_code, destination_code, departure_date, cabin_class))
    ]
    deduped = _best_by_program(parsed)
    return deduped[:max_results]
