from fastapi import APIRouter, HTTPException, status
from schemas.accommodation_schema import AccommodationRequest, AccommodationResponse
from agents.accommodation_agent import run_accommodation_agent

router = APIRouter(prefix="/api", tags=["Accommodation Agent"])

@router.post("/accommodation", response_model=AccommodationResponse, status_code=status.HTTP_200_OK)
def get_accommodations(payload: AccommodationRequest):
    """
    POST /api/accommodation
    Accepts destination, budget, travelers, days, and travel_style,
    and returns real hotel listings from Google Places API sorted by rating, reviews, and distance.
    """
    try:
        res = run_accommodation_agent(
            destination=payload.destination,
            budget=payload.budget or 50000,
            travelers=payload.travelers or 2,
            days=payload.days or 3,
            travel_style=payload.travel_style or "Standard"
        )
        return AccommodationResponse(**res)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process accommodation request: {str(exc)}"
        )
