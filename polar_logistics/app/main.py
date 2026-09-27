import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.inventory import router as inventory_router
from app.routes.forecast import router as forecast_router
from app.routes.cargo import router as cargo_router
from app.routes.expeditions import router as expeditions_router
from app.routes.personnel import router as personnel_router
from app.routes.stations import router as stations_router
from app.routes.vessels import router as vessels_router
from app.routes.emergency_incidents import router as emergency_incidents_router
from app.routes.alerts import router as alerts_router

app = FastAPI(
    title="Polar Expedition Logistics Backend",
    version="1.0.0"
)

default_cors_origins = "http://localhost:5173,http://127.0.0.1:5173"
cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", default_cors_origins).split(",")
    if origin.strip()
]

if "*" in cors_origins:
    raise ValueError("CORS_ORIGINS must list explicit origins; wildcard origins are not allowed.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(inventory_router)
app.include_router(forecast_router)
app.include_router(auth_router)
app.include_router(cargo_router)
app.include_router(expeditions_router)
app.include_router(personnel_router)
app.include_router(stations_router)
app.include_router(vessels_router)
app.include_router(emergency_incidents_router)
app.include_router(alerts_router)






@app.get("/")
def home():
    return {"message": "Polar Logistics Backend is Running"}
