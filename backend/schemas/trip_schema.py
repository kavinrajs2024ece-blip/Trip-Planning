from pydantic import BaseModel
from typing import List, Optional

class TripCreateRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travelers: int
    travel_style: str
    interests: List[str]

class TripCreateResponse(BaseModel):
    trip_id: str
    status: str
    message: Optional[str] = "Trip request initialized successfully."
