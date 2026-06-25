from pathlib import Path
import os
import secrets
from threading import Lock

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, Field

from api_security import (
    ApiSecurityMiddleware,
    RateLimiter,
    env_int,
    get_allowed_origins,
    get_app_api_key,
)
from airport_places import data_available as airport_data_available
from airport_places import search_place_suggestions as airport_place_suggestions
from flight_matching import enrich_awards_with_cash_prices
from seats_aero_client import (
    SeatsAeroConfigError,
    SeatsAeroError,
    search_award_offers,
)
from serpapi_client import (
    SerpAPIConfigError,
    SerpAPIError,
    build_booking_redirect_html,
    build_google_flights_search_url,
    credentials_configured as serpapi_configured,
    fetch_preferred_booking_request,
    fetch_return_legs,
    normalize_airport_code,
    search_flight_offers,
    search_place_suggestions as serpapi_place_suggestions,
)


class ReturnLegsRequest(BaseModel):
    origin: str
    destination: str
    departure_date: str
    return_date: str
    departure_tokens: list[str] = Field(..., max_length=50)

app = FastAPI(title="PointsFlight Finder API")

_allowed_origins = get_allowed_origins()
_rate_limiter = RateLimiter(
    max_requests=env_int("RATE_LIMIT_REQUESTS", 60),
    window_seconds=env_int("RATE_LIMIT_WINDOW_SECONDS", 60),
)
_internal_rate_limiter = RateLimiter(
    max_requests=env_int("INTERNAL_RATE_LIMIT_REQUESTS", 6),
    window_seconds=env_int("INTERNAL_RATE_LIMIT_WINDOW_SECONDS", 3600),
)
_tracked_deals_alert_lock = Lock()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.add_middleware(
    ApiSecurityMiddleware,
    allowed_origins=_allowed_origins,
    app_api_key=get_app_api_key(),
    rate_limiter=_rate_limiter,
    internal_rate_limiter=_internal_rate_limiter,
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/search")
def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    search_type: str = Query("cash", description="Accepts 'cash' or 'points'"),
    adults: int = Query(1, ge=1, le=9),
    children: int = Query(0, ge=0, le=8),
    return_date: str | None = None,
    trip_type: str = Query("round-trip"),
    cabin_class: str = Query("economy"),
):
    is_round_trip = trip_type == "round-trip"
    effective_return_date = return_date if is_round_trip else None

    try:
        if search_type == "points":
            results = search_award_offers(
                origin=origin,
                destination=destination,
                departure_date=departure_date,
                return_date=effective_return_date,
                cabin_class=cabin_class,
            )
            if serpapi_configured() and results:
                try:
                    cash_offers = search_flight_offers(
                        origin=origin,
                        destination=destination,
                        departure_date=departure_date,
                        adults=adults,
                        children=children,
                        return_date=effective_return_date,
                        cabin_class=cabin_class,
                    )
                    results = enrich_awards_with_cash_prices(results, cash_offers)
                except SerpAPIError:
                    pass
        else:
            results = search_flight_offers(
                origin=origin,
                destination=destination,
                departure_date=departure_date,
                adults=adults,
                children=children,
                return_date=effective_return_date,
                cabin_class=cabin_class,
            )
    except (SerpAPIConfigError, SeatsAeroConfigError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except (SerpAPIError, SeatsAeroError) as exc:
        status = exc.status_code if exc.status_code and exc.status_code < 500 else 502
        raise HTTPException(status_code=status, detail=str(exc)) from exc

    return results


@app.post("/api/search/return-legs")
def search_return_legs(body: ReturnLegsRequest):
    try:
        return fetch_return_legs(
            origin=body.origin,
            destination=body.destination,
            departure_date=body.departure_date,
            return_date=body.return_date,
            departure_tokens=body.departure_tokens,
        )
    except SerpAPIConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except SerpAPIError as exc:
        status = exc.status_code if exc.status_code and exc.status_code < 500 else 502
        raise HTTPException(status_code=status, detail=str(exc)) from exc


@app.get("/api/booking-redirect", response_class=HTMLResponse)
def booking_redirect(
    booking_token: str = Query(..., min_length=1),
    origin: str = Query(..., min_length=3),
    destination: str = Query(..., min_length=3),
    departure_date: str = Query(..., min_length=10),
    return_date: str | None = Query(None),
):
    origin_code = normalize_airport_code(origin)
    destination_code = normalize_airport_code(destination)
    effective_return = return_date if return_date else None

    try:
        booking = fetch_preferred_booking_request(
            booking_token=booking_token,
            origin_code=origin_code,
            destination_code=destination_code,
            departure_date=departure_date,
            return_date=effective_return,
        )
    except SerpAPIConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except SerpAPIError as exc:
        fallback = build_google_flights_search_url(
            origin_code,
            destination_code,
            departure_date,
            effective_return,
        )
        return RedirectResponse(fallback, status_code=302)

    request = booking["booking_request"]
    return HTMLResponse(
        build_booking_redirect_html(request["url"], request["post_data"]),
    )


@app.get("/api/places/suggestions")
def place_suggestions(q: str = Query("", min_length=0)):
    if airport_data_available():
        try:
            return airport_place_suggestions(q)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        return serpapi_place_suggestions(q)
    except SerpAPIConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except SerpAPIError as exc:
        status = exc.status_code if exc.status_code and exc.status_code < 500 else 502
        raise HTTPException(status_code=status, detail=str(exc)) from exc


@app.post("/api/internal/check-tracked-deals")
def check_tracked_deals(request: Request):
    from tracked_deal_alerts import run_tracked_deal_alerts

    secret = (os.getenv("ALERTS_CRON_SECRET") or "").strip()
    provided = (request.headers.get("x-alerts-cron-secret") or "").strip()
    if (
        not secret
        or len(provided) != len(secret)
        or not secrets.compare_digest(provided, secret)
    ):
        raise HTTPException(status_code=403, detail="Forbidden")

    if not _tracked_deals_alert_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="Alert check already in progress.")

    try:
        stats = run_tracked_deal_alerts()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    finally:
        _tracked_deals_alert_lock.release()

    return {"status": "ok", "stats": stats}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
