from fastapi import APIRouter, HTTPException, status
from schemas.trip_schema import TripCreateRequest, TripCreateResponse
from agents.controller import orchestrate_trip_plan_async

router = APIRouter(prefix="/api/trip", tags=["Trip Planning"])

@router.post("/create", response_model=TripCreateResponse)
async def create_trip(payload: TripCreateRequest):
    """
    Accept trip details and return processing response.
    """
    return TripCreateResponse(
        trip_id="TRIP001",
        status="processing",
        message=f"Trip to {payload.destination} ({payload.days} days) initialized successfully."
    )

@router.post("/plan")
async def plan_trip_orchestrator(payload: dict):
    """
    POST /api/trip/plan
    Master Multi-Agent Orchestrator endpoint executing Destination -> Parallel(Budget, Weather, Transport, Accommodation) -> Itinerary synthesis.
    """
    try:
        result = await orchestrate_trip_plan_async(payload)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-Agent Orchestrator failed: {str(exc)}"
        )
