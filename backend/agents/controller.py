"""
Multi-Agent Controller (Production Grade & Parallelized)
======================================================
Orchestrates execution sequence across all 6 specialized AI agents:
1. Destination Agent (Sequential First)
2. Parallel Execution via asyncio.gather():
   - Budget Agent
   - Weather Agent
   - Transport Agent
   - Accommodation Agent
3. Itinerary Agent (Final Synthesis after parallel tasks finish)
"""

import logging
import asyncio
from typing import Dict, Any

from agents.destination_agent import run_destination_agent_async
from agents.budget_agent import run_budget_agent_async
from agents.weather_agent import run_weather_agent_async
from agents.transport_agent import run_transport_agent_async
from agents.accommodation_agent import run_accommodation_agent_async
from agents.itinerary_agent import run_itinerary_agent_async

logger = logging.getLogger("multi_agent_controller")


async def orchestrate_trip_plan_async(trip_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main Multi-Agent Orchestrator Pipeline (High Performance Concurrent Execution).
    1. Concurrently launch Destination, Budget, Weather, Transport, Accommodation agents via asyncio.create_task().
    2. Only start the Itinerary Agent after the Destination Agent finishes.
    3. Return consolidated results with per-agent fault tolerance.
    """
    destination = trip_data.get("destination", "Ooty")
    days = int(trip_data.get("days", 3))
    budget = float(trip_data.get("budget", 50000))
    travelers = int(trip_data.get("travelers", 2))
    travel_style = trip_data.get("travel_style", "Standard")
    interests = trip_data.get("interests", [])
    from_location = trip_data.get("from_location", "Chennai")

    logger.info(f"[ORCHESTRATOR] Initializing Multi-Agent Pipeline for destination: '{destination}'")

    # Launch Destination, Budget, Weather, Transport, Accommodation concurrently
    dest_task = asyncio.create_task(run_destination_agent_async(destination=destination, limit=10))
    budget_task = asyncio.create_task(run_budget_agent_async(
        budget=budget,
        days=days,
        travelers=travelers,
        travel_style=travel_style
    ))
    weather_task = asyncio.create_task(run_weather_agent_async(
        destination=destination,
        days=days
    ))
    transport_task = asyncio.create_task(run_transport_agent_async(
        from_location=from_location,
        destination=destination
    ))
    accommodation_task = asyncio.create_task(run_accommodation_agent_async(
        destination=destination,
        budget=budget,
        travelers=travelers,
        days=days,
        travel_style=travel_style
    ))

    # Requirement 2: Only start the Itinerary Agent after the Destination Agent finishes
    try:
        dest_result = await dest_task
    except Exception as exc:
        logger.error(f"[ORCHESTRATOR] Destination Agent failed: {exc}")
        dest_result = {
            "status": "error",
            "destination": destination,
            "places": [],
            "attractions": [],
            "message": f"Destination Agent error: {str(exc)}"
        }

    # Await remaining parallel tasks safely
    budget_res, weather_res, transport_res, accommodation_res = await asyncio.gather(
        budget_task,
        weather_task,
        transport_task,
        accommodation_task,
        return_exceptions=True
    )

    # Graceful failure handling per section
    if isinstance(budget_res, Exception):
        logger.error(f"[ORCHESTRATOR] Budget Agent exception: {budget_res}")
        budget_res = {"status": "error", "agent": "Budget Agent", "message": f"Budget Agent failed: {str(budget_res)}"}

    if isinstance(weather_res, Exception):
        logger.error(f"[ORCHESTRATOR] Weather Agent exception: {weather_res}")
        weather_res = {"status": "error", "destination": destination, "message": f"Weather Agent failed: {str(weather_res)}"}

    if isinstance(transport_res, Exception):
        logger.error(f"[ORCHESTRATOR] Transport Agent exception: {transport_res}")
        transport_res = {"status": "error", "destination": destination, "message": f"Transport Agent failed: {str(transport_res)}"}

    if isinstance(accommodation_res, Exception):
        logger.error(f"[ORCHESTRATOR] Accommodation Agent exception: {accommodation_res}")
        accommodation_res = {"status": "error", "destination": destination, "hotels": [], "message": f"Accommodation Agent failed: {str(accommodation_res)}"}

    logger.info("[ORCHESTRATOR] Destination agent finished. Synthesizing itinerary schedule...")

    # Step 3: Itinerary Agent (Executed after Destination Agent finishes)
    try:
        itinerary_res = await run_itinerary_agent_async(
            destination=destination,
            days=days,
            interests=interests,
            dest_result=dest_result,
            weather_result=weather_res if isinstance(weather_res, dict) else None,
            budget_result=budget_res if isinstance(budget_res, dict) else None,
            transport_result=transport_res if isinstance(transport_res, dict) else None,
            accommodation_result=accommodation_res if isinstance(accommodation_res, dict) else None
        )
    except Exception as exc:
        logger.error(f"[ORCHESTRATOR] Itinerary Agent failed: {exc}")
        itinerary_res = {"status": "error", "agent": "Itinerary Agent", "schedule": [], "itinerary": [], "message": f"Itinerary Agent error: {str(exc)}"}

    logger.info("[ORCHESTRATOR] Multi-Agent Pipeline completed successfully.")

    # Step 4: Return consolidated results after every agent finishes
    return {
        "status": "success",
        "controller": "Multi-Agent Orchestrator",
        "destination": dest_result,
        "budget": budget_res,
        "weather": weather_res,
        "transport": transport_res,
        "accommodation": accommodation_res,
        "itinerary": itinerary_res
    }


def orchestrate_trip_plan(trip_data: dict) -> dict:
    """Sync wrapper for orchestrate_trip_plan."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            return asyncio.run_coroutine_threadsafe(orchestrate_trip_plan_async(trip_data), loop).result()
        return loop.run_until_complete(orchestrate_trip_plan_async(trip_data))
    except Exception:
        return asyncio.run(orchestrate_trip_plan_async(trip_data))
