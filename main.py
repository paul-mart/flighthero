import random
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from duffel_client import (
    DuffelAPIError,
    DuffelConfigError,
    ENV_PATH,
    credentials_configured,
    search_flight_offers,
)

app = FastAPI(title="PointsFlight Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_points_estimate(cash_price: float, airline: str) -> dict:
    """Estimates award chart pricing and notes credit card transfer partners."""
    base_points = int((cash_price * 0.7) * 100)
    base_points = (base_points // 100) * 100

    partners = ["Chase Sapphire", "Capital One Venture", "Amex Membership Rewards"]
    if airline in ["Delta Air Lines", "Air France", "KLM"]:
        partners = ["Amex Membership Rewards", "Chase Sapphire", "Capital One"]
    elif airline in ["United Airlines", "Singapore Airlines"]:
        partners = ["Chase Sapphire", "Amex Membership Rewards"]

    return {
        "points_required": max(base_points, 7500),
        "taxes_and_fees": round(random.uniform(5.60, 85.50), 2),
        "transfer_partners": partners,
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "duffel_configured": credentials_configured(),
        "env_file_exists": ENV_PATH.exists(),
    }


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
    try:
        results = search_flight_offers(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            adults=adults,
            children=children,
            return_date=return_date if trip_type == "round-trip" else None,
            cabin_class=cabin_class,
        )
    except DuffelConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DuffelAPIError as exc:
        status = exc.status_code if exc.status_code and exc.status_code < 500 else 502
        raise HTTPException(status_code=status, detail=str(exc)) from exc

    if search_type == "points":
        for flight in results:
            flight["award_details"] = calculate_points_estimate(
                flight["cash_price"],
                flight["carrier"],
            )

    return results


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
