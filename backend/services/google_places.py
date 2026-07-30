"""
Google Places Service Alias
===========================
Re-exports functions and GooglePlacesService from backend.app.services.google_places
for flexible import paths across agents.
"""

from app.services.google_places import (
    geocode_destination,
    search_tourist_attractions,
    search_hotels,
    get_place_details,
    GooglePlacesService
)

__all__ = [
    "geocode_destination",
    "search_tourist_attractions",
    "search_hotels",
    "get_place_details",
    "GooglePlacesService"
]

