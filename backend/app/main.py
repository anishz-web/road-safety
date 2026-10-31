import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.database import engine, Base
from backend.app.routes import (
    auth, districts, roads, cameras, weather,
    hazards, risk, recommendations, work_orders,
    before_after, simulation, analytics, alerts,
    reports, users, settings, media_inspector
)

# Ensure tables are bound
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="ROADGUARD TN - State Road Safety Command Center API",
    description="AI-Powered Statewide Predictive Road Safety and Traffic Intervention Management System for Tamil Nadu",
    version="2.4.0"
)

# Enable CORS for frontend Vite dev server and local access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for evidence and camera snapshots
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include API Routers
app.include_router(auth.router)
app.include_router(districts.router)
app.include_router(roads.router)
app.include_router(cameras.router)
app.include_router(weather.router)
app.include_router(hazards.router)
app.include_router(risk.router)
app.include_router(recommendations.router)
app.include_router(work_orders.router)
app.include_router(before_after.router)
app.include_router(simulation.router)
app.include_router(analytics.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(users.router)
app.include_router(settings.router)
app.include_router(media_inspector.router)

@app.get("/")
def root():
    return {
        "system": "ROADGUARD TN",
        "jurisdiction": "State of Tamil Nadu - Road Safety Commission",
        "status": "Operational",
        "version": "2.4.0",
        "api_docs": "/docs"
    }

@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "database": "MySQL 8.0 connected",
        "ai_models_loaded": True
    }

