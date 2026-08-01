"""
Persistent Trip Store Service
==============================
Thread-safe, JSON-persisted storage module providing a single source of truth
for active trips, saved trips history, dashboard statistics, and system activity logs.
"""

import os
import json
import time
import threading
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("trip_store")

DATA_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "trips_store.json")

DEFAULT_INITIAL_TRIP = {
    "id": "TRIP-884920",
    "name": "Ooty",
    "country": "India",
    "fromLoc": "Chennai",
    "days": 3,
    "budget": 50000.0,
    "travelers": 2,
    "travelStyle": "Standard",
    "interests": ["Botanical Gardens", "Mountain Railways", "Tea Plantations", "Scenic Lakes"],
    "lat": 11.4102,
    "lng": 76.6950,
    "attractions": [
        {
            "name": "Government Botanical Garden, Ooty",
            "address": "Vannarapettai, Ooty, Tamil Nadu 643001, India",
            "rating": 4.8,
            "userRatingCount": 34500,
            "category": "Botanical Garden & Park",
            "latitude": 11.4167,
            "longitude": 76.7119,
            "photo_url": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80",
            "googleMapsUri": "https://www.google.com/maps/search/?api=1&query=Government+Botanical+Garden+Ooty"
        },
        {
            "name": "Ooty Lake & Boating Spot",
            "address": "Lake Road, Ooty, Tamil Nadu 643001, India",
            "rating": 4.6,
            "userRatingCount": 28900,
            "category": "Lake & Waterbodies",
            "latitude": 11.4072,
            "longitude": 76.6872,
            "photo_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80",
            "googleMapsUri": "https://www.google.com/maps/search/?api=1&query=Ooty+Lake"
        },
        {
            "name": "Doddabetta Peak Viewpoint",
            "address": "Ooty-Kotagiri Road, Ooty, Tamil Nadu 643002, India",
            "rating": 4.7,
            "userRatingCount": 22100,
            "category": "Viewpoint & Scenic Hill",
            "latitude": 11.4011,
            "longitude": 76.7364,
            "photo_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
            "googleMapsUri": "https://www.google.com/maps/search/?api=1&query=Doddabetta+Peak+Ooty"
        },
        {
            "name": "Nilgiri Mountain Railway Heritage Station",
            "address": "Ooty Railway Station Road, Ooty, Tamil Nadu 643001, India",
            "rating": 4.9,
            "userRatingCount": 18400,
            "category": "Heritage & Culture",
            "latitude": 11.4060,
            "longitude": 76.6961,
            "photo_url": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80",
            "googleMapsUri": "https://www.google.com/maps/search/?api=1&query=Nilgiri+Mountain+Railway+Ooty"
        }
    ],
    "hotels": [
        {
            "name": "Savoy - IHCL SeleQtions, Ooty",
            "rating": 4.8,
            "userRatingCount": 1420,
            "address": "77, Sylks Road, Udhagamandalam, Ooty, Tamil Nadu 643001",
            "price_category": "Luxury",
            "hotel_type": "Heritage Luxury Resort",
            "distance_km": 1.2,
            "ai_score": 98,
            "photo_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
            "googleMapsUri": "https://www.google.com/maps/search/?api=1&query=Savoy+IHCL+Ooty"
        },
        {
            "name": "Sterling Ooty Fern Hill",
            "rating": 4.6,
            "userRatingCount": 2150,
            "address": "Fern Hill, Ooty, Tamil Nadu 643004",
            "price_category": "Standard",
            "hotel_type": "Hilltop Resort",
            "distance_km": 2.5,
            "ai_score": 92,
            "photo_url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80",
            "googleMapsUri": "https://www.google.com/maps/search/?api=1&query=Sterling+Ooty+Fern+Hill"
        }
    ],
    "weatherData": {
        "status": "success",
        "destination": "Ooty",
        "current": {
            "temperature": "19.0°C",
            "feels_like": "17.8°C",
            "humidity": "62%",
            "wind_speed": "12 km/h",
            "pressure": "1014 hPa",
            "visibility": "10 km",
            "uv_index": "5 (Moderate)",
            "air_quality": "AQI 18 (Good)",
            "condition": "Cool & Pleasant"
        },
        "daily_forecast": [
            {
                "day": 1,
                "slots": {
                    "morning": {"time": "08:00 AM", "temp": "17°C", "icon": "fa-sun", "rain_prob": "10%", "desc": "Fresh & Sunny"},
                    "afternoon": {"time": "01:00 PM", "temp": "22°C", "icon": "fa-cloud-sun", "rain_prob": "20%", "desc": "Bright & Mild"},
                    "evening": {"time": "06:00 PM", "temp": "18°C", "icon": "fa-cloud", "rain_prob": "15%", "desc": "Cool Breeze"},
                    "night": {"time": "09:00 PM", "temp": "14°C", "icon": "fa-moon", "rain_prob": "5%", "desc": "Clear Skies"}
                }
            }
        ],
        "ai_suggestions": [
            "Wear warm clothes & jacket in the evening.",
            "Good time for morning nature walks and botanical garden visits."
        ]
    },
    "transportData": {
        "status": "success",
        "from": "Chennai",
        "destination": "Ooty",
        "distance_km": 555,
        "estimated_duration": "9h 30m",
        "route_summary": "Via NH48 & NH181 to Ooty",
        "best_travel_option": "Car is fastest; Bus is most economical.",
        "options": [
            {"mode": "Car (Self-Drive / Personal)", "duration": "9h 30m", "estimated_cost": "₹4,162", "fuel_estimate": "46 Liters", "rating": "4.8 ★", "is_fastest": True},
            {"mode": "Bus (AC Luxury Sleeper)", "duration": "11h 15m", "estimated_cost": "₹950", "rating": "4.7 ★", "is_economical": True},
            {"mode": "Train (Express + Toy Train)", "duration": "10h 45m", "estimated_cost": "₹650", "rating": "4.9 ★", "is_comfortable": True}
        ]
    },
    "itinerary": [
        {
            "day": 1,
            "title": "Exploration of Ooty Highlights",
            "destination": "Ooty",
            "places": [
                {"name": "Government Botanical Garden, Ooty", "time": "09:00 AM", "category": "Botanical Garden & Park"},
                {"name": "Ooty Lake & Boating Spot", "time": "11:30 AM", "category": "Lake & Waterbodies"}
            ],
            "slots": [
                {"time": "09:00 AM", "period": "Morning", "spot_name": "Government Botanical Garden, Ooty", "category": "Botanical Garden & Park", "activity": "Explore Government Botanical Garden, Ooty and enjoy local surroundings.", "duration": "2.0 hrs", "meal_recommendation": "Local Delicacies & Tea", "weather_desc": "Fresh & Sunny"},
                {"time": "11:30 AM", "period": "Morning", "spot_name": "Ooty Lake & Boating Spot", "category": "Lake & Waterbodies", "activity": "Explore Ooty Lake & Boating Spot and enjoy local surroundings.", "duration": "2.0 hrs", "meal_recommendation": "Local Delicacies & Tea", "weather_desc": "Bright & Mild"}
            ]
        }
    ],
    "costSummary": {
        "hotel": 20000,
        "transport": 12500,
        "food": 10000,
        "tickets": 7500,
        "total": 50000
    },
    "datePlanned": "Aug 1, 2026"
}


