from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import random
from datetime import datetime

app = FastAPI(title="PointsFlight Finder API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_points_estimate(cash_price: float, airline: str) -> dict:
    """Estimates award chart pricing and notes credit card transfer partners."""
    # Rough valuation: 1.5 cents per point
    base_points = int((cash_price * 0.7) * 100) 
    # Round to nearest hundred
    base_points = (base_points // 100) * 100
    
    partners = ["Chase Sapphire", "Capital One Venture", "Amex Membership Rewards"]
    if airline in ["Delta", "Air France", "KLM"]:
        partners = ["Amex Membership Rewards", "Chase Sapphire", "Capital One"]
    elif airline in ["United", "Singapore Airlines"]:
        partners = ["Chase Sapphire", "Amex Membership Rewards"]
        
    return {
        "points_required": max(base_points, 7500), # Minimum award floor
        "taxes_and_fees": round(random.uniform(5.60, 85.50), 2),
        "transfer_partners": partners
    }

@app.get("/api/search")
def search_flights(
    origin: str, 
    destination: str, 
    departure_date: str, 
    search_type: str = Query("cash", description="Accepts 'cash' or 'points'")
):
    # Mocking flight data generation (Replace with Amadeus/PointsYeah API calls)
    airlines = ["United Airlines", "Delta Air Lines", "American Airlines", "JetBlue", "Air France"]
    routes = [
        {"flight_no": "AA102", "carrier": "American Airlines", "duration": "5h 30m", "stops": 0},
        {"flight_no": "UA415", "carrier": "United Airlines", "duration": "6h 15m", "stops": 1},
        {"flight_no": "DL892", "carrier": "Delta Air Lines", "duration": "5h 45m", "stops": 0},
        {"flight_no": "AF023", "carrier": "Air France", "duration": "7h 10m", "stops": 0}
    ]
    
    results = []
    for i, route in enumerate(routes):
        cash_price = round(random.uniform(250, 850), 2)
        
        flight_data = {
            "id": i + 1,
            "origin": origin.upper(),
            "destination": destination.upper(),
            "departure_date": departure_date,
            "carrier": route["carrier"],
            "flight_number": route["flight_no"],
            "duration": route["duration"],
            "stops": route["stops"],
            "cash_price": cash_price,
        }
        
        # Inject points calculations if requested
        if search_type == "points":
            flight_data["award_details"] = calculate_points_estimate(cash_price, route["carrier"])
            
        results.append(flight_data)
        
    # Sort results: lowest cash price or lowest points required
    if search_type == "points":
        return sorted(results, key=lambda x: x["award_details"]["points_required"])
    return sorted(results, key=lambda x: x["cash_price"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)