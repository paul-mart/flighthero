from __future__ import annotations

import re
from typing import Any


def _normalize_time_label(value: str) -> str:
    if not value:
        return ""
    cleaned = value.strip()
    cleaned = re.sub(r"\s*\(\d{4}Z\)$", "", cleaned)
    cleaned = re.sub(r"\s+[A-Z]{2,5}$", "", cleaned)
    return cleaned


def _normalize_flight_numbers(raw: str) -> str:
    if not raw:
        return ""
    lowered = raw.strip().lower()
    if lowered in ("award seat", "—", "-"):
        return ""

    segments: list[str] = []
    for part in re.split(r"[·,|/]", raw):
        token = re.sub(r"\s+", " ", part.strip().upper())
        if token:
            segments.append(token)
    return " | ".join(sorted(segments))


def flight_identity_key(flight: dict[str, Any], *, include_flight_numbers: bool = True) -> tuple[Any, ...]:
    flight_numbers = _normalize_flight_numbers(str(flight.get("flight_number") or ""))
    key: tuple[Any, ...] = (
        str(flight.get("origin") or "").upper(),
        str(flight.get("destination") or "").upper(),
        str(flight.get("departure_date") or ""),
        _normalize_time_label(str(flight.get("departure_time") or "")),
        _normalize_time_label(str(flight.get("arrival_time") or "")),
        flight_numbers if include_flight_numbers else "",
        int(flight.get("stops") or 0),
    )

    return_flight_number = _normalize_flight_numbers(str(flight.get("return_flight_number") or ""))
    if return_flight_number or flight.get("return_departure_time"):
        key += (
            _normalize_time_label(str(flight.get("return_departure_time") or "")),
            _normalize_time_label(str(flight.get("return_arrival_time") or "")),
            return_flight_number if include_flight_numbers else "",
            int(flight.get("return_stops") or 0),
        )
    return key


def _index_cash_offers(cash_offers: list[dict[str, Any]]) -> tuple[
    dict[tuple[Any, ...], dict[str, Any]],
    dict[tuple[Any, ...], dict[str, Any]],
]:
    strict: dict[tuple[Any, ...], dict[str, Any]] = {}
    relaxed: dict[tuple[Any, ...], dict[str, Any]] = {}

    for offer in cash_offers:
        price = float(offer.get("cash_price") or 0)
        if price <= 0:
            continue

        strict_key = flight_identity_key(offer, include_flight_numbers=True)
        relaxed_key = flight_identity_key(offer, include_flight_numbers=False)

        for bucket, key in ((strict, strict_key), (relaxed, relaxed_key)):
            existing = bucket.get(key)
            if existing is None or price < float(existing.get("cash_price") or 0):
                bucket[key] = offer

    return strict, relaxed


def match_cash_offer(
    award_flight: dict[str, Any],
    strict_index: dict[tuple[Any, ...], dict[str, Any]],
    relaxed_index: dict[tuple[Any, ...], dict[str, Any]],
) -> dict[str, Any] | None:
    strict_key = flight_identity_key(award_flight, include_flight_numbers=True)
    match = strict_index.get(strict_key)
    if match is None:
        relaxed_key = flight_identity_key(award_flight, include_flight_numbers=False)
        match = relaxed_index.get(relaxed_key)
    return match


def match_cash_price(
    award_flight: dict[str, Any],
    strict_index: dict[tuple[Any, ...], dict[str, Any]],
    relaxed_index: dict[tuple[Any, ...], dict[str, Any]],
) -> float | None:
    match = match_cash_offer(award_flight, strict_index, relaxed_index)
    if match is None:
        return None
    return round(float(match.get("cash_price") or 0), 2)


def enrich_awards_with_cash_prices(
    award_flights: list[dict[str, Any]],
    cash_offers: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if not award_flights or not cash_offers:
        return award_flights

    strict_index, relaxed_index = _index_cash_offers(cash_offers)
    enriched: list[dict[str, Any]] = []

    for flight in award_flights:
        updated = dict(flight)
        cash_match = match_cash_offer(flight, strict_index, relaxed_index)
        if cash_match is not None:
            updated["cash_price"] = round(float(cash_match.get("cash_price") or 0), 2)
            updated["cash_price_matched"] = True
            if cash_match.get("itinerary"):
                updated["itinerary"] = cash_match["itinerary"]
            if cash_match.get("return_itinerary"):
                updated["return_itinerary"] = cash_match["return_itinerary"]
        else:
            updated["cash_price_matched"] = False
        enriched.append(updated)

    return enriched
