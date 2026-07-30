import os
import requests
from math import ceil
from typing import Optional, Dict, Any, List
from urllib.parse import unquote, quote
from fastapi import APIRouter, HTTPException, status, Query
from fastapi.responses import RedirectResponse

from schemas.destination_schema import DestinationRequest, DestinationResponse

try:
    from app.agents.destination_agent import run_destination_agent
    from app.services.google_places import search_places, resolve_attraction_photo_url, PLACES_NEW_PHOTO_MEDIA_URL, DEFAULT_TIMEOUT
except ImportError:
    from agents.destination_agent import run_destination_agent
    from services.google_places import search_places, resolve_attraction_photo_url, PLACES_NEW_PHOTO_MEDIA_URL, DEFAULT_TIMEOUT

router = APIRouter(prefix="/api", tags=["Destination Agent"])

TIME_SLOTS = ["09:00 AM", "11:30 AM", "02:00 PM", "05:00 PM", "07:30 PM"]


def build_itinerary(destination: str, attractions: list, days: int) -> List[Dict[str, Any]]:
    if not days or days <= 0:
        days = 3
    if not attractions:
        return []

    total = len(attractions)
    per_day = max(1, ceil(total / days))
    itinerary = []
    used_index = 0

    for day in range(1, days + 1):
        day_places = []
        count = 0
        while used_index < total and count < per_day:
            attr = dict(attractions[used_index])
            attr["time"] = TIME_SLOTS[count % len(TIME_SLOTS)]
            day_places.append(attr)
            used_index += 1
            count += 1
            
        itinerary.append({
            "day": day,
            "destination": destination,
            "places": day_places
        })

    return itinerary


@router.post("/destination", response_model=DestinationResponse, status_code=status.HTTP_200_OK)
def get_destination_attractions(payload: DestinationRequest):
    """
    POST /api/destination
    Production endpoint to discover authentic tourist attractions for a destination.
    Filters: Rating >= 4.2, requires photos, deduplicated, capped at best 8-10.
    """
    if not payload.destination or not payload.destination.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Destination name cannot be empty."
        )

    try:
        result = run_destination_agent(destination=payload.destination)
        
        if not result.get("success") and result.get("status") == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("message", "Internal error in Destination Agent.")
            )

        days = payload.days if payload.days and payload.days > 0 else 3
        places_list = result.get("places") or result.get("attractions") or []
        
        itinerary = build_itinerary(payload.destination, places_list, days)
        result["itinerary"] = itinerary

        return DestinationResponse(**result)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process destination request: {str(exc)}"
        )


@router.get("/photo")
def get_attraction_photo(
    photo_name: Optional[str] = Query(None, description="Google Places photo resource name"),
    ref: Optional[str] = Query(None, description="Alias for photo_name"),
    name: Optional[str] = Query(None, description="Attraction name fallback"),
    dest: Optional[str] = Query("India", description="Destination fallback"),
    cat: Optional[str] = Query("Tourist Attraction", description="Category fallback")
):
    """
    GET /api/photo?photo_name=<photo_name>
    Production photo proxy endpoint. Calls Google Places Photo Media API (New)
    and redirects directly to the actual image URL. If Google API hits quota 429 limits,
    falls back gracefully to high-res real place photo or category photo.
    """
    target_photo = photo_name or ref
    if target_photo:
        target_photo = unquote(target_photo).strip()

    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()

    # 1. Google Places Photo Media endpoint resolution
    if target_photo and target_photo.startswith("places/") and api_key:
        media_url = f"https://places.googleapis.com/v1/{target_photo}/media?maxHeightPx=800&maxWidthPx=1200&key={api_key}"
        try:
            head_resp = requests.head(media_url, timeout=3)
            if head_resp.status_code in [200, 301, 302, 307]:
                return RedirectResponse(media_url, status_code=307)
        except Exception:
            pass

    # 2. Multi-tier photo fallback (Wikimedia HD / Category HD) if Google Media API is unfulfilled/exhausted
    place_title = name or "Tourist Spot"
    destination_title = dest or "India"
    category_title = cat or "Tourist Attraction"

    fallback_img = resolve_attraction_photo_url(place_title, destination_title, [], "", category_title)
    if fallback_img:
        return RedirectResponse(fallback_img, status_code=307)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No photo available for this attraction."
    )
