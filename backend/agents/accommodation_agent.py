import logging
from typing import Dict, Any
try:
    from app.services.google_places import search_hotels
except ImportError:
    from services.google_places import search_hotels

logger = logging.getLogger("accommodation_agent")

def run_accommodation_agent(destination: str, budget: float = 50000, travelers: int = 2, days: int = 3, travel_style: str = "Standard") -> Dict[str, Any]:
    """
    Executes Accommodation Agent to fetch real hotels from Google Places API.
    """
    clean_dest = destination.strip() if destination else "Ooty"
    res = search_hotels(clean_dest, limit=12)
    
    hotels = res.get("hotels", [])
    
    # Sort by: 1. Rating (desc), 2. Review Count (desc), 3. Distance (asc)
    hotels.sort(key=lambda x: (x.get("rating", 0), x.get("user_ratings_total", 0), -x.get("distance_km", 99)), reverse=True)
    
    return {
        "status": "success",
        "destination": clean_dest,
        "total_hotels": len(hotels),
        "travel_style": travel_style,
        "budget": budget,
        "hotels": hotels
    }

recommend_hotels = run_accommodation_agent

