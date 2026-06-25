#!/usr/bin/env python3
"""Run daily tracked-deal price checks. Use cron or call the HTTP endpoint instead."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from tracked_deal_alerts import run_tracked_deal_alerts


def main() -> int:
    try:
        stats = run_tracked_deal_alerts()
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(stats, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
