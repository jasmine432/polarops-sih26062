import os
from datetime import datetime
from typing import Any
from sqlalchemy.orm import Session

from ..models import Expedition, Inventory, InventoryTransaction, ResupplyItem
from ..schemas import (
    ResupplyItemCreate,
    ResupplyItemUpdate,
    ResupplyItemResponse,
    MLResupplyGenerateRequest,
    MLResupplyGenerateResponse,
)
from ..ml_service import predict_inventory

# Standard baseline category consumption means (from baseline_metrics.json)
CATEGORY_BASELINES = {
    "fuel & energy": 125.63,
    "provisions & rations": 55.47,
    "water & life support": 42.10,
    "medical supplies": 15.20,
    "scientific reagents": 12.00,
    "vehicle & machinery spares": 8.50,
}
GLOBAL_BASELINE = 39.16

# Weather profiles for Antarctic / Arctic stations
STATION_WEATHER_PROFILES = {
    "maitri": {
        "temperature_mean": -10.5,
        "temperature_min": -25.0,
        "temperature_max": 2.0,
        "pressure_mean": 985.0,
        "pressure_min": 950.0,
        "pressure_max": 1010.0,
        "wind_speed_mean": 18.5,
        "wind_speed_max": 45.0,
    },
    "bharati": {
        "temperature_mean": -9.8,
        "temperature_min": -22.0,
        "temperature_max": 3.5,
        "pressure_mean": 990.0,
        "pressure_min": 955.0,
        "pressure_max": 1015.0,
        "wind_speed_mean": 16.0,
        "wind_speed_max": 40.0,
    },
    "himadri": {
        "temperature_mean": -4.0,
        "temperature_min": -15.0,
        "temperature_max": 6.0,
        "pressure_mean": 1005.0,
        "pressure_min": 970.0,
        "pressure_max": 1025.0,
        "wind_speed_mean": 12.0,
        "wind_speed_max": 30.0,
    },
}
DEFAULT_WEATHER_PROFILE = {
    "temperature_mean": -10.0,
    "temperature_min": -24.0,
    "temperature_max": 2.0,
    "pressure_mean": 985.0,
    "pressure_min": 950.0,
    "pressure_max": 1010.0,
    "wind_speed_mean": 18.0,
    "wind_speed_max": 42.0,
}


def calculate_safety_stock(minimum_stock: float) -> float:
    """safety_stock = minimum_stock * 0.20"""
    return round(float(minimum_stock or 0.0) * 0.20, 2)


def calculate_reorder_threshold(minimum_stock: float, safety_stock: float) -> float:
    """reorder_threshold = minimum_stock + safety_stock"""
    return round(float(minimum_stock or 0.0) + float(safety_stock or 0.0), 2)


def calculate_projected_total_need(predicted_demand: float, minimum_stock: float, safety_stock: float) -> float:
    """projected_total_need = predicted_demand + minimum_stock + safety_stock"""
    return round(float(predicted_demand or 0.0) + float(minimum_stock or 0.0) + float(safety_stock or 0.0), 2)


def calculate_recommended_resupply_quantity(projected_total_need: float, current_stock: float) -> float:
    """recommended_resupply_quantity = max(0, projected_total_need - current_stock)"""
    return round(max(0.0, float(projected_total_need or 0.0) - float(current_stock or 0.0)), 2)


def determine_priority(current_stock: float, reorder_threshold: float, minimum_stock: float, resupply_qty: float) -> str:
    """Deterministic priority determination."""
    if current_stock <= 0 or resupply_qty > (minimum_stock * 1.5 if minimum_stock > 0 else 50):
        return "CRITICAL"
    if current_stock < reorder_threshold:
        return "HIGH"
    return "NORMAL"


def get_resupply_items(db: Session, expedition: Expedition) -> list[ResupplyItemResponse]:
    """Retrieve all resupply line items for the given expedition."""
    items = db.query(ResupplyItem).filter(
        ResupplyItem.expedition_id == expedition.expedition_id
    ).order_by(ResupplyItem.id.asc()).all()
    return [ResupplyItemResponse.model_validate(item) for item in items]


