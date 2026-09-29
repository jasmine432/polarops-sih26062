from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from ..models import Expedition, Inventory, ResupplyItem
from .expedition_planner_service import get_cargo_capacity_summary


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def simulate_mission(
    db: Session,
    expedition: Expedition,
    *,
    duration_days_override: int | None = None,
    cargo_capacity_override_kg: float | None = None,
    delayed_resupply_days: int = 0,
    initial_stock_reduction_pct: float = 0.0,
) -> dict[str, Any]:
    """
    Execute a read-only what-if mission simulation.

    IMPORTANT:
    - No database records are modified.
    - No database commit is performed.
    - Scenario values exist only in memory.
    - No inventory, cargo, resupply, or expedition status is changed.
    """

    # ------------------------------------------------------------------
    # 1. Normalize scenario inputs
    # ------------------------------------------------------------------

    duration_override = (
        max(1, int(duration_days_override))
        if duration_days_override is not None
        else None
    )

    capacity_override = (
        max(0.0, float(cargo_capacity_override_kg))
        if cargo_capacity_override_kg is not None
        else None
    )

    delay_days = max(0, int(delayed_resupply_days))

    stock_reduction_pct = _clamp(
        float(initial_stock_reduction_pct),
        0.0,
        100.0,
    )

    # ------------------------------------------------------------------
    # 2. Current mission duration
    # ------------------------------------------------------------------

    current_duration_days = 0

    if expedition.start_date and expedition.end_date:
        current_duration_days = max(
            0,
            (expedition.end_date - expedition.start_date).days,
        )

    simulated_duration_days = (
        duration_override
        if duration_override is not None
        else current_duration_days
    )

    # ------------------------------------------------------------------
    # 3. Current cargo/load state
    # ------------------------------------------------------------------

    capacity_summary = get_cargo_capacity_summary(db, expedition)

    current_capacity_kg = float(
        capacity_summary.get("maximum_capacity_kg", 0.0)
    )

    current_planned_load_kg = float(
        capacity_summary.get("total_planned_weight_kg", 0.0)
    )

    simulated_capacity_kg = (
        capacity_override
        if capacity_override is not None
        else current_capacity_kg
    )

    simulated_capacity_kg = max(simulated_capacity_kg, 0.0)

    if simulated_capacity_kg > 0:
        simulated_utilization_pct = round(
            (
                current_planned_load_kg
                / simulated_capacity_kg
            )
            * 100.0,
            2,
        )
    else:
        simulated_utilization_pct = (
            100.0 if current_planned_load_kg > 0 else 0.0
        )

    simulated_remaining_capacity_kg = round(
        max(
            0.0,
            simulated_capacity_kg - current_planned_load_kg,
        ),
        2,
    )

    capacity_overage_kg = round(
        max(
            0.0,
            current_planned_load_kg - simulated_capacity_kg,
        ),
        2,
    )

    # ------------------------------------------------------------------
    # 4. Expedition-relevant inventory
    # ------------------------------------------------------------------

    inventory_query = db.query(Inventory)

    if expedition.station:
        station_keywords = [
            item.strip()
            for item in expedition.station.split("&")
            if item.strip()
        ]

        if station_keywords:
            station_filters = [
                Inventory.location.ilike(f"%{keyword}%")
                for keyword in station_keywords
            ]

            from sqlalchemy import or_

            inventory_query = inventory_query.filter(
                or_(*station_filters)
            )

    inventories = inventory_query.all()

    # If no station-specific inventory exists, fall back to all inventory.
    if not inventories:
        inventories = db.query(Inventory).all()

    inventory_results: list[dict[str, Any]] = []
    inventory_risks = 0

    for inv in inventories:
        current_stock = float(inv.quantity or 0.0)
        minimum_stock = float(inv.minimum_stock or 0.0)

        simulated_stock = round(
            current_stock
            * (1.0 - stock_reduction_pct / 100.0),
            2,
        )

        shortage = simulated_stock < minimum_stock

        if shortage:
            inventory_risks += 1

        inventory_results.append(
            {
                "inventory_id": inv.id,
                "item_name": inv.item_name,
                "category": inv.category,
                "location": inv.location,
                "unit": inv.unit,
                "current_stock": round(current_stock, 2),
                "simulated_stock": simulated_stock,
                "minimum_stock": round(minimum_stock, 2),
                "shortage": shortage,
                "stock_reduction_pct": stock_reduction_pct,
            }
        )

    # ------------------------------------------------------------------
    # 5. Resupply delay scenario
    # ------------------------------------------------------------------

    resupply_items = (
        db.query(ResupplyItem)
        .filter(
            ResupplyItem.expedition_id
            == expedition.expedition_id
        )
        .all()
    )

    delayed_items: list[dict[str, Any]] = []

    for item in resupply_items:
        if (
            delay_days > 0
            and item.status in {"APPROVED", "IN_TRANSIT"}
            and float(item.resupply_quantity or 0.0) > 0
        ):
            delayed_items.append(
                {
                    "resupply_item_id": item.id,
                    "item_name": item.item_name,
                    "status": item.status,
                    "resupply_quantity": round(
                        float(item.resupply_quantity or 0.0),
                        2,
                    ),
                    "original_eta": item.target_eta,
                    "simulated_delay_days": delay_days,
                }
            )

    # ------------------------------------------------------------------
    # 6. Scenario blockers
    # ------------------------------------------------------------------

    readiness_blockers: list[str] = []

    if capacity_overage_kg > 0:
        readiness_blockers.append(
            "Simulated cargo capacity exceeded by "
            f"{capacity_overage_kg:.1f} kg."
        )

    if inventory_risks > 0:
        readiness_blockers.append(
            f"{inventory_risks} inventory item(s) fall below "
            "minimum stock under the simulated scenario."
        )

    if delayed_items:
        readiness_blockers.append(
            f"{len(delayed_items)} approved/in-transit "
            "resupply item(s) would be delayed by "
            f"{delay_days} day(s)."
        )

    simulated_status = (
        "NOT_READY"
        if readiness_blockers
        else "READY"
    )

    # ------------------------------------------------------------------
    # 7. Human-readable impact summary
    # ------------------------------------------------------------------

    impact_flags: list[str] = []

    if duration_override is not None:
        duration_delta = (
            simulated_duration_days
            - current_duration_days
        )

        if duration_delta > 0:
            impact_flags.append(
                f"Mission duration increases by "
                f"{duration_delta} day(s)."
            )
        elif duration_delta < 0:
            impact_flags.append(
                f"Mission duration decreases by "
                f"{abs(duration_delta)} day(s)."
            )
        else:
            impact_flags.append(
                "Mission duration remains unchanged."
            )

    if capacity_override is not None:
        impact_flags.append(
            "Simulated cargo capacity: "
            f"{simulated_capacity_kg:.1f} kg."
        )

    if stock_reduction_pct > 0:
        impact_flags.append(
            "Inventory stock reduced by "
            f"{stock_reduction_pct:.1f}%."
        )

    if delay_days > 0:
        impact_flags.append(
            "Resupply delivery delayed by "
            f"{delay_days} day(s)."
        )

    if not impact_flags:
        impact_flags.append(
            "No scenario changes supplied; "
            "simulation reflects the current state."
        )

    # ------------------------------------------------------------------
    # 8. Return simulation result
    # ------------------------------------------------------------------

    return {
        "expedition_id": expedition.expedition_id,
        "expedition_name": expedition.name,
        "simulation_only": True,
        "database_mutated": False,

        "scenario": {
            "duration_days_override": duration_override,
            "cargo_capacity_override_kg": capacity_override,
            "delayed_resupply_days": delay_days,
            "initial_stock_reduction_pct": stock_reduction_pct,
        },

        "current_state": {
            "duration_days": current_duration_days,
            "cargo_capacity_kg": round(
                current_capacity_kg,
                2,
            ),
            "planned_load_kg": round(
                current_planned_load_kg,
                2,
            ),
        },

        "simulated_state": {
            "duration_days": simulated_duration_days,
            "cargo_capacity_kg": round(
                simulated_capacity_kg,
                2,
            ),
            "planned_load_kg": round(
                current_planned_load_kg,
                2,
            ),
            "capacity_utilization_pct": (
                simulated_utilization_pct
            ),
            "remaining_capacity_kg": (
                simulated_remaining_capacity_kg
            ),
            "over_capacity_kg": capacity_overage_kg,
            "inventory_risk_count": inventory_risks,
            "delayed_resupply_count": len(
                delayed_items
            ),
            "readiness_status": simulated_status,
        },

        "inventory": inventory_results,

        "delayed_resupply": delayed_items,

        "blockers": readiness_blockers,

        "impact_summary": impact_flags,
    }