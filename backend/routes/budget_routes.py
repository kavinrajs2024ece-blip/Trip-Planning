from fastapi import APIRouter, status
from schemas.budget_schema import BudgetRequest, BudgetResponse, CategoryBreakdown

router = APIRouter(prefix="/api", tags=["Budget Agent"])

@router.post("/budget", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
def calculate_budget_analysis(payload: BudgetRequest):
    total = payload.budget or 50000.0
    days = max(1, payload.days or 3)
    travelers = max(1, payload.travelers or 2)
    style = payload.travel_style or "Standard"

    alloc_hotel = total * 0.40
    alloc_transport = total * 0.25
    alloc_food = total * 0.20
    alloc_tickets = total * 0.10
    alloc_shopping = total * 0.03
    alloc_misc = total * 0.02

    spent_hotel = payload.selected_hotel_cost if payload.selected_hotel_cost is not None else alloc_hotel * 0.85
    spent_transport = payload.selected_transport_cost if payload.selected_transport_cost is not None else alloc_transport * 0.75
    spent_food = (800.0 if style == "Standard" else (1500.0 if style == "Luxury" else 400.0)) * days * travelers
    spent_tickets = min(alloc_tickets, 1200.0 * days * travelers)
    spent_shopping = alloc_shopping * 0.70
    spent_misc = alloc_misc * 0.50

    total_spent = spent_hotel + spent_transport + spent_food + spent_tickets + spent_shopping + spent_misc
    remaining = total - total_spent

    pct_spent = (total_spent / total) * 100.0 if total > 0 else 0
    if pct_spent > 100:
        health = "Budget Exceeded"
    elif pct_spent > 80:
        health = "Approaching Budget Limit"
    else:
        health = "Budget Healthy"

    def make_cat(name, alloc, spent):
        rem = alloc - spent
        used = min(100.0, round((spent / alloc * 100.0), 1)) if alloc > 0 else 0.0
        return CategoryBreakdown(category=name, allocated=round(alloc, 2), spent=round(spent, 2), remaining=round(rem, 2), percent_used=used)

    categories = [
        make_cat("Accommodation", alloc_hotel, spent_hotel),
        make_cat("Transport", alloc_transport, spent_transport),
        make_cat("Food", alloc_food, spent_food),
        make_cat("Attraction Tickets", alloc_tickets, spent_tickets),
        make_cat("Shopping", alloc_shopping, spent_shopping),
        make_cat("Miscellaneous", alloc_misc, spent_misc)
    ]

    suggestions = [
        f"Switching to a Standard Hotel could save up to ₹{round(spent_hotel * 0.20):,} INR.",
        "Opting for Luxury Sleeper Bus instead of private taxi saves up to ₹1,800 INR on transit.",
        "Pre-booking attraction tickets online unlocks up to 10% discount passes."
    ]

    return BudgetResponse(
        status="success",
        total_budget=round(total, 2),
        total_spent=round(total_spent, 2),
        remaining_budget=round(remaining, 2),
        health_status=health,
        cost_per_person=round(total_spent / travelers, 2),
        daily_average=round(total_spent / days, 2),
        categories=categories,
        ai_suggestions=suggestions
    )
