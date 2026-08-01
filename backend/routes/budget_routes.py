from fastapi import APIRouter, status
from schemas.budget_schema import BudgetRequest, BudgetResponse
from agents.budget_agent import run_budget_agent_async

router = APIRouter(prefix="/api", tags=["Budget Agent"])

@router.post("/budget", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
async def calculate_budget_analysis(payload: BudgetRequest):
    res = await run_budget_agent_async(
        budget=payload.budget or 50000.0,
        days=payload.days or 3,
        travelers=payload.travelers or 2,
        travel_style=payload.travel_style or "Standard",
        selected_hotel_cost=payload.selected_hotel_cost,
        selected_transport_cost=payload.selected_transport_cost
    )
    return BudgetResponse(**res)
