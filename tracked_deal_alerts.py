"""Daily tracked-deal price checks and alert emails."""

from __future__ import annotations

import os
import time
from datetime import date, datetime
from typing import Any

from firebase_admin import firestore

from firebase_admin_client import FirebaseAdminConfigError, get_firestore_client
from seats_aero_client import SeatsAeroConfigError, SeatsAeroError, search_award_offers
from serpapi_client import normalize_airport_code

ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000


def _app_base_url() -> str:
    return (os.getenv("APP_BASE_URL") or "http://localhost:5173").rstrip("/")


def _parse_iso_date(value: str) -> date | None:
    cleaned = (value or "").strip()
    if not cleaned:
        return None
    try:
        return date.fromisoformat(cleaned[:10])
    except ValueError:
        return None


def _deal_is_active(deal: dict[str, Any]) -> bool:
    departure = _parse_iso_date(str(deal.get("departureDate") or ""))
    if departure is None:
        return False
    return departure >= date.today()


def _lowest_award(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str | None,
    cabin_class: str,
) -> dict[str, Any] | None:
    try:
        results = search_award_offers(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date,
            cabin_class=cabin_class,
            max_results=50,
        )
    except (SeatsAeroConfigError, SeatsAeroError, ValueError):
        return None

    if not results:
        return None

    best = min(results, key=lambda flight: flight["award_details"]["points_required"])
    award = best["award_details"]
    return {
        "points": int(award["points_required"]),
        "taxes": float(award.get("taxes_and_fees") or 0),
        "program": award.get("mileage_program") or "",
        "carrier": best.get("carrier") or "",
    }


def _format_route(origin: str, destination: str) -> str:
    try:
        origin_code = normalize_airport_code(origin)
        destination_code = normalize_airport_code(destination)
        return f"{origin} → {destination} ({origin_code}–{destination_code})"
    except ValueError:
        return f"{origin} → {destination}"


def _format_dates(deal: dict[str, Any]) -> str:
    departure = str(deal.get("departureDate") or "")
    if deal.get("tripType") == "round-trip" and deal.get("returnDate"):
        return f"{departure} – {deal['returnDate']}"
    return departure


def _queue_alert_email(
    db: Any,
    *,
    to_email: str,
    subject: str,
    text: str,
) -> None:
    db.collection("mail").add({
        "to": [to_email],
        "message": {
            "subject": subject,
            "text": text,
        },
    })


def _build_alert_email(
    *,
    route_label: str,
    date_label: str,
    old_points: int,
    new_points: int,
    program: str,
) -> tuple[str, str]:
    savings = old_points - new_points
    subject = f"Price drop: {route_label} ({old_points:,} → {new_points:,} pts)"
    program_line = f"Program: {program}\n" if program else ""
    text = (
        f"Good news — an award price dropped on a route you're tracking.\n\n"
        f"Route: {route_label}\n"
        f"Dates: {date_label}\n"
        f"Was: {old_points:,} points\n"
        f"Now: {new_points:,} points (lowest found today)\n"
        f"You save: {savings:,} points\n"
        f"{program_line}\n"
        f"Search again: {_app_base_url()}/\n\n"
        "Award space is from Seats.aero cached data. Always verify availability before booking."
    )
    return subject, text


def _omit_undefined(snapshot: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in snapshot.items() if value is not None and value != ""}


def _process_deal(
    deal: dict[str, Any],
    *,
    user_email: str,
    now_ms: int,
    db: Any,
    stats: dict[str, int],
) -> bool:
    if not deal.get("alertsEnabled"):
        return False

    if not _deal_is_active(deal):
        stats["skipped_inactive"] += 1
        return False

    return_date = str(deal.get("returnDate") or "").strip() or None
    if deal.get("tripType") != "round-trip":
        return_date = None

    lowest = _lowest_award(
        str(deal.get("origin") or ""),
        str(deal.get("destination") or ""),
        str(deal.get("departureDate") or ""),
        return_date,
        str(deal.get("cabinClass") or "economy"),
    )
    if lowest is None:
        stats["search_failed"] += 1
        deal["lastCheckedAt"] = now_ms
        return True

    stats["searched"] += 1
    snapshot = deal.get("snapshot") if isinstance(deal.get("snapshot"), dict) else None
    baseline_points = snapshot.get("pointsRequired") if snapshot else None

    if baseline_points is None:
        deal["snapshot"] = _omit_undefined({
            "pointsRequired": lowest["points"],
            "taxesAndFees": lowest["taxes"],
            "trackedAt": now_ms,
            "mileageProgram": lowest["program"] or None,
            "carrier": lowest["carrier"] or None,
        })
        deal["lastCheckedAt"] = now_ms
        stats["baselines_set"] += 1
        return True

    deal["lastCheckedAt"] = now_ms

    if lowest["points"] >= int(baseline_points):
        stats["unchanged"] += 1
        return True

    last_alert = int(deal.get("lastAlertSentAt") or 0)
    if now_ms - last_alert >= ALERT_COOLDOWN_MS:
        route_label = _format_route(str(deal.get("origin") or ""), str(deal.get("destination") or ""))
        subject, text = _build_alert_email(
            route_label=route_label,
            date_label=_format_dates(deal),
            old_points=int(baseline_points),
            new_points=lowest["points"],
            program=lowest["program"],
        )
        _queue_alert_email(db, to_email=user_email, subject=subject, text=text)
        deal["lastAlertSentAt"] = now_ms
        stats["alerts_sent"] += 1
    else:
        stats["alerts_throttled"] += 1

    existing_snapshot = snapshot or {}
    deal["snapshot"] = _omit_undefined({
        "pointsRequired": lowest["points"],
        "taxesAndFees": lowest["taxes"],
        "trackedAt": now_ms,
        "mileageProgram": lowest["program"] or existing_snapshot.get("mileageProgram"),
        "carrier": lowest["carrier"] or existing_snapshot.get("carrier"),
        "flightNumber": existing_snapshot.get("flightNumber"),
    })
    return True


def run_tracked_deal_alerts() -> dict[str, int]:
    """Check all alert-enabled tracked routes and email users when prices drop."""
    try:
        db = get_firestore_client()
    except FirebaseAdminConfigError as exc:
        raise RuntimeError(str(exc)) from exc

    stats = {
        "users_scanned": 0,
        "users_updated": 0,
        "deals_with_alerts": 0,
        "searched": 0,
        "search_failed": 0,
        "baselines_set": 0,
        "unchanged": 0,
        "alerts_sent": 0,
        "alerts_throttled": 0,
        "skipped_inactive": 0,
    }

    now_ms = int(time.time() * 1000)

    for user_doc in db.collection("users").stream():
        stats["users_scanned"] += 1
        user_data = user_doc.to_dict() or {}
        email = str(user_data.get("email") or "").strip()
        deals = user_data.get("trackedDeals")
        if not isinstance(deals, list) or not deals:
            continue

        modified = False
        for deal in deals:
            if not isinstance(deal, dict):
                continue
            if deal.get("alertsEnabled"):
                stats["deals_with_alerts"] += 1
            if not email:
                continue
            if _process_deal(deal, user_email=email, now_ms=now_ms, db=db, stats=stats):
                modified = True

        if modified:
            db.collection("users").document(user_doc.id).set({
                "trackedDeals": deals,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            }, merge=True)
            stats["users_updated"] += 1

    return stats
