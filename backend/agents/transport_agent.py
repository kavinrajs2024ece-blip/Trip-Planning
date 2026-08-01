import logging
import asyncio
from typing import Dict, Any
from services.transport_service import TransportService

logger = logging.getLogger("transport_agent")

async def run_transport_agent_async(from_location: str = "Chennai", destination: str = "Ooty") -> Dict[str, Any]:
    """
    Executes Transport Agent asynchronously to calculate real transit routes and recommendations.
    """
    try:
        service = TransportService()
        return await service.get_transport_analysis_async(from_location=from_location, destination=destination)
    except Exception as exc:
        logger.error(f"Transport Agent error: {exc}")
        return {
            "status": "error",
            "from": from_location,
            "destination": destination,
            "message": f"Transport Agent failed: {str(exc)}"
        }

def run_transport_agent(from_location: str = "Chennai", destination: str = "Ooty") -> Dict[str, Any]:
    """Sync wrapper for Transport Agent."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            return asyncio.run_coroutine_threadsafe(run_transport_agent_async(from_location=from_location, destination=destination), loop).result()
        return loop.run_until_complete(run_transport_agent_async(from_location=from_location, destination=destination))
    except Exception:
        return asyncio.run(run_transport_agent_async(from_location=from_location, destination=destination))

optimize_transport = run_transport_agent
