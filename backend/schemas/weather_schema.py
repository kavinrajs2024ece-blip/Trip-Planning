from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional

class WeatherRequest(BaseModel):
    destination: str = Field(..., description="Target travel destination", example="Ooty")
    days: Optional[int] = Field(3, description="Number of travel days", example=3)

    @field_validator("destination")
    @classmethod
    def validate_dest(cls, v: str) -> str:
        if not v or not isinstance(v, str) or not v.strip():
            raise ValueError("Destination cannot be empty.")
        return v.strip()

class WeatherResponse(BaseModel):
    status: str
    destination: str
    current: Dict[str, Any]
    daily_forecast: List[Dict[str, Any]]
    ai_suggestions: List[str]
    message: Optional[str] = None
