from fastapi import APIRouter, HTTPException, status
from schemas.transport_schema import TransportRequest, TransportResponse
from agents.transport_agent import run_transport_agent_async

router = APIRouter(prefix="/api", tags=["Transport Agent"])

@router.post("/transport", response_model=TransportResponse, status_code=status.HTTP_200_OK)
async def get_transport(payload: TransportRequest):
    """
    POST /api/transport
    Async endpoint returning transit route metrics, transport matrix, and polyline points.
    """
    try:
        res = await run_transport_agent_async(from_location=payload.from_location, destination=payload.destination)
        return TransportResponse(**res)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process transport request: {str(exc)}"
        )
