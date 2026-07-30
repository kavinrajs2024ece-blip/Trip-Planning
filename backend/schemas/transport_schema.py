from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional

class TransportRequest(BaseModel):
    from_location: str = Field(..., alias="from", description="Origin city or location", example="Chennai")
    destination: str = Field(..., description="Target travel destination", example="Ooty")

    @field_validator("destination")
    @classmethod
    def validate_dest(cls, v: str) -> str:
        if not v or not isinstance(v, str) or not v.strip():
            raise ValueError("Destination cannot be empty.")
        return v.strip()

    class Config:
        populate_by_name = True

class TransportResponse(BaseModel):
    status: str
    destination: str
    distance_km: float
    estimated_duration: str
    route_summary: str
    best_travel_option: str
    options: List[Dict[str, Any]]
    ai_recommendations: List[str]
    polyline_points: List[List[float]]
    google_maps_navigation_url: str
    message: Optional[str] = None
