from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
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
from seats_aero_client import (
    SeatsAeroConfigError,
    SeatsAeroError,
    search_award_offers,
)
from serpapi_client import (
    SerpAPIConfigError,
    SerpAPIError,
    fetch_return_legs,
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
