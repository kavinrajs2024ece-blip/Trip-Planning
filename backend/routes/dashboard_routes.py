from fastapi import APIRouter, HTTPException, status
from services.trip_store import trip_store

router = APIRouter(prefix="/api", tags=["Dashboard"])

@router.get("/dashboard")
def get_dashboard_summary():
    """
    GET /api/dashboard
    Returns real-time aggregated dashboard summary stats, active trip details,
    recent trips, system metrics, and activity logs from backend single source of truth.
    """
    try:
        return trip_store.get_dashboard_data()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard metrics: {str(exc)}"
        )
