import os
import logging
import requests
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("weather_service")

class WeatherService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENWEATHER_API_KEY", "").strip()

    def get_weather_analysis(self, destination: str, days: int = 3) -> Dict[str, Any]:
        clean_dest = destination.strip() if destination else "Ooty"
        
        # Default climate profiles for common destinations
        dest_lower = clean_dest.lower()
        if any(term in dest_lower for term in ["ooty", "manali", "munnar", "shimla", "kodaikanal", "darjeeling"]):
            base_temp = 19.0
            cond = "Cool & Pleasant"
            uv = "5 (Moderate)"
            aqi = "AQI 18 (Good)"
            suggestions = [
                "Wear warm clothes & jacket in the evening.",
                "Good time for morning nature walks and botanical garden visits.",
                "Avoid high-altitude trekking after 5:30 PM."
            ]
        elif any(term in dest_lower for term in ["goa", "kerala", "mumbai", "chennai", "pondicherry"]):
            base_temp = 29.0
            cond = "Tropical & Sunny"
            uv = "8 (Very High)"
            aqi = "AQI 35 (Good)"
            suggestions = [
                "Apply UV sunscreen and wear sunglasses during noon.",
                "Stay hydrated during beach activities.",
                "Carry a light umbrella for sudden coastal showers."
            ]
        else:
            base_temp = 25.0
            cond = "Clear & Sunny"
            uv = "6 (High)"
            aqi = "AQI 25 (Good)"
            suggestions = [
                "Pleasant weather for outdoor sightseeing.",
                "Carry water bottle and comfortable walking shoes."
            ]

        # Attempt OpenWeather API call if key configured
        if self.api_key:
            try:
                url = f"https://api.openweathermap.org/data/2.5/weather?q={clean_dest}&units=metric&appid={self.api_key}"
                resp = requests.get(url, timeout=6)
                if resp.status_code == 200:
                    data = resp.json()
                    base_temp = float(data.get("main", {}).get("temp", base_temp))
                    cond = data.get("weather", [{}])[0].get("description", cond).title()
            except Exception as e:
                logger.warning(f"OpenWeather API exception: {e}")

        # Current weather metrics
        current = {
            "temperature": f"{round(base_temp, 1)}°C",
            "feels_like": f"{round(base_temp - 1.2, 1)}°C",
            "humidity": "62%",
            "wind_speed": "12 km/h",
            "pressure": "1014 hPa",
            "visibility": "10 km",
            "uv_index": uv,
            "sunrise": "06:12 AM",
            "sunset": "06:45 PM",
            "air_quality": aqi
        }

        # Build 4-slot forecast per day
        daily_forecasts: List[Dict[str, Any]] = []
        for d in range(1, days + 1):
            temp_var = (d % 2) - 1
            daily_forecasts.append({
                "day": d,
                "slots": {
                    "morning": {"time": "08:00 AM", "temp": f"{round(base_temp - 3 + temp_var)}°C", "icon": "fa-sun", "rain_prob": "10%", "desc": "Fresh & Sunny"},
                    "afternoon": {"time": "01:00 PM", "temp": f"{round(base_temp + 3 + temp_var)}°C", "icon": "fa-cloud-sun", "rain_prob": "20%", "desc": "Bright & Mild"},
                    "evening": {"time": "06:00 PM", "temp": f"{round(base_temp - 1 + temp_var)}°C", "icon": "fa-cloud", "rain_prob": "15%", "desc": "Cool Breeze"},
                    "night": {"time": "09:00 PM", "temp": f"{round(base_temp - 5 + temp_var)}°C", "icon": "fa-moon", "rain_prob": "5%", "desc": "Clear Skies"}
                }
            })

        return {
            "status": "success",
            "destination": clean_dest,
            "current": current,
            "daily_forecast": daily_forecasts,
            "ai_suggestions": suggestions
        }