def create_resupply_item(db: Session, expedition: Expedition, payload: ResupplyItemCreate) -> ResupplyItemResponse:
    """Create a new resupply line item with deterministic stock calculations."""
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    # Validate inventory reference if provided
    inv_id = payload.inventory_id
    if inv_id is not None:
        inv_match = db.query(Inventory).filter(Inventory.id == inv_id).first()
        if not inv_match:
            inv_id = None

    curr_stock = float(payload.current_stock or 0.0)
    min_stock = float(payload.minimum_stock or 0.0)
    pred_demand = float(payload.predicted_demand or 0.0)

    # Apply deterministic formulas
    s_stock = payload.safety_stock if payload.safety_stock is not None else calculate_safety_stock(min_stock)
    reorder_thresh = payload.reorder_threshold if payload.reorder_threshold is not None else calculate_reorder_threshold(min_stock, s_stock)
    proj_need = calculate_projected_total_need(pred_demand, min_stock, s_stock)
    resupply_qty = payload.resupply_quantity if payload.resupply_quantity is not None else calculate_recommended_resupply_quantity(proj_need, curr_stock)

    new_item = ResupplyItem(
        expedition_id=expedition.expedition_id,
        inventory_id=inv_id,
        item_name=payload.item_name.strip(),
        category=payload.category.strip() if payload.category else "Provisions & Rations",
        unit=payload.unit.strip() if payload.unit else "units",
        current_stock=curr_stock,
        minimum_stock=min_stock,
        predicted_demand=pred_demand,
        safety_stock=s_stock,
        reorder_threshold=reorder_thresh,
        resupply_quantity=resupply_qty,
        source_station_id=payload.source_station_id.strip() if payload.source_station_id else "Cape Town Staging Depot",
        delivery_vessel_id=payload.delivery_vessel_id.strip() if payload.delivery_vessel_id else expedition.primary_vessel,
        target_eta=payload.target_eta.strip() if payload.target_eta else None,
        priority=payload.priority or "NORMAL",
        status=payload.status or "PLANNED",
        is_ml_recommended=payload.is_ml_recommended,
        ml_confidence=payload.ml_confidence,
        recommendation_notes=payload.recommendation_notes.strip() if payload.recommendation_notes else None,
        created_at=now_str,
        updated_at=now_str,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return ResupplyItemResponse.model_validate(new_item)


def update_resupply_item(db: Session, expedition: Expedition, item_id: int, payload: ResupplyItemUpdate) -> ResupplyItemResponse:
    """Update an existing resupply line item (e.g. quantity adjustment, approval, cancellation)."""
    item = db.query(ResupplyItem).filter(
        ResupplyItem.id == item_id,
        ResupplyItem.expedition_id == expedition.expedition_id
    ).first()

    if not item:
        raise ValueError(f"Resupply item #{item_id} not found for expedition {expedition.expedition_id}.")

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    if payload.item_name is not None:
        item.item_name = payload.item_name.strip()
    if payload.category is not None:
        item.category = payload.category.strip()
    if payload.unit is not None:
        item.unit = payload.unit.strip()
    if payload.current_stock is not None:
        item.current_stock = float(payload.current_stock)
    if payload.minimum_stock is not None:
        item.minimum_stock = float(payload.minimum_stock)
    if payload.predicted_demand is not None:
        item.predicted_demand = float(payload.predicted_demand)

    # Recalculate deterministic figures if stock inputs changed and no explicit override given
    curr_stock = float(item.current_stock or 0.0)
    min_stock = float(item.minimum_stock or 0.0)
    pred_demand = float(item.predicted_demand or 0.0)

    if payload.safety_stock is not None:
        item.safety_stock = float(payload.safety_stock)
    else:
        item.safety_stock = calculate_safety_stock(min_stock)

    if payload.reorder_threshold is not None:
        item.reorder_threshold = float(payload.reorder_threshold)
    else:
        item.reorder_threshold = calculate_reorder_threshold(min_stock, float(item.safety_stock))

    proj_need = calculate_projected_total_need(pred_demand, min_stock, float(item.safety_stock))

    if payload.resupply_quantity is not None:
        item.resupply_quantity = float(payload.resupply_quantity)
    elif payload.current_stock is not None or payload.minimum_stock is not None or payload.predicted_demand is not None:
        item.resupply_quantity = calculate_recommended_resupply_quantity(proj_need, curr_stock)

    if payload.source_station_id is not None:
        item.source_station_id = payload.source_station_id.strip()
    if payload.delivery_vessel_id is not None:
        item.delivery_vessel_id = payload.delivery_vessel_id.strip()
    if payload.target_eta is not None:
        item.target_eta = payload.target_eta.strip()
    if payload.priority is not None:
        item.priority = payload.priority
    if payload.status is not None:
        item.status = payload.status
    if payload.recommendation_notes is not None:
        item.recommendation_notes = payload.recommendation_notes.strip()

    item.updated_at = now_str
    db.commit()
    db.refresh(item)
    return ResupplyItemResponse.model_validate(item)


def delete_resupply_item(db: Session, expedition: Expedition, item_id: int) -> dict[str, Any]:
    """Remove a resupply line item."""
    item = db.query(ResupplyItem).filter(
        ResupplyItem.id == item_id,
        ResupplyItem.expedition_id == expedition.expedition_id
    ).first()

    if not item:
        raise ValueError(f"Resupply item #{item_id} not found for expedition {expedition.expedition_id}.")

    db.delete(item)
    db.commit()
    return {
        "success": True,
        "message": f"Resupply item #{item_id} ({item.item_name}) deleted successfully.",
        "id": item_id,
    }


def seed_initial_resupply_if_empty(db: Session) -> None:
    """Seed realistic initial resupply plan items if empty."""
    count = db.query(ResupplyItem).count()
    if count == 0:
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        # Look up inventory items by name dynamically
        fuel_inv = db.query(Inventory).filter(Inventory.item_name.ilike("%Aviation Turbine Fuel%")).first()
        water_inv = db.query(Inventory).filter(Inventory.item_name.ilike("%RO Membrane%")).first()
        rations_inv = db.query(Inventory).filter(Inventory.item_name.ilike("%Rations%")).first()

        demo_items = [
            {
                "expedition_id": "EXP-2026-014",
                "inventory_id": fuel_inv.id if fuel_inv else None,
                "item_name": "Aviation Turbine Fuel (Jet A-1 Polar Spec)",
                "category": "Fuel & Energy",
                "unit": "Liters",
                "current_stock": float(fuel_inv.quantity) if fuel_inv else 24000.0,
                "minimum_stock": float(fuel_inv.minimum_stock) if fuel_inv else 80000.0,
                "predicted_demand": 96000.0,
                "safety_stock": 16000.0,
                "reorder_threshold": 96000.0,
                "resupply_quantity": 168000.0,
                "source_station_id": "Cape Town Staging Port",
                "delivery_vessel_id": "MV Vasily Golovnin",
                "target_eta": "14 Feb 2027",
                "priority": "CRITICAL",
                "status": "APPROVED",
                "is_ml_recommended": True,
                "ml_confidence": "HIGH",
                "recommendation_notes": "ML demand forecast projects 96,000 L requirement vs physical stock.",
                "created_at": now_str,
                "updated_at": now_str,
            },
            {
                "expedition_id": "EXP-2026-014",
                "inventory_id": water_inv.id if water_inv else None,
                "item_name": "Lake Priyadarshini RO Membrane Cartridges",
                "category": "Water & Life Support",
                "unit": "Units",
                "current_stock": float(water_inv.quantity) if water_inv else 3.0,
                "minimum_stock": float(water_inv.minimum_stock) if water_inv else 6.0,
                "predicted_demand": 4.0,
                "safety_stock": 1.2,
                "reorder_threshold": 7.2,
                "resupply_quantity": 8.2,
                "source_station_id": "Cape Town Staging Port",
                "delivery_vessel_id": "MV Vasily Golovnin",
                "target_eta": "14 Feb 2027",
                "priority": "HIGH",
                "status": "PLANNED",
                "is_ml_recommended": True,
                "ml_confidence": "HIGH",
                "recommendation_notes": "Life support water filtration modules for summer melt replenishment.",
                "created_at": now_str,
                "updated_at": now_str,
            },
            {
                "expedition_id": "EXP-2026-014",
                "inventory_id": rations_inv.id if rations_inv else None,
                "item_name": "Antarctic Overwinter Expedition Rations (Retort MRE Packets)",
                "category": "Provisions & Rations",
                "unit": "Meals",
                "current_stock": float(rations_inv.quantity) if rations_inv else 840.0,
                "minimum_stock": float(rations_inv.minimum_stock) if rations_inv else 1200.0,
                "predicted_demand": 1450.0,
                "safety_stock": 240.0,
                "reorder_threshold": 1440.0,
                "resupply_quantity": 2050.0,
                "source_station_id": "Cape Town Staging Port",
                "delivery_vessel_id": "MV Vasily Golovnin",
                "target_eta": "14 Feb 2027",
                "priority": "CRITICAL",
                "status": "SUGGESTED",
                "is_ml_recommended": True,
                "ml_confidence": "HIGH",
                "recommendation_notes": "Overwintering personnel calorie demand buffer for 58 campaign members.",
                "created_at": now_str,
                "updated_at": now_str,
            },
        ]
        for item_data in demo_items:
            db.add(ResupplyItem(**item_data))
        db.commit()


async def generate_ml_resupply_recommendations(
    db: Session,
    expedition: Expedition,
    payload: MLResupplyGenerateRequest,
) -> MLResupplyGenerateResponse:
    """
    Run ML inventory demand forecasting across station inventory items and generate
    decision-support SUGGESTED resupply line items.

    Safety guardrails:
    - Never modifies master Inventory.quantity
    - Never auto-approves or auto-creates purchase orders
    - Falls back gracefully to category baseline if ML service is unreachable
    """
    station_name = (payload.station_override or expedition.station or "Maitri").strip()

    # Calculate expedition duration in days
    duration_days = 140
    if payload.duration_days_override is not None and payload.duration_days_override > 0:
        duration_days = payload.duration_days_override
    elif expedition.start_date and expedition.end_date:
        delta = (expedition.end_date - expedition.start_date).days
        if delta > 0:
            duration_days = delta

    personnel_count = max(1, expedition.personnel_count or 25)
    lead_time = payload.lead_time_days if payload.lead_time_days is not None else 14

    # Select appropriate weather profile
    stn_key = "maitri"
    for k in STATION_WEATHER_PROFILES:
        if k in station_name.lower():
            stn_key = k
            break
    weather = STATION_WEATHER_PROFILES.get(stn_key, DEFAULT_WEATHER_PROFILE)

    # Query inventory items for station
    all_inventory = db.query(Inventory).all()
    target_inventory: list[Inventory] = []

    if payload.include_all_categories or "all" in station_name.lower():
        target_inventory = all_inventory
    else:
        # Filter matching station or unassigned
        for inv in all_inventory:
            loc = (inv.location or "").lower()
            if any(part.strip().lower() in loc for part in station_name.split("&")):
                target_inventory.append(inv)
        if not target_inventory:
            target_inventory = all_inventory

    ml_count = 0
    fallback_count = 0
    resupply_items_result: list[ResupplyItem] = []
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    for inv in target_inventory:
        curr_stock = float(inv.quantity or 0.0)
        min_stock = float(inv.minimum_stock or 0.0)
        norm_cat = (inv.category or "Provisions & Rations").strip().lower()

        # Compute historical transaction drawdowns for this item
        txns = db.query(InventoryTransaction).filter(
            InventoryTransaction.inventory_id == inv.id
        ).all()

        usage_history = 0.0
        lag_1 = 0.0
        lag_7 = 0.0
        avg_7 = 0.0
        avg_14 = 0.0

        if txns:
            negative_drawdowns = [abs(t.quantity) for t in txns if t.quantity < 0]
            if negative_drawdowns:
                usage_history = float(sum(negative_drawdowns))
                lag_1 = float(negative_drawdowns[-1])
                recent_7 = negative_drawdowns[-7:]
                lag_7 = float(recent_7[0])
                avg_7 = float(sum(recent_7) / len(recent_7))
                recent_14 = negative_drawdowns[-14:]
                avg_14 = float(sum(recent_14) / len(recent_14))

        forecast_payload = {
            "expedition_id": expedition.expedition_id,
            "item_id": f"INV-{inv.id}",
            "item_name": inv.item_name,
            "item_category": inv.category or "Provisions & Rations",
            "station": station_name,
            "personnel_count": personnel_count,
            "expedition_duration": duration_days,
            "opening_stock": curr_stock,
            "minimum_stock": min_stock,
            "lead_time": lead_time,
            "previous_expedition_consumption": usage_history,
            "inventory_usage_history": usage_history,
            "consumption_lag_1": lag_1,
            "consumption_lag_7": lag_7,
            "consumption_avg_7": avg_7,
            "consumption_avg_14": avg_14,
            "temperature_mean": weather["temperature_mean"],
            "temperature_min": weather["temperature_min"],
            "temperature_max": weather["temperature_max"],
            "pressure_mean": weather["pressure_mean"],
            "pressure_min": weather["pressure_min"],
            "pressure_max": weather["pressure_max"],
            "wind_speed_mean": weather["wind_speed_mean"],
            "wind_speed_max": weather["wind_speed_max"],
        }

        # Attempt prediction via ML service with graceful fallback
        predicted_demand = 0.0
        is_ml_rec = False
        ml_confidence = "LOW_BASELINE"
        rec_notes = ""

        try:
            prediction_response = await predict_inventory(forecast_payload)
            pred_data = prediction_response.get("data", prediction_response) if isinstance(prediction_response, dict) else {}

            predicted_demand = float(pred_data.get("predicted_requirement", 0.0))
            is_baseline = pred_data.get("prediction_source") == "CATEGORY_BASELINE" or pred_data.get("low_confidence") is True
            is_ml_rec = not is_baseline
            ml_confidence = "HIGH" if is_ml_rec else "LOW_BASELINE"
            rec_notes = pred_data.get("recommendation", "ML demand forecast recommendation.")

            if is_ml_rec:
                ml_count += 1
            else:
                fallback_count += 1
        except Exception as exc:
            # Fallback to category baseline rate
            fallback_count += 1
            baseline_mean = CATEGORY_BASELINES.get(norm_cat, GLOBAL_BASELINE)
            predicted_demand = round(baseline_mean * (personnel_count / 25.0) * (lead_time / 7.0), 2)
            is_ml_rec = False
            ml_confidence = "LOW_BASELINE"
            rec_notes = f"ML service offline ({str(exc)[:60]}); applied standard polar category baseline rate."

        # Apply deterministic safety stock and replenishment calculations
        safety_stock = calculate_safety_stock(min_stock)
        reorder_threshold = calculate_reorder_threshold(min_stock, safety_stock)
        projected_total_need = calculate_projected_total_need(predicted_demand, min_stock, safety_stock)
        recommended_resupply_qty = calculate_recommended_resupply_quantity(projected_total_need, curr_stock)
        priority = determine_priority(curr_stock, reorder_threshold, min_stock, recommended_resupply_qty)

        # Check if record already exists for this expedition and inventory item
        existing_resupply = db.query(ResupplyItem).filter(
            ResupplyItem.expedition_id == expedition.expedition_id,
            ResupplyItem.inventory_id == inv.id
        ).first()

        if existing_resupply:
            # Update metrics; preserve user-approved status if not SUGGESTED
            existing_resupply.current_stock = curr_stock
            existing_resupply.minimum_stock = min_stock
            existing_resupply.predicted_demand = predicted_demand
            existing_resupply.safety_stock = safety_stock
            existing_resupply.reorder_threshold = reorder_threshold
            existing_resupply.resupply_quantity = recommended_resupply_qty
            existing_resupply.priority = priority
            existing_resupply.is_ml_recommended = is_ml_rec
            existing_resupply.ml_confidence = ml_confidence
            existing_resupply.recommendation_notes = rec_notes
            existing_resupply.updated_at = now_str
            # If still SUGGESTED or PLANNED, update
            if existing_resupply.status not in ["APPROVED", "IN_TRANSIT", "DELIVERED"]:
                existing_resupply.status = "SUGGESTED"
            db.commit()
            db.refresh(existing_resupply)
            resupply_items_result.append(existing_resupply)
        else:
            new_resupply = ResupplyItem(
                expedition_id=expedition.expedition_id,
                inventory_id=inv.id,
                item_name=inv.item_name,
                category=inv.category or "Provisions & Rations",
                unit=inv.unit or "units",
                current_stock=curr_stock,
                minimum_stock=min_stock,
                predicted_demand=predicted_demand,
                safety_stock=safety_stock,
                reorder_threshold=reorder_threshold,
                resupply_quantity=recommended_resupply_qty,
                source_station_id="Cape Town Staging Depot",
                delivery_vessel_id=expedition.primary_vessel,
                target_eta=None,
                priority=priority,
                status="SUGGESTED",
                is_ml_recommended=is_ml_rec,
                ml_confidence=ml_confidence,
                recommendation_notes=rec_notes,
                created_at=now_str,
                updated_at=now_str,
            )
            db.add(new_resupply)
            db.commit()
            db.refresh(new_resupply)
            resupply_items_result.append(new_resupply)

    items_requiring_resupply = [item for item in resupply_items_result if float(item.resupply_quantity or 0) > 0]

    return MLResupplyGenerateResponse(
        expedition_id=expedition.expedition_id,
        expedition_name=expedition.name,
        station=station_name,
        total_inventory_items_evaluated=len(target_inventory),
        ml_recommendations_count=ml_count,
        fallback_recommendations_count=fallback_count,
        items_requiring_resupply_count=len(items_requiring_resupply),
        recommendations=[ResupplyItemResponse.model_validate(item) for item in resupply_items_result],
        execution_notes=f"Processed {len(target_inventory)} items ({ml_count} ML model predictions, {fallback_count} baseline fallbacks). All items marked SUGGESTED for human review."
    )
