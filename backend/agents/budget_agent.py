import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("budget_agent")

async def run_budget_agent_async(
    budget: float = 50000.0,
    days: int = 3,
    travelers: int = 2,
    travel_style: str = "Standard",
    selected_hotel_cost: Optional[float] = None,
    selected_transport_cost: Optional[float] = None
) -> Dict[str, Any]:
    """
    Async Budget Agent calculating cost estimation and INR expense breakdown.
    """
    try:
        total = float(budget or 50000.0)
        num_days = max(1, int(days or 3))
        num_travelers = max(1, int(travelers or 2))
        style = travel_style or "Standard"

        alloc_hotel = total * 0.40
        alloc_transport = total * 0.25
        alloc_food = total * 0.20
        alloc_tickets = total * 0.10
        alloc_shopping = total * 0.03
        alloc_misc = total * 0.02

        spent_hotel = selected_hotel_cost if selected_hotel_cost is not None else alloc_hotel * 0.85
        spent_transport = selected_transport_cost if selected_transport_cost is not None else alloc_transport * 0.75
        spent_food = (800.0 if style == "Standard" else (1500.0 if style == "Luxury" else 400.0)) * num_days * num_travelers
        spent_tickets = min(alloc_tickets, 1200.0 * num_days * num_travelers)
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
            return {"category": name, "allocated": round(alloc, 2), "spent": round(spent, 2), "remaining": round(rem, 2), "percent_used": used}

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

        return {
            "status": "success",
            "agent": "Budget Agent",
            "total_budget": round(total, 2),
            "total_spent": round(total_spent, 2),
            "remaining_budget": round(remaining, 2),
            "health_status": health,
            "cost_per_person": round(total_spent / num_travelers, 2),
            "daily_average": round(total_spent / num_days, 2),
            "categories": categories,
            "ai_suggestions": suggestions
        }
    except Exception as exc:
        logger.error(f"Budget Agent error: {exc}")
        return {
            "status": "error",
            "agent": "Budget Agent",
            "message": f"Budget Agent failed: {str(exc)}"
        }

def calculate_budget(total_budget: float, days: int, travel_style: str):
    """Sync wrapper function."""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            return asyncio.run_coroutine_threadsafe(run_budget_agent_async(budget=total_budget, days=days, travel_style=travel_style), loop).result()
        return loop.run_until_complete(run_budget_agent_async(budget=total_budget, days=days, travel_style=travel_style))
    except Exception:
        return asyncio.run(run_budget_agent_async(budget=total_budget, days=days, travel_style=travel_style))
