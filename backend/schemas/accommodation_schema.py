from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class AccommodationRequest(BaseModel):
    destination: str = Field(..., description="Target travel destination", example="Ooty")
    budget: Optional[float] = Field(50000, description="Estimated total budget in INR", example=50000)
    travelers: Optional[int] = Field(2, description="Number of travelers", example=2)
    days: Optional[int] = Field(3, description="Trip duration in days", example=3)
    travel_style: Optional[str] = Field("Luxury", description="Travel comfort tier", example="Luxury")

    @field_validator("destination")
    @classmethod
    def validate_dest(cls, v: str) -> str:
        if not v or not isinstance(v, str) or not v.strip():
            raise ValueError("Destination cannot be empty.")
        return v.strip()

class HotelItem(BaseModel):
    name: str
    rating: float
    user_ratings_total: int
    address: str
    latitude: float
    longitude: float
    place_id: str
    photo_url: str
    google_maps_url: str
    price_category: str
    hotel_type: str
    open_status: str
    distance_km: float
    ai_score: int

class AccommodationResponse(BaseModel):
    status: str
    destination: str
    total_hotels: int
    travel_style: str
    budget: float
    hotels: List[HotelItem]
    message: Optional[str] = None
