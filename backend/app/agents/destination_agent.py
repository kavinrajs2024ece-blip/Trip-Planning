"""
Destination Agent Module
========================
Specialized AI Agent responsible for discovering, fetching, sorting, and delivering
authentic tourist attractions for a given destination using live Google Places API data.
"""

import logging
from typing import Dict, List, Any, Optional

try:
    from app.services.google_places import geocode_destination, search_places, search_tourist_attractions
except ImportError:
    from services.google_places import geocode_destination, search_places, search_tourist_attractions

logger = logging.getLogger("destination_agent")
logging.basicConfig(level=logging.INFO)


def _extract_country(formatted_address: str, fallback_dest: str) -> str:
    """Helper function to parse the country name from a formatted address."""
    if formatted_address and "," in formatted_address:
        address_parts = [part.strip() for part in formatted_address.split(",")]
        if address_parts:
            potential_country = address_parts[-1]
            if not potential_country.isdigit() and len(potential_country) > 1:
                return potential_country

    dest_lower = fallback_dest.lower()
    if any(term in dest_lower for term in ["india", "goa", "ooty", "manali", "kerala", "jaipur", "udaipur", "delhi", "mumbai", "bengaluru", "bangalore"]):
        return "India"
    elif "france" in dest_lower or "paris" in dest_lower:
        return "France"
    elif "japan" in dest_lower or "tokyo" in dest_lower:
        return "Japan"
    elif "usa" in dest_lower or "york" in dest_lower or "california" in dest_lower:
        return "United States"

    return "India"


def run_destination_agent(destination: str, limit: int = 10) -> Dict[str, Any]:
    """Executes the Destination Agent workflow for a given destination."""
    if not destination or not isinstance(destination, str) or not destination.strip():
        logger.warning("Destination Agent received empty or invalid destination input.")
        return {
            "success": False,
            "status": "error",
            "destination": "",
            "country": "Unknown",
            "total_attractions": 0,
            "places": [],
            "attractions": [],
            "message": "Please provide a valid destination name to explore tourist attractions."
        }

    clean_dest = destination.strip().title()
    logger.info(f"Destination Agent starting analysis for: '{clean_dest}'")

    geo_info = geocode_destination(clean_dest)
    formatted_address = geo_info.get("formatted_address", clean_dest) if geo_info.get("status") == "success" else clean_dest
    country = _extract_country(formatted_address, clean_dest)

    places_response = search_places(clean_dest)

    if not places_response.get("success") or places_response.get("status") in ["empty", "error"] or not places_response.get("places"):
        error_detail = places_response.get("message", "No matching places found.")
        logger.warning(f"No Google Places results for '{clean_dest}': {error_detail}")
        return {
            "success": False,
            "status": places_response.get("status", "empty"),
            "destination": clean_dest,
            "country": country,
            "total_attractions": 0,
            "places": [],
            "attractions": [],
            "message": error_detail
        }

    raw_places = places_response.get("places", [])
    top_attractions = raw_places[:limit]

    logger.info(f"Destination Agent successfully processed {len(top_attractions)} top attractions for '{clean_dest}' ({country}).")

    return {
        "success": True,
        "status": "success",
        "destination": clean_dest,
        "country": country,
        "total_attractions": len(top_attractions),
        "places": top_attractions,
        "attractions": top_attractions
    }


def generate_destination(destination: str, limit: int = 10) -> Dict[str, Any]:
    """Alias for run_destination_agent."""
    return run_destination_agent(destination=destination, limit=limit)


analyze_destination = run_destination_agent


class DestinationAgent:
    """Class wrapper for Destination Agent for Controller orchestration."""
    def run(self, destination: str, limit: int = 10) -> Dict[str, Any]:
        return run_destination_agent(destination=destination, limit=limit)
