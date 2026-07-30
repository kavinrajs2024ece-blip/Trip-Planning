import logging
from typing import Dict, Any
from services.weather_service import WeatherService

logger = logging.getLogger("weather_agent")

def run_weather_agent(destination: str, days: int = 3) -> Dict[str, Any]:
    """
    Executes Weather Agent to fetch real weather analysis for travel destination.
    """
    service = WeatherService()
    return service.get_weather_analysis(destination=destination, days=days)

fetch_weather = run_weather_agent
