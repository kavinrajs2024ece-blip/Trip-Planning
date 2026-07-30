import logging
from typing import Dict, Any
from services.transport_service import TransportService

logger = logging.getLogger("transport_agent")

def run_transport_agent(from_location: str = "Chennai", destination: str = "Ooty") -> Dict[str, Any]:
    """
    Executes Transport Agent to calculate real transit routes and recommendations.
    """
    service = TransportService()
    return service.get_transport_analysis(from_location=from_location, destination=destination)

optimize_transport = run_transport_agent
