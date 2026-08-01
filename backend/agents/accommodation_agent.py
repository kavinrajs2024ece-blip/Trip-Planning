import logging
import asyncio
from typing import Dict, Any
try:
    from app.services.google_places import async_search_hotels, search_hotels
except ImportError:
    from services.google_places import async_search_hotels, search_hotels

logger = logging.getLogger("accommodation_agent")

async def run_accommodation_agent_async(destination: str, budget: float = 50000, travelers: int = 2, days: int = 3, travel_style: str = "Standard") -> Dict[str, Any]:
    """
    Executes Accommodation Agent asynchronously to fetch real hotels from Google Places API.
    """
    clean_dest = destination.strip() if destination else "Ooty"
    try:
        res = await async_search_hotels(clean_dest, limit=12)
        hotels = res.get("hotels", [])
        hotels.sort(key=lambda x: (x.get("rating", 0), x.get("user_ratings_total", 0), -x.get("distance_km", 99)), reverse=True)
        
        return {
            "status": "success",
            "destination": clean_dest,
            "total_hotels": len(hotels),
            "travel_style": travel_style,
            "budget": budget,
            "hotels": hotels
        }
    except Exception as exc:
        logger.error(f"Accommodation Agent error: {exc}")
        return {
            "status": "error",
            "destination": clean_dest,
            "total_hotels": 0,
            "travel_style": travel_style,
            "budget": budget,
            "hotels": [],
            "message": f"Accommodation Agent failed: {str(exc)}"
        }

def run_accommodation_agent(destination: str, budget: float = 50000, travelers: int = 2, days: int = 3, travel_style: str = "Standard") -> Dict[str, Any]:
    """Sync wrapper for Accommodation Agent."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            return asyncio.run_coroutine_threadsafe(run_accommodation_agent_async(destination, budget, travelers, days, travel_style), loop).result()
        return loop.run_until_complete(run_accommodation_agent_async(destination, budget, travelers, days, travel_style))
    except Exception:
        return asyncio.run(run_accommodation_agent_async(destination, budget, travelers, days, travel_style))

recommend_hotels = run_accommodation_agent
