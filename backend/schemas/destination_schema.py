from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any

class DestinationRequest(BaseModel):
    destination: str = Field(..., description="Target travel destination name", example="Ooty")
    days: Optional[int] = Field(3, description="Number of days for trip planning", example=3)

    @field_validator("destination")
    @classmethod
    def validate_destination(cls, v: str) -> str:
        if not v or not isinstance(v, str) or not v.strip():
            raise ValueError("Destination must be a non-empty string.")
        return v.strip()

class AttractionItem(BaseModel):
    name: str
    address: str
    rating: float
    user_ratings_total: Optional[int] = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = ""
    photo_reference: Optional[str] = ""
    types: List[str] = []

class DestinationResponse(BaseModel):
    status: str
    destination: str
    country: Optional[str] = "India"
    total_attractions: int
    attractions: List[AttractionItem]
    itinerary: Optional[List[Dict[str, Any]]] = []
    message: Optional[str] = None
