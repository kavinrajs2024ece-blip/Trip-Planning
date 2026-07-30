from fastapi import APIRouter, HTTPException, status
from schemas.weather_schema import WeatherRequest, WeatherResponse
from agents.weather_agent import run_weather_agent

router = APIRouter(prefix="/api", tags=["Weather Agent"])

@router.post("/weather", response_model=WeatherResponse, status_code=status.HTTP_200_OK)
def get_weather(payload: WeatherRequest):
    """
    POST /api/weather
    Accepts destination and days, and returns real weather analysis, 4-slot daily forecasts, and AI suggestions.
    """
    try:
        res = run_weather_agent(destination=payload.destination, days=payload.days or 3)
        return WeatherResponse(**res)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process weather request: {str(exc)}"
        )
