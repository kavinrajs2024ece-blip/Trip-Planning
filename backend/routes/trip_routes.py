from fastapi import APIRouter, HTTPException, status, Path
from typing import Dict, Any, Optional
from schemas.trip_schema import TripCreateRequest, TripCreateResponse
from agents.controller import orchestrate_trip_plan_async
from services.trip_store import trip_store

router = APIRouter(prefix="/api/trip", tags=["Trip Planning"])

@router.get("/latest")
def get_latest_trip():
    """
    GET /api/trip/latest
    Returns the latest/active trip object from the backend single source of truth.
    """
    return trip_store.get_active_trip()

@router.get("/list")
def get_all_saved_trips():
    """
    GET /api/trip/list
    Returns all saved trip itineraries.
    """
    return trip_store.get_all_trips()

@router.get("/{trip_id}")
def get_trip_by_id(trip_id: str = Path(..., description="ID of the trip to fetch")):
    """
    GET /api/trip/{trip_id}
    Retrieves specific trip object by ID.
    """
    trip = trip_store.get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID '{trip_id}' not found."
        )
    return trip

@router.post("/save")
def save_trip_data(payload: dict):
    """
    POST /api/trip/save
    Saves/persists a full trip object to the central backend store.
    """
    if not payload or not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid trip payload provided."
        )
    return trip_store.save_trip(payload)

@router.post("/create", response_model=TripCreateResponse)
async def create_trip(payload: TripCreateRequest):
    """
    POST /api/trip/create
    Accept trip details and initialize processing response.
    """
    return TripCreateResponse(
        trip_id=f"TRIP-{payload.destination.upper()[:3]}001",
        status="processing",
        message=f"Trip to {payload.destination} ({payload.days} days) initialized successfully."
    )

@router.post("/plan")
async def plan_trip_orchestrator(payload: dict):
    """
    POST /api/trip/plan
    Master Multi-Agent Orchestrator endpoint.
    Executes Destination, Budget, Weather, Transport, Accommodation, and Itinerary synthesis,
    saves the consolidated result to backend persistent store, and returns full trip object.
    """
    try:
        result = await orchestrate_trip_plan_async(payload)
        
        # Build consolidated trip object format
        destination_name = payload.get("destination", "Ooty")
        days = int(payload.get("days", 3))
        budget = float(payload.get("budget", 50000))
        travelers = int(payload.get("travelers", 2))
        travel_style = payload.get("travel_style", "Standard")
        interests = payload.get("interests", [])

        dest_data = result.get("destination", {})
        attractions = dest_data.get("places") or dest_data.get("attractions") or []
        hotel_data = result.get("accommodation", {})
        hotels = hotel_data.get("hotels", [])
        weather_data = result.get("weather", {})
        transport_data = result.get("transport", {})
        itinerary_data = result.get("itinerary", {})
        itinerary_schedule = itinerary_data.get("schedule") or itinerary_data.get("itinerary") or []
        budget_data = result.get("budget", {})

        trip_id = f"TRIP-{int(days * 1000 + len(attractions))}-{destination_name.upper()[:3]}"

        consolidated_trip = {
            "id": trip_id,
            "name": dest_data.get("destination") or destination_name,
            "country": dest_data.get("country", "India"),
            "fromLoc": payload.get("from_location", "Chennai"),
            "days": days,
            "budget": budget,
            "travelers": travelers,
            "travelStyle": travel_style,
            "interests": interests,
            "lat": attractions[0].get("latitude") if attractions else 11.4102,
            "lng": attractions[0].get("longitude") if attractions else 76.6950,
            "attractions": attractions,
            "hotels": hotels,
            "weatherData": weather_data,
            "transportData": transport_data,
            "itinerary": itinerary_schedule,
            "budgetAnalysis": budget_data,
            "costSummary": {
                "hotel": round(budget * 0.40),
                "transport": round(budget * 0.25),
                "food": round(budget * 0.20),
                "tickets": round(budget * 0.15),
                "total": round(budget)
            }
        }

        saved_trip = trip_store.save_trip(consolidated_trip)
        result["saved_trip"] = saved_trip
        return result

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-Agent Orchestrator failed: {str(exc)}"
        )