class TripStoreService:
    def __init__(self):
        self._lock = threading.Lock()
        self._store = {
            "active_trip": DEFAULT_INITIAL_TRIP,
            "saved_trips": [DEFAULT_INITIAL_TRIP],
            "favorite_hotels": [],
            "activity_logs": [
                f"[{datetime.now().strftime('%H:%M:%S')}] System initialized with FastAPI backend single source of truth."
            ]
        }
        self._load_from_disk()

    def _load_from_disk(self):
        with self._lock:
            if os.path.exists(DATA_FILE_PATH):
                try:
                    with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
                        content = json.load(f)
                        if isinstance(content, dict):
                            self._store["active_trip"] = content.get("active_trip") or DEFAULT_INITIAL_TRIP
                            self._store["saved_trips"] = content.get("saved_trips") or [DEFAULT_INITIAL_TRIP]
                            self._store["favorite_hotels"] = content.get("favorite_hotels") or []
                            self._store["activity_logs"] = content.get("activity_logs") or []
                            logger.info(f"[TRIP_STORE] Successfully loaded persisted trip store from {DATA_FILE_PATH}")
                except Exception as exc:
                    logger.error(f"[TRIP_STORE] Error reading disk store: {exc}. Using initial store.")

    def _save_to_disk(self):
        try:
            with open(DATA_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(self._store, f, indent=2, ensure_ascii=False)
            logger.info(f"[TRIP_STORE] Successfully persisted trip store to {DATA_FILE_PATH}")
        except Exception as exc:
            logger.error(f"[TRIP_STORE] Failed to persist store to disk: {exc}")

    def save_trip(self, trip_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves a trip, sets it as active, appends to saved trips, and persists state."""
        with self._lock:
            trip_id = trip_data.get("id") or f"TRIP-{int(time.time() * 1000)}"
            trip_data["id"] = trip_id

            if not trip_data.get("datePlanned"):
                trip_data["datePlanned"] = datetime.now().strftime("%b %d, %Y")

            self._store["active_trip"] = trip_data

            # Avoid duplicates in saved_trips
            existing_idx = -1
            for idx, item in enumerate(self._store["saved_trips"]):
                if item.get("id") == trip_id or item.get("name") == trip_data.get("name"):
                    existing_idx = idx
                    break

            if existing_idx >= 0:
                self._store["saved_trips"][existing_idx] = trip_data
            else:
                self._store["saved_trips"].insert(0, trip_data)

            time_str = datetime.now().strftime("%H:%M:%S")
            dest_name = trip_data.get("name") or trip_data.get("destination") or "Destination"
            self._store["activity_logs"].insert(0, f"[{time_str}] Planned multi-agent trip to {dest_name} ({trip_data.get('days', 3)} Days).")
            self._store["activity_logs"] = self._store["activity_logs"][:30]

            self._save_to_disk()
            return trip_data

    def get_active_trip(self) -> Dict[str, Any]:
        with self._lock:
            return self._store.get("active_trip") or DEFAULT_INITIAL_TRIP

    def get_trip_by_id(self, trip_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for t in self._store["saved_trips"]:
                if str(t.get("id")) == str(trip_id):
                    return t
            if str(self._store["active_trip"].get("id")) == str(trip_id):
                return self._store["active_trip"]
            return None

    def get_all_trips(self) -> List[Dict[str, Any]]:
        with self._lock:
            return self._store.get("saved_trips") or [DEFAULT_INITIAL_TRIP]

    def toggle_favorite_hotel(self, hotel_id: str) -> List[str]:
        with self._lock:
            favs = self._store.get("favorite_hotels", [])
            if hotel_id in favs:
                favs.remove(hotel_id)
            else:
                favs.append(hotel_id)
            self._store["favorite_hotels"] = favs
            self._save_to_disk()
            return favs

    def get_dashboard_data(self) -> Dict[str, Any]:
        with self._lock:
            saved_trips = self._store.get("saved_trips") or [DEFAULT_INITIAL_TRIP]
            active_trip = self._store.get("active_trip") or DEFAULT_INITIAL_TRIP
            unique_dests = set(t.get("name", t.get("destination")) for t in saved_trips if t.get("name") or t.get("destination"))
            total_budget = sum(float(t.get("budget", 0)) for t in saved_trips)

            return {
                "status": "success",
                "total_trips_planned": len(saved_trips),
                "active_destinations_count": len(unique_dests),
                "total_budget_allocated": round(total_budget, 2),
                "active_trip": active_trip,
                "recent_trips": saved_trips[:10],
                "favorite_hotels": self._store.get("favorite_hotels", []),
                "activity_logs": self._store.get("activity_logs", []),
                "system_status": {
                    "status": "Operational",
                    "active_agents": 6,
                    "api_health": "100%",
                    "backend_engine": "FastAPI Single Source of Truth"
                }
            }


# Singleton Instance
trip_store = TripStoreService()
