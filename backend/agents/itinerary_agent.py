import logging
import asyncio
from math import ceil
from typing import Dict, Any, List

logger = logging.getLogger("itinerary_agent")

TIME_SLOTS = ["09:00 AM", "11:30 AM", "02:00 PM", "05:00 PM", "07:30 PM"]

async def run_itinerary_agent_async(
    destination: str,
    days: int = 3,
    interests: List[str] = None,
    dest_result: Dict[str, Any] = None,
    weather_result: Dict[str, Any] = None,
    budget_result: Dict[str, Any] = None,
    transport_result: Dict[str, Any] = None,
    accommodation_result: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Executes Itinerary Agent after Destination, Weather, Budget, Transport, and Accommodation agents finish.
    Synthesizes day-wise schedule with 100% unique non-repeating locations.
    """
    try:
        clean_dest = destination.strip() if destination else "Ooty"
        num_days = max(1, days or 3)
        attractions = []

        if dest_result and isinstance(dest_result, dict):
            attractions = dest_result.get("places") or dest_result.get("attractions") or []

        if not attractions:
            # Fallback default places if destination places array was empty
            attractions = [
                {"name": f"Central Botanical Gardens, {clean_dest}", "address": clean_dest, "category": "Botanical Garden & Park", "rating": 4.7},
                {"name": f"{clean_dest} Scenic Lake & Boating", "address": clean_dest, "category": "Lake & Waterbodies", "rating": 4.6},
                {"name": f"Panoramic Viewpoint Peak, {clean_dest}", "address": clean_dest, "category": "Viewpoint & Scenic Hill", "rating": 4.8},
                {"name": f"Heritage Museum & Cultural Center, {clean_dest}", "address": clean_dest, "category": "Heritage & Culture", "rating": 4.5},
                {"name": f"Local Spice & Artisan Bazaar, {clean_dest}", "address": clean_dest, "category": "Shopping & Culture", "rating": 4.4},
                {"name": f"Sacred Peace Sanctuary, {clean_dest}", "address": clean_dest, "category": "Religious & Sacred Site", "rating": 4.6}
            ]

        total = len(attractions)
        per_day = max(1, ceil(total / num_days))
        itinerary = []
        used_index = 0

        forecast_list = (weather_result or {}).get("daily_forecast", [])

        for day in range(1, num_days + 1):
            day_places = []
            slots = []
            count = 0

            day_weather = forecast_list[day - 1] if day - 1 < len(forecast_list) else {}
            slots_weather = day_weather.get("slots", {})

            while used_index < total and count < per_day:
                attr = dict(attractions[used_index])
                time_slot = TIME_SLOTS[count % len(TIME_SLOTS)]
                attr["time"] = time_slot
                day_places.append(attr)

                period_name = "Morning" if "09:00" in time_slot or "11:30" in time_slot else ("Afternoon" if "02:00" in time_slot else "Evening")
                weather_info = slots_weather.get(period_name.lower(), {})

                slots.append({
                    "time": time_slot,
                    "period": period_name,
                    "spot_name": attr.get("name", "Landmark Spot"),
                    "category": attr.get("category", "Sightseeing"),
                    "activity": f"Explore {attr.get('name')} and enjoy local surroundings.",
                    "duration": "2.0 hrs",
                    "meal_recommendation": "Local Delicacies & Tea",
                    "weather_desc": weather_info.get("desc", "Pleasant Weather")
                })
                used_index += 1
                count += 1

            itinerary.append({
                "day": day,
                "title": f"Exploration of {clean_dest} Highlights",
                "destination": clean_dest,
                "places": day_places,
                "slots": slots
            })

        return {
            "status": "success",
            "agent": "Itinerary Agent",
            "destination": clean_dest,
            "days": num_days,
            "schedule": itinerary,
            "itinerary": itinerary
        }

    except Exception as exc:
        logger.error(f"Itinerary Agent error: {exc}")
        return {
            "status": "error",
            "agent": "Itinerary Agent",
            "destination": destination,
            "schedule": [],
            "itinerary": [],
            "message": f"Itinerary Agent failed: {str(exc)}"
        }

def synthesize_itinerary(destination: str, days: int, interests: list):
    """Sync wrapper function."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            return asyncio.run_coroutine_threadsafe(run_itinerary_agent_async(destination=destination, days=days, interests=interests), loop).result()
        return loop.run_until_complete(run_itinerary_agent_async(destination=destination, days=days, interests=interests))
    except Exception:
        return asyncio.run(run_itinerary_agent_async(destination=destination, days=days, interests=interests))
