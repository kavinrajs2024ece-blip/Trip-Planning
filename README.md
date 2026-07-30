# Travel Planning using Agentic AI

An enterprise-grade, Multi-Agent AI Travel Planning web application built with a modern HTML5/Vanilla CSS/JavaScript frontend and a Python FastAPI backend architecture.

---

## 📁 Full-Stack Project Structure

```text
TRIP_PLANNING/
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── assets/
│   ├── images/
│   └── components/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── app/
│   ├── agents/
│   │   ├── destination_agent.py
│   │   ├── budget_agent.py
│   │   ├── weather_agent.py
│   │   ├── transport_agent.py
│   │   ├── accommodation_agent.py
│   │   ├── itinerary_agent.py
│   │   └── controller.py
│   ├── routes/
│   │   └── trip_routes.py
│   ├── services/
│   │   ├── google_places.py
│   │   └── weather_service.py
│   ├── models/
│   └── schemas/
│       └── trip_schema.py
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Setup & Execution

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server with Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

   The server will start at: `http://localhost:8000`

---

## 🔌 API Endpoints

- **Root Health Check**:
  - `GET /`
  - Response: `{"message": "Travel Planning AI Backend Running"}`

- **Create AI Trip Plan**:
  - `POST /api/trip/create`
  - Request Body:
    ```json
    {
      "destination": "Goa",
      "days": 5,
      "budget": 50000,
      "travelers": 2,
      "travel_style": "Standard",
      "interests": ["Beach", "Food"]
    }
    ```
  - Response:
    ```json
    {
      "trip_id": "TRIP001",
      "status": "processing",
      "message": "Trip request initialized successfully."
    }
    ```

---

## 💻 Frontend Usage

Open `frontend/index.html` (or `index.html` at the project root) directly in any modern browser, or serve it via any static HTTP server. When submitting a new trip via the **Generate AI Travel Plan** form, the frontend will automatically issue a POST request to `http://localhost:8000/api/trip/create`. If the backend is running, it receives the live response and seamlessly transitions to the AI Processing page.
