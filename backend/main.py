import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure backend directory is always in sys.path for relative imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import routers
from routes.trip_routes import router as trip_router
from routes.destination_routes import router as destination_router
from routes.accommodation_routes import router as accommodation_router
from routes.weather_routes import router as weather_router
from routes.transport_routes import router as transport_router
from routes.budget_routes import router as budget_router
from routes.dashboard_routes import router as dashboard_router

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://trip-planning-2kd1-git-main-kavinrajs2024ece-1646s-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your routes...
# Enable CORS for frontend integration


# Mount Routers
app.include_router(trip_router)
app.include_router(destination_router)
app.include_router(accommodation_router)
app.include_router(weather_router)
app.include_router(transport_router)
app.include_router(budget_router)
app.include_router(dashboard_router)

@app.get("/")
def read_root():
    return {"message": "Travel Planning AI Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
