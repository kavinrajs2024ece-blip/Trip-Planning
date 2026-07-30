from fastapi import APIRouter, HTTPException, status
from schemas.transport_schema import TransportRequest, TransportResponse
from agents.transport_agent import run_transport_agent

router = APIRouter(prefix="/api", tags=["Transport Agent"])

@router.post("/transport", response_model=TransportResponse, status_code=status.HTTP_200_OK)
def get_transport(payload: TransportRequest):
    """
    POST /api/transport
    Accepts from_location and destination, and returns real route metrics, transport options matrix, fuel estimates, and route polyline points.
    """
    try:
        res = run_transport_agent(from_location=payload.from_location, destination=payload.destination)
        return TransportResponse(**res)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process transport request: {str(exc)}"
        )
