from math import ceil
from fastapi import APIRouter, HTTPException, status
from schemas.destination_schema import DestinationRequest, DestinationResponse
try:
    from app.agents.destination_agent import run_destination_agent
except ImportError:
    from agents.destination_agent import run_destination_agent

router = APIRouter(prefix="/api", tags=["Destination Agent"])

TIME_SLOTS = ["09:00 AM", "11:30 AM", "02:00 PM", "05:00 PM", "07:30 PM"]

def build_itinerary(destination: str, attractions: list, days: int):
    if not days or days <= 0:
        days = 3
    if not attractions:
        return []

    # Distribute attractions non-repeating across days
    total = len(attractions)
    per_day = max(1, ceil(total / days))
    
    itinerary = []
    used_index = 0

    for day in range(1, days + 1):
        day_places = []
        # Assign up to per_day unique attractions per day
        count = 0
        while used_index < total and count < per_day:
            attr = dict(attractions[used_index])
            attr["time"] = TIME_SLOTS[count % len(TIME_SLOTS)]
            day_places.append(attr)
            used_index += 1
            count += 1
            
        itinerary.append({
            "day": day,
            "destination": destination,
            "places": day_places
        })

    return itinerary

@router.post("/destination", response_model=DestinationResponse, status_code=status.HTTP_200_OK)
def get_destination_attractions(payload: DestinationRequest):
    """
    POST /api/destination
    Accepts destination name and days, invokes Destination Agent to fetch live Google Places data,
    sorts attractions by rating, builds a day-wise non-repeating itinerary, and returns complete data.
    """
    try:
        # Call Destination Agent
        result = run_destination_agent(destination=payload.destination)
        
        # Check if agent encountered a critical error
        if result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("message", "Internal error in Destination Agent.")
            )

        days = payload.days if payload.days and payload.days > 0 else 3
        attraction_list = result.get("attractions", [])
        
        # Build non-repeating itinerary
        itinerary = build_itinerary(payload.destination, attraction_list, days)
        result["itinerary"] = itinerary

        return DestinationResponse(**result)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process destination request: {str(exc)}"
        )
