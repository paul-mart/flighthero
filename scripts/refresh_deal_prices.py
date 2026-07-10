"""One-off script: fetch live award prices for curated deal cards."""
from __future__ import annotations

import json
import re
import sys
import time
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from seats_aero_client import search_award_offers  # noqa: E402

MIN_DEPARTURE = date(2026, 7, 30)  # at least 3 weeks from 2026-07-09
DEAL_FILES = [
    ROOT / "data" / "trendingDeals.ts",
    ROOT / "data" / "regionalDeals.ts",
]
OUTPUT = ROOT / "scripts" / "deal_price_results.json"

CREATE_DEAL_RE = re.compile(
    r"createTrendingDeal\(\s*"
    r"'([^']+)',\s*"  # id
    r"'([^']+)',\s*"  # origin code
    r"'([^']+)',\s*"  # origin name
    r"'([^']+)',\s*"  # dest code
    r"'([^']+)',\s*"  # dest city
    r"'([^']+)',\s*"  # country
    r"'(\d{4}-\d{2}-\d{2})',\s*"  # departure
    r"'(\d{4}-\d{2}-\d{2})',\s*"  # return
    r"'[^']*',\s*"  # points label (ignored)
    r"'[^']*',\s*"  # cash label (ignored)
    r"'([^']+)'"  # program
)


def parse_deals(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    deals = []
    for match in CREATE_DEAL_RE.finditer(text):
        (
            deal_id,
            origin_code,
            origin_name,
            dest_code,
            dest_city,
            country,
            departure,
            return_date,
            program,
        ) = match.groups()
        deals.append(
            {
                "id": deal_id,
                "origin_code": origin_code,
                "origin_name": origin_name,
                "dest_code": dest_code,
                "dest_city": dest_city,
                "country": country,
                "departure": departure,
                "return": return_date,
                "program": program,
                "source_file": path.name,
            }
        )
    return deals


def bump_dates(departure: str, return_date: str) -> tuple[str, str]:
    dep = date.fromisoformat(departure)
    ret = date.fromisoformat(return_date)
    if dep >= MIN_DEPARTURE:
        return departure, return_date
    shift = (MIN_DEPARTURE - dep).days
    dep += timedelta(days=shift)
    ret += timedelta(days=shift)
    return dep.isoformat(), ret.isoformat()


def format_points_label(points: int) -> str:
    return f"From {points:,} pts"


def fetch_deal(deal: dict) -> dict:
    departure, return_date = bump_dates(deal["departure"], deal["return"])
    route = f"{deal['origin_code']}->{deal['dest_code']}"
    print(f"Searching {deal['id']} ({route}) {departure} ...", flush=True)

    try:
        results = search_award_offers(
            origin=deal["origin_code"],
            destination=deal["dest_code"],
            departure_date=departure,
            return_date=return_date,
            cabin_class="economy",
        )
    except Exception as exc:  # noqa: BLE001
        print(f"  ERROR: {exc}")
        return {
            **deal,
            "departure": departure,
            "return": return_date,
            "points": None,
            "points_label": deal.get("points_label"),
            "program_found": None,
            "error": str(exc),
        }

    if not results:
        print("  no results")
        return {
            **deal,
            "departure": departure,
            "return": return_date,
            "points": None,
            "points_label": None,
            "program_found": None,
            "error": "no_award_space",
        }

    best = min(results, key=lambda flight: flight["award_details"]["points_required"])
    points = int(best["award_details"]["points_required"])
    program = best["award_details"].get("mileage_program") or deal["program"]
    print(f"  -> {points:,} pts via {program}")
    return {
        **deal,
        "departure": departure,
        "return": return_date,
        "points": points,
        "points_label": format_points_label(points),
        "program_found": program,
        "error": None,
    }


def main() -> None:
    seen: set[str] = set()
    deals: list[dict] = []
    for path in DEAL_FILES:
        for deal in parse_deals(path):
            if deal["id"] in seen:
                continue
            seen.add(deal["id"])
            deals.append(deal)

    print(f"Fetching prices for {len(deals)} unique deals...\n")
    results: list[dict] = []
    for index, deal in enumerate(deals, start=1):
        print(f"[{index}/{len(deals)}]", end=" ")
        results.append(fetch_deal(deal))
        if index < len(deals):
            time.sleep(1)

    OUTPUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
    found = sum(1 for row in results if row.get("points") is not None)
    print(f"\nDone: {found}/{len(results)} routes with award space.")
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
