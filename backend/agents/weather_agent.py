import logging
import asyncio
from typing import Dict, Any
from services.weather_service import WeatherService

logger = logging.getLogger("weather_agent")

async def run_weather_agent_async(destination: str, days: int = 3) -> Dict[str, Any]:
    """
    Executes Weather Agent asynchronously to fetch real weather analysis for travel destination.
    """
    try:
        service = WeatherService()
        return await service.get_weather_analysis_async(destination=destination, days=days)
    except Exception as exc:
        logger.error(f"Weather Agent error: {exc}")
        return {
            "status": "error",
            "destination": destination,
            "message": f"Weather Agent failed: {str(exc)}"
        }

def run_weather_agent(destination: str, days: int = 3) -> Dict[str, Any]:
    """Sync wrapper for Weather Agent."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            return asyncio.run_coroutine_threadsafe(run_weather_agent_async(destination=destination, days=days), loop).result()
        return loop.run_until_complete(run_weather_agent_async(destination=destination, days=days))
    except Exception:
        return asyncio.run(run_weather_agent_async(destination=destination, days=days))

fetch_weather = run_weather_agent
