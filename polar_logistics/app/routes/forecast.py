from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any
from app.ml_service import predict_inventory
from app.auth import AuthenticatedUser, require_roles

router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory Forecast"]
)


class ForecastRequest(BaseModel):
    expedition_id: str
    item_id: str = Field(min_length=1)
    item_name: str
    item_category: str = Field(min_length=1)
    station: str
    personnel_count: int = Field(ge=1)
    expedition_duration: int = Field(ge=1)
    opening_stock: float = Field(ge=0)
    minimum_stock: float = Field(ge=0)
    lead_time: int = Field(ge=0)
    previous_expedition_consumption: float = Field(ge=0)
    inventory_usage_history: float = Field(ge=0)
    consumption_lag_1: float = Field(ge=0)
    consumption_lag_7: float = Field(ge=0)
    consumption_avg_7: float = Field(ge=0)
    consumption_avg_14: float = Field(ge=0)
    temperature_mean: float
    temperature_min: float
    temperature_max: float
    pressure_mean: float
    pressure_min: float
    pressure_max: float
    wind_speed_mean: float = Field(ge=0)
    wind_speed_max: float = Field(ge=0)


@router.post("/forecast")
async def inventory_forecast(
    request: ForecastRequest,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC", "DOCTOR"))],
) -> Any:
    result = await predict_inventory(request.model_dump())
    return result
