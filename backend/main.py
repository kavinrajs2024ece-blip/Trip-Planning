import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from routes.trip_routes import router as trip_router
from routes.destination_routes import router as destination_router
from routes.accommodation_routes import router as accommodation_router
from routes.weather_routes import router as weather_router
from routes.transport_routes import router as transport_router
from routes.budget_routes import router as budget_router

app = FastAPI(
    title="Travel Planning AI Backend",
    description="Multi-Agent AI Travel Planning System API",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(trip_router)
app.include_router(destination_router)
app.include_router(accommodation_router)
app.include_router(weather_router)
app.include_router(transport_router)
app.include_router(budget_router)

@app.get("/")
def read_root():
    return {"message": "Travel Planning AI Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
