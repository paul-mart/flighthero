"""Apply scripts/deal_price_results.json to trendingDeals.ts and regionalDeals.ts."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "scripts" / "deal_price_results.json"
FILES = [ROOT / "data" / "trendingDeals.ts", ROOT / "data" / "regionalDeals.ts"]

ROUTE_OVERRIDES: dict[str, dict] = {
    "ap-ord-han": {
        "origin_code": "ORD",
        "origin_name": "Chicago",
        "dest_code": "HKG",
        "dest_city": "Hong Kong",
        "country": "Hong Kong",
        "departure": "2026-10-15",
        "return": "2026-10-25",
        "points_label": "From 75,000 pts",
        "program_found": "American AAdvantage",
    },
    "me-lax-nbo": {
        "origin_code": "SFO",
        "origin_name": "Seattle",
        "dest_code": "NBO",
        "dest_city": "Nairobi",
        "country": "Kenya",
        "departure": "2026-11-15",
        "return": "2026-11-29",
        "points_label": "From 124,500 pts",
        "program_found": "Air France/KLM Flying Blue",
    },
    "me-lax-jnb": {
        "origin_code": "JFK",
        "origin_name": "New York",
        "dest_code": "NBO",
        "dest_city": "Nairobi",
        "country": "Kenya",
        "departure": "2026-11-15",
        "return": "2026-11-29",
        "points_label": "From 74,000 pts",
        "program_found": "Virgin Atlantic Flying Club",
    },
}

ID_RE = re.compile(r"createTrendingDeal\(\s*'([^']+)'")


def load_deals() -> dict[str, dict]:
    rows = json.loads(RESULTS.read_text(encoding="utf-8"))
    by_id = {row["id"]: row for row in rows}
    for deal_id, override in ROUTE_OVERRIDES.items():
        base = by_id.get(deal_id, {"id": deal_id})
        base.update(override)
        by_id[deal_id] = base
    return by_id


def build_call(deal: dict, highlight: bool) -> str:
    program = deal.get("program_found") or deal.get("program") or "Award program"
    points_label = deal.get("points_label") or "Search route"
    highlight_arg = ", { highlightRoundTrip: true }" if highlight else ""
    return (
        f"createTrendingDeal('{deal['id']}', '{deal['origin_code']}', '{deal['origin_name']}', "
        f"'{deal['dest_code']}', '{deal['dest_city']}', '{deal['country']}', "
        f"'{deal['departure']}', '{deal['return']}', '{points_label}', "
        f"'—', '{program}'{highlight_arg}),"
    )


def apply_file(path: Path, deals_by_id: dict[str, dict]) -> int:
    lines = path.read_text(encoding="utf-8").splitlines()
    updated = 0
    new_lines: list[str] = []

    for line in lines:
        if "createTrendingDeal(" not in line:
            new_lines.append(line)
            continue

        id_match = ID_RE.search(line)
        if not id_match:
            new_lines.append(line)
            continue

        deal_id = id_match.group(1)
        deal = deals_by_id.get(deal_id)
        if not deal:
            new_lines.append(line)
            continue
        if deal.get("points") is None and deal_id not in ROUTE_OVERRIDES:
            new_lines.append(line)
            continue

        highlight = "highlightRoundTrip: true" in line
        indent = re.match(r"^(\s*)", line).group(1)
        new_lines.append(indent + build_call(deal, highlight))
        updated += 1

    path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    return updated


def main() -> None:
    deals = load_deals()
    total = 0
    for path in FILES:
        count = apply_file(path, deals)
        print(f"Updated {count} deals in {path.name}")
        total += count
    print(f"Total updates: {total}")


if __name__ == "__main__":
    main()
