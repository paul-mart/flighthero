from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from zoneinfo import ZoneInfo

from airport_places import get_airport_timezone


def _extract_date(raw: str) -> str:
    match = re.match(r"^(\d{4}-\d{2}-\d{2})", raw.strip())
    return match.group(1) if match else ""


def parse_flight_datetime(raw: str, fallback_date: str) -> datetime | None:
    if not raw:
        return None

    cleaned = raw.strip()
    if cleaned.endswith("Z"):
        cleaned = cleaned[:-1] + "+00:00"

    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"):
        try:
            return datetime.strptime(cleaned.split("+")[0].strip(), fmt)
        except ValueError:
            continue

    try:
        parsed = datetime.fromisoformat(cleaned)
        if parsed.tzinfo is not None:
            return parsed.replace(tzinfo=None)
        return parsed
    except ValueError:
        pass

    time_only = re.match(r"^(\d{1,2}):(\d{2})$", cleaned)
    if time_only and fallback_date:
        try:
            year, month, day = map(int, fallback_date.split("-"))
            return datetime(year, month, day, int(time_only.group(1)), int(time_only.group(2)))
        except ValueError:
            return None

    return None


def format_12h(dt: datetime) -> str:
    hour = dt.hour % 12 or 12
    suffix = "AM" if dt.hour < 12 else "PM"
    return f"{hour}:{dt.minute:02d} {suffix}"


def timezone_abbrev(iana_tz: str, dt: datetime) -> str:
    try:
        aware = dt.replace(tzinfo=ZoneInfo(iana_tz))
        abbrev = aware.tzname() or aware.strftime("%Z")
        if abbrev and abbrev != "UTC":
            return abbrev
        offset = aware.utcoffset()
        if offset is not None:
            total_minutes = int(offset.total_seconds() // 60)
            sign = "+" if total_minutes >= 0 else "-"
            hours = abs(total_minutes) // 60
            minutes = abs(total_minutes) % 60
            if minutes:
                return f"UTC{sign}{hours}:{minutes:02d}"
            return f"UTC{sign}{hours}"
    except Exception:
        pass
    return ""


def to_iso_with_offset(iana_tz: str, dt: datetime) -> str:
    try:
        aware = dt.replace(tzinfo=ZoneInfo(iana_tz))
        return aware.isoformat(timespec="minutes")
    except Exception:
        return dt.isoformat(timespec="minutes")


def build_flight_time_fields(
    raw_time: str,
    airport_iata: str,
    fallback_date: str,
) -> dict[str, str]:
    if not raw_time:
        return {"time": "", "timezone": "", "at": ""}

    date_hint = _extract_date(raw_time) or fallback_date
    dt = parse_flight_datetime(raw_time, date_hint)
    iana = get_airport_timezone(airport_iata)

    if dt is None:
        return {"time": raw_time.strip(), "timezone": "", "at": ""}

    time_label = format_12h(dt)
    tz_label = timezone_abbrev(iana, dt) if iana else ""
    at_iso = to_iso_with_offset(iana, dt) if iana else dt.isoformat(timespec="minutes")

    return {
        "time": time_label,
        "timezone": tz_label,
        "at": at_iso,
    }


def apply_time_fields(
    target: dict[str, Any],
    *,
    prefix: str,
    raw_time: str,
    airport_iata: str,
    fallback_date: str,
) -> None:
    fields = build_flight_time_fields(raw_time, airport_iata, fallback_date)
    target[f"{prefix}_time"] = fields["time"]
    target[f"{prefix}_timezone"] = fields["timezone"]
    target[f"{prefix}_at"] = fields["at"]
