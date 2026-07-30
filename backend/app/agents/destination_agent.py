"""
Destination Agent Module
========================
Specialized AI Agent responsible for discovering, fetching, sorting, and delivering
authentic tourist attractions for a given destination using live Google Places API data.

Key Responsibilities:
1. Accept destination name.
2. Call Google Places Service (google_places.py).
3. Retrieve tourist attractions (no fictional or mock fallback data generated).
4. Extract destination details (country, formatted location).
5. Sort attractions by Google rating in descending order.
6. Return top 10 authentic attractions in standardized JSON format.
7. Return friendly error messages if Google API returns empty or error results.

Author: Agentic AI Assistant
"""

import logging
from typing import Dict, List, Any, Optional

try:
    from app.services.google_places import geocode_destination, search_tourist_attractions
except ImportError:
    from services.google_places import geocode_destination, search_tourist_attractions

# Configure logger for Destination Agent
logger = logging.getLogger("destination_agent")
logging.basicConfig(level=logging.INFO)


def _extract_country(formatted_address: str, fallback_dest: str) -> str:
    """
    Helper function to parse the country name from a formatted address.
    """
    if formatted_address and "," in formatted_address:
        address_parts = [part.strip() for part in formatted_address.split(",")]
        if address_parts:
            # The country is typically the last element in a Google formatted address
            potential_country = address_parts[-1]
            # Avoid numeric postal codes if present
            if not potential_country.isdigit() and len(potential_country) > 1:
                return potential_country

    # Simple fallback check for common countries in destination string
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
    """
    Executes the Destination Agent workflow for a given destination.

    Parameters:
        destination (str): The destination name (e.g., 'Ooty', 'Goa').
        limit (int): Maximum number of top rated attractions to return (default 10).

    Returns:
        Dict[str, Any]: Standardized JSON object with destination, country, total_attractions,
                        and sorted top attractions list.
    """
    # 1. Input Validation
    if not destination or not isinstance(destination, str) or not destination.strip():
        logger.warning("Destination Agent received empty or invalid destination input.")
        return {
            "status": "error",
            "destination": "",
            "country": "Unknown",
            "total_attractions": 0,
            "attractions": [],
            "message": "Please provide a valid destination name to explore tourist attractions."
        }

    clean_dest = destination.strip().title()
    logger.info(f"Destination Agent starting analysis for: '{clean_dest}'")

    # 2. Geocode destination to obtain country & location details
    geo_info = geocode_destination(clean_dest)
    formatted_address = geo_info.get("formatted_address", clean_dest) if geo_info.get("status") == "success" else clean_dest
    country = _extract_country(formatted_address, clean_dest)

    # 3. Retrieve authentic tourist attractions via Google Places API
    places_response = search_tourist_attractions(clean_dest)

    # 4. Check for empty results or Google Places API errors
    if places_response.get("status") in ["empty", "error"] or not places_response.get("attractions"):
        error_detail = places_response.get("message", "No matching places found.")
        logger.warning(f"No Google Places results for '{clean_dest}': {error_detail}")
        return {
            "status": "empty",
            "destination": clean_dest,
            "country": country,
            "total_attractions": 0,
            "attractions": [],
            "message": f"We couldn't find tourist attractions for '{clean_dest}' on Google Places. Please verify the destination spelling and try again."
        }

    raw_attractions = places_response.get("attractions", [])

    # 5. Sort attractions by Google rating in descending order
    # (Secondary sort key: user_ratings_total to break ties for highly reviewed places)
    sorted_attractions = sorted(
        raw_attractions,
        key=lambda x: (float(x.get("rating", 0.0)), int(x.get("user_ratings_total", 0))),
        reverse=True
    )

    # 6. Select top 10 attractions (or up to limit requested)
    top_attractions = sorted_attractions[:limit]

    logger.info(f"Destination Agent successfully processed {len(top_attractions)} top attractions for '{clean_dest}' ({country}).")

    # 7. Return standardized clean JSON payload
    return {
        "status": "success",
        "destination": clean_dest,
        "country": country,
        "total_attractions": len(top_attractions),
        "attractions": top_attractions
    }


# Convenience alias for controller / service integration
analyze_destination = run_destination_agent


class DestinationAgent:
    """
    Class wrapper for Destination Agent for Controller orchestration.
    """
    def run(self, destination: str, limit: int = 10) -> Dict[str, Any]:
        return run_destination_agent(destination=destination, limit=limit)
