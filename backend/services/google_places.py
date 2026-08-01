"""
Google Places Service Alias
===========================
Re-exports functions and GooglePlacesService from backend.app.services.google_places
for flexible import paths across agents.
"""

from app.services.google_places import (
    search_places,
    async_search_places,
    geocode_destination,
    async_geocode_destination,
    search_tourist_attractions,
    search_hotels,
    async_search_hotels,
    get_place_details,
    resolve_attraction_photo_url,
    async_fetch_wikipedia_image,
    fetch_wikipedia_image,
    GooglePlacesService,
    PLACES_NEW_PHOTO_MEDIA_URL,
    DEFAULT_TIMEOUT
)

__all__ = [
    "search_places",
    "async_search_places",
    "geocode_destination",
    "async_geocode_destination",
    "search_tourist_attractions",
    "search_hotels",
    "async_search_hotels",
    "get_place_details",
    "resolve_attraction_photo_url",
    "async_fetch_wikipedia_image",
    "fetch_wikipedia_image",
    "GooglePlacesService",
    "PLACES_NEW_PHOTO_MEDIA_URL",
    "DEFAULT_TIMEOUT"
]
