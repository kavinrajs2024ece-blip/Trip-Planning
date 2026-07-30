from fastapi import APIRouter
from schemas.trip_schema import TripCreateRequest, TripCreateResponse

router = APIRouter(prefix="/api/trip", tags=["Trip Planning"])

@router.post("/create", response_model=TripCreateResponse)
def create_trip(payload: TripCreateRequest):
    """
    Accept trip details and return processing response.
    Target output: {"trip_id": "TRIP001", "status": "processing"}
    """
    return TripCreateResponse(
        trip_id="TRIP001",
        status="processing",
        message=f"Trip to {payload.destination} ({payload.days} days) initialized successfully."
    )
