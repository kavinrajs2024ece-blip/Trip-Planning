from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class BudgetRequest(BaseModel):
    budget: float = Field(50000.0, description="Total budget in INR")
    days: int = Field(3, description="Number of days")
    travelers: int = Field(2, description="Number of travelers")
    travel_style: Optional[str] = Field("Standard", description="Travel style tier")
    selected_hotel_cost: Optional[float] = None
    selected_transport_cost: Optional[float] = None

class CategoryBreakdown(BaseModel):
    category: str
    allocated: float
    spent: float
    remaining: float
    percent_used: float

class BudgetResponse(BaseModel):
    status: str
    total_budget: float
    total_spent: float
    remaining_budget: float
    health_status: str
    cost_per_person: float
    daily_average: float
    categories: List[CategoryBreakdown]
    ai_suggestions: List[str]
