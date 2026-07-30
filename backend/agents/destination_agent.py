"""
Destination Agent Alias Module
===============================
Re-exports destination agent logic from backend.app.agents.destination_agent
for flexible import paths across the backend architecture.
"""

from app.agents.destination_agent import (
    run_destination_agent,
    generate_destination,
    analyze_destination,
    DestinationAgent
)

__all__ = [
    "run_destination_agent",
    "generate_destination",
    "analyze_destination",
    "DestinationAgent"
]
