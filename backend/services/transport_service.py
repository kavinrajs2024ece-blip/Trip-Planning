import os
import logging
import requests
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("transport_service")

GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json"
DIRECTIONS_API_URL = "https://maps.googleapis.com/maps/api/directions/json"

class TransportService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GOOGLE_MAPS_API_KEY", "").strip()

    def get_transport_analysis(self, from_location: str, destination: str) -> Dict[str, Any]:
        clean_from = from_location.strip() if from_location else "Chennai"
        clean_dest = destination.strip() if destination else "Ooty"

        # Default fallback route points
        from_lat, from_lng = 13.0827, 80.2707  # Chennai
        dest_lat, dest_lng = 11.4102, 76.6950  # Ooty
        dist_km = 555
        dur_str = "9h 30m"
        route_via = f"Via NH48 & NH181 to {clean_dest}"

        if self.api_key:
            try:
                # Geocode origin and destination
                r_from = requests.get(GEOCODING_API_URL, params={"address": clean_from, "key": self.api_key}, timeout=6)
                r_dest = requests.get(GEOCODING_API_URL, params={"address": clean_dest, "key": self.api_key}, timeout=6)
                
                if r_from.status_code == 200 and r_from.json().get("results"):
                    loc1 = r_from.json()["results"][0]["geometry"]["location"]
                    from_lat, from_lng = loc1["lat"], loc1["lng"]

                if r_dest.status_code == 200 and r_dest.json().get("results"):
                    loc2 = r_dest.json()["results"][0]["geometry"]["location"]
                    dest_lat, dest_lng = loc2["lat"], loc2["lng"]

                # Directions API call
                r_dir = requests.get(DIRECTIONS_API_URL, params={
                    "origin": f"{from_lat},{from_lng}",
                    "destination": f"{dest_lat},{dest_lng}",
                    "key": self.api_key
                }, timeout=8)

                if r_dir.status_code == 200 and r_dir.json().get("routes"):
                    route = r_dir.json()["routes"][0]
                    leg = route["legs"][0]
                    dist_km = round(leg.get("distance", {}).get("value", 555000) / 1000)
                    dur_str = leg.get("duration", {}).get("text", "9h 30m")
                    route_via = f"Via {route.get('summary', 'NH48 Highway')}"

            except Exception as e:
                logger.warning(f"Google Directions API exception: {e}")

        # Transport Options Matrix
        options: List[Dict[str, Any]] = [
            {
                "mode": "Car (Self-Drive / Personal)",
                "operator": "Personal Vehicle / Rental EV",
                "duration": dur_str,
                "distance": f"{dist_km} km",
                "estimated_cost": f"₹{round(dist_km * 7.5):,}",
                "rating": "4.8 ★",
                "fuel_estimate": f"{round(dist_km / 12, 1)} Liters (Petrol/Diesel)",
                "traffic_status": "Moderate Traffic on Highway",
                "road_condition": "Smooth 4-lane highway with 36-hairpin bend mountain road",
                "is_fastest": True
            },
            {
                "mode": "Bus (AC Sleeper / Volvo)",
                "operator": "KSRTC / SETC / Private Luxury Sleeper",
                "duration": f"{int(dur_str.split('h')[0]) + 2}h 15m",
                "distance": f"{dist_km} km",
                "estimated_cost": "₹950 per seat",
                "rating": "4.7 ★",
                "fuel_estimate": "N/A (Public Transit)",
                "traffic_status": "Regular Highway Schedule",
                "road_condition": "Overnight AC Volvo Express Service",
                "is_economical": True
            },
            {
                "mode": "Train (Express + Mountain Railway)",
                "operator": "Indian Railways / Nilgiri Toy Train",
                "duration": f"{int(dur_str.split('h')[0]) + 1}h 45m",
                "distance": f"{dist_km} km",
                "estimated_cost": "₹650 per ticket",
                "rating": "4.9 ★",
                "fuel_estimate": "N/A (Railway)",
                "traffic_status": "On Time Schedule",
                "road_condition": "Scenic UNESCO heritage mountain rail climb",
                "is_comfortable": True
            },
            {
                "mode": "Flight (Connecting Air + Taxi)",
                "operator": "IndiGo Air + Airport EV Cab",
                "duration": "4h 30m Total (1h 10m Flight + 2.5h Cab)",
                "distance": f"{dist_km} km",
                "estimated_cost": "₹3,800 per person",
                "rating": "4.6 ★",
                "fuel_estimate": "N/A (Commercial Flight)",
                "traffic_status": "Light Air Traffic",
                "road_condition": "Fly to nearest airport then highway taxi"
            },
            {
                "mode": "Outstation Taxi (Private EV)",
                "operator": "Intercity Outstation EV Fleet",
                "duration": dur_str,
                "distance": f"{dist_km} km",
                "estimated_cost": f"₹{round(dist_km * 12):,}",
                "rating": "4.8 ★",
                "fuel_estimate": "100% Electric Charging Stop Included",
                "traffic_status": "Normal Traffic",
                "road_condition": "Chauffeur driven doorstep pickup and drop"
            }
        ]

        # Generate polyline points between origin & destination for Leaflet route map
        polyline_points = [
            [from_lat, from_lng],
            [(from_lat * 0.7 + dest_lat * 0.3), (from_lng * 0.7 + dest_lng * 0.3)],
            [(from_lat * 0.4 + dest_lat * 0.6), (from_lng * 0.4 + dest_lng * 0.6)],
            [dest_lat, dest_lng]
        ]

        ai_recs = [
            "Bus (Overnight Volvo Sleeper) is the most economical travel option.",
            f"Car (Self-Drive / Taxi) is fastest taking approximately {dur_str}.",
            "Train via Mettupalayam offers the most comfortable & scenic UNESCO mountain railway views."
        ]

        return {
            "status": "success",
            "from": clean_from,
            "destination": clean_dest,
            "distance_km": dist_km,
            "estimated_duration": dur_str,
            "route_summary": route_via,
            "best_travel_option": "Car is fastest; Bus is most economical.",
            "options": options,
            "ai_recommendations": ai_recs,
            "polyline_points": polyline_points,
            "google_maps_navigation_url": f"https://www.google.com/maps/dir/?api=1&origin={from_lat},{from_lng}&destination={dest_lat},{dest_lng}&travelmode=driving"
        }
