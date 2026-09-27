from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from ml.src.ml_service import predict_inventory


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Polar Inventory ML API",
    description=(
        "Inventory demand prediction API for "
        "Polar Expedition Logistics"
    ),
    version="1.0.0",
)


# ============================================================
# REQUEST MODEL
# ============================================================

class InventoryRequest(BaseModel):

    # --------------------------------------------------------
    # Operational identification
    # --------------------------------------------------------

    # Used for expedition/backend tracking.
    # IMPORTANT:
    # This is NOT passed to the ML model.
    expedition_id: str

    item_id: str
    item_name: str
    item_category: str
    station: str

    # --------------------------------------------------------
    # Expedition information
    # --------------------------------------------------------

    personnel_count: int = Field(
        ge=1
    )

    expedition_duration: int = Field(
        ge=1
    )

    # --------------------------------------------------------
    # Inventory information
    # --------------------------------------------------------

    opening_stock: float = Field(
        ge=0
    )

    minimum_stock: float = Field(
        ge=0
    )

    lead_time: int = Field(
        ge=0
    )

    # --------------------------------------------------------
    # Historical demand
    # --------------------------------------------------------

    previous_expedition_consumption: float = Field(
        ge=0
    )

    inventory_usage_history: float = Field(
        ge=0
    )

    consumption_lag_1: float = Field(
        ge=0
    )

    consumption_lag_7: float = Field(
        ge=0
    )

    consumption_avg_7: float = Field(
        ge=0
    )

    consumption_avg_14: float = Field(
        ge=0
    )

    # --------------------------------------------------------
    # NCPOR weather features
    # --------------------------------------------------------

    temperature_mean: float
    temperature_min: float
    temperature_max: float

    pressure_mean: float
    pressure_min: float
    pressure_max: float

    wind_speed_mean: float = Field(
        ge=0
    )

    wind_speed_max: float = Field(
        ge=0
    )


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root() -> dict[str, str]:

    return {
        "service": "Polar Inventory ML API",
        "status": "running",
        "version": "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health() -> dict[str, str]:

    return {
        "status": "healthy",
        "model": "loaded",
    }


# ============================================================
# INVENTORY PREDICTION
# ============================================================

@app.post("/predict/inventory")
def inventory_prediction(
    request: InventoryRequest
) -> dict[str, Any]:

    try:

        # Convert Pydantic request to dictionary
        input_data = request.model_dump()

        # Send data to ML service
        result = predict_inventory(
            input_data
        )

        return {
            "success": True,
            "data": result,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )