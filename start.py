import os
import sys


def main() -> None:
    port_raw = (os.environ.get("PORT") or "8000").strip()
    try:
        port = int(port_raw)
    except ValueError:
        print(f"Invalid PORT={port_raw!r}", file=sys.stderr, flush=True)
        raise SystemExit(1) from None

    print(f"Starting FlightHero API on 0.0.0.0:{port}", flush=True)

    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
