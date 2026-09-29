"""Expedition Planner & Mission Lifecycle Service.

This service implements the business logic, database operations, and data
aggregations for the Expedition Planner module.
"""

from datetime import datetime, date, timezone
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import (
    Expedition,
    ExpeditionPlan,
    PackingItem,
    CargoCapacityPlan,
    Personnel,
    Cargo,
    Inventory,
    Vessel,
    Station,
    EmergencyIncident,
    Alert,
)
from ..schemas import (
    ExpeditionPlanCreate,
    ExpeditionPlanUpdate,
    ExpeditionPlanStatusUpdate,
    PackingItemCreate,
    PackingItemUpdate,
    CargoCapacityPlanCreateOrUpdate,
)

VALID_PLANNING_STATUSES = [
    "PLANNING",
    "READY_FOR_REVIEW",
    "READY",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
]

INITIAL_SEED_PLANS = [
    {
        "expedition_id": "EXP-2026-014",
        "planning_status": "ACTIVE",
        "mission_objective": "Execute ice-core deep drilling at Dronning Maud Land, atmospheric physics lidar calibration, and Maitri II replacement station site preparatory surveys.",
        "planned_start": date(2026, 11, 20),
        "planned_end": date(2027, 4, 10),
        "station": "Maitri & Bharati",
        "vessel": "MV Vasily Golovnin (Chartered Polar Vessel)",
        "lead_planner": "Dr. Rajesh Sharma (NCPOR)",
        "planning_notes": "Primary 2026-2027 Antarctic campaign executing ice-core deep drilling and station upgrades.",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-19 12:00:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-015",
        "planning_status": "ACTIVE",
        "mission_objective": "Ny-Alesund fjord hydrography, Svalbard atmospheric trace gas monitoring, Kongsfjorden marine sediment core analysis during autumn sea-ice formation onset.",
        "planned_start": date(2026, 9, 1),
        "planned_end": date(2026, 10, 30),
        "station": "Himadri (Arctic)",
        "vessel": "RV Lance (Norwegian Polar Institute Charter)",
        "lead_planner": "Dr. K. S. Murthy",
        "planning_notes": "Ny-Alesund fjord hydrography and Svalbard atmospheric trace gas monitoring.",
        "created_at": "2026-08-15 00:00:00 UTC",
        "updated_at": "2026-09-15 08:30:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-016",
        "planning_status": "PLANNING",
        "mission_objective": "Multibeam bathymetric mapping and piston coring across the Polar Frontal Zone and Sub-Antarctic Front in the Indian sector of the Southern Ocean.",
        "planned_start": date(2026, 12, 5),
        "planned_end": date(2027, 2, 28),
        "station": "ORV Sagar Nidhi Hold",
        "vessel": "ORV Sagar Nidhi (MoES Oceanographic Research Vessel)",
        "lead_planner": "Dr. Priya Nair",
        "planning_notes": "Pelagic summer marine campaign awaiting final port clearance.",
        "created_at": "2026-09-10 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
]


def parse_date(val: Any) -> date | None:
    """Parses date string or date object into a python date, validating format."""
    if val is None or val == "":
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        clean_str = val.strip().split(" ")[0].split("T")[0]
        try:
            return datetime.strptime(clean_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format: '{val}'. Expected format is YYYY-MM-DD.",
            )
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Invalid date type '{type(val)}'. Expected date string (YYYY-MM-DD).",
    )


def find_expedition_or_404(db: Session, expedition_id: str) -> Expedition:
    """Finds an Expedition by expedition_id or numeric ID, raising 404 if not found."""
    clean_id = expedition_id.strip()
    exp = db.query(Expedition).filter(
        (Expedition.expedition_id.ilike(clean_id))
        | (Expedition.expedition_id.ilike(clean_id.replace("-", "")))
    ).first()

    if not exp and clean_id.isdigit():
        exp = db.query(Expedition).filter(Expedition.id == int(clean_id)).first()

    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expedition '{expedition_id}' not found in database.",
        )
    return exp


def seed_initial_plans_if_empty(db: Session) -> None:
    """Seeds initial planning records for default expeditions if table is empty."""
    count = db.query(ExpeditionPlan).count()
    if count == 0:
        for seed_data in INITIAL_SEED_PLANS:
            # Check if referenced expedition exists
            exp_exists = db.query(Expedition).filter(
                Expedition.expedition_id == seed_data["expedition_id"]
            ).first()
            if exp_exists:
                db.add(ExpeditionPlan(**seed_data))
        db.commit()


def get_or_create_default_plan(db: Session, exp: Expedition) -> ExpeditionPlan:
    """Retrieves existing plan or synthesizes and saves a default plan for an expedition."""
    plan = db.query(ExpeditionPlan).filter(
        ExpeditionPlan.expedition_id == exp.expedition_id
    ).first()
    if plan:
        return plan

    # Check if this matches a predefined seed plan
    for seed in INITIAL_SEED_PLANS:
        if seed["expedition_id"].lower() == exp.expedition_id.lower():
            plan = ExpeditionPlan(**seed)
            db.add(plan)
            db.commit()
            db.refresh(plan)
            return plan

    # Synthesize default plan from expedition properties
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    status_map = {
        "Active": "ACTIVE",
        "Concluded": "COMPLETED",
        "Planning": "PLANNING",
        "On Hold": "PLANNING",
        "Returning": "ACTIVE",
    }
    default_plan = ExpeditionPlan(
        expedition_id=exp.expedition_id,
        planning_status=status_map.get(exp.status, "PLANNING"),
        mission_objective=exp.mandate or exp.notes or f"Operational campaign for {exp.name}",
        planned_start=exp.start_date,
        planned_end=exp.end_date,
        station=exp.station,
        vessel=exp.primary_vessel or "Unassigned",
        lead_planner=exp.lead or "NCPOR Mission Command",
        planning_notes=exp.notes or "Initial expedition plan generated from registered campaign mandate.",
        created_at=now_str,
        updated_at=now_str,
    )
    db.add(default_plan)
    db.commit()
    db.refresh(default_plan)
    return default_plan


def create_or_update_plan(
    db: Session,
    exp: Expedition,
    payload: ExpeditionPlanCreate | ExpeditionPlanUpdate,
) -> ExpeditionPlan:
    """Creates a new plan or updates existing planning information for an expedition."""
    plan = db.query(ExpeditionPlan).filter(
        ExpeditionPlan.expedition_id == exp.expedition_id
    ).first()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    planning_status = None
    if payload.planning_status:
        clean_status = str(payload.planning_status).strip().upper()
        if clean_status not in VALID_PLANNING_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid planning status '{payload.planning_status}'. Allowed statuses: {', '.join(VALID_PLANNING_STATUSES)}",
            )
        planning_status = clean_status

    planned_start = None
    if payload.planned_start is not None:
        planned_start = parse_date(payload.planned_start)

    planned_end = None
    if payload.planned_end is not None:
        planned_end = parse_date(payload.planned_end)

    effective_start = planned_start if planned_start is not None else (plan.planned_start if plan else exp.start_date)
    effective_end = planned_end if planned_end is not None else (plan.planned_end if plan else exp.end_date)

    if effective_start and effective_end and effective_end < effective_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Planned end date cannot be prior to planned start date.",
        )

    if not plan:
        plan = ExpeditionPlan(
            expedition_id=exp.expedition_id,
            planning_status=planning_status or "PLANNING",
            mission_objective=payload.mission_objective or exp.mandate or exp.notes,
            planned_start=effective_start,
            planned_end=effective_end,
            station=payload.station.strip() if payload.station else exp.station,
            vessel=payload.vessel.strip() if payload.vessel else exp.primary_vessel,
            lead_planner=payload.lead_planner.strip() if payload.lead_planner else exp.lead,
            planning_notes=payload.planning_notes.strip() if payload.planning_notes else exp.notes,
            created_at=now_str,
            updated_at=now_str,
        )
        db.add(plan)
    else:
        if planning_status is not None:
            plan.planning_status = planning_status
        if payload.mission_objective is not None:
            plan.mission_objective = payload.mission_objective.strip() if payload.mission_objective else None
        if payload.planned_start is not None:
            plan.planned_start = planned_start
        if payload.planned_end is not None:
            plan.planned_end = planned_end
        if payload.station is not None:
            plan.station = payload.station.strip()
        if payload.vessel is not None:
            plan.vessel = payload.vessel.strip()
        if payload.lead_planner is not None:
            plan.lead_planner = payload.lead_planner.strip()
        if payload.planning_notes is not None:
            plan.planning_notes = payload.planning_notes.strip()
        plan.updated_at = now_str

    # Sync corresponding expedition status
    if plan.planning_status == "ACTIVE" and exp.status != "Active":
        exp.status = "Active"
    elif plan.planning_status == "COMPLETED" and exp.status != "Concluded":
        exp.status = "Concluded"

    db.commit()
    db.refresh(plan)
    return plan


def update_plan_status(
    db: Session,
    exp: Expedition,
    payload: ExpeditionPlanStatusUpdate,
) -> ExpeditionPlan:
    """Updates only the planning status and optional notes for an expedition plan."""
    clean_status = str(payload.planning_status).strip().upper()
    if clean_status not in VALID_PLANNING_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid planning status '{payload.planning_status}'. Allowed statuses: {', '.join(VALID_PLANNING_STATUSES)}",
        )

    plan = get_or_create_default_plan(db, exp)
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    plan.planning_status = clean_status
    if payload.planning_notes is not None:
        plan.planning_notes = payload.planning_notes.strip()
    plan.updated_at = now_str

    # Sync expedition status
    if clean_status == "ACTIVE" and exp.status != "Active":
        exp.status = "Active"
    elif clean_status == "COMPLETED" and exp.status != "Concluded":
        exp.status = "Concluded"

    db.commit()
    db.refresh(plan)
    return plan


def get_planning_summary(db: Session, exp: Expedition) -> dict[str, Any]:
    """Aggregates all existing operational data into a unified planning summary."""
    plan = get_or_create_default_plan(db, exp)

    effective_start = plan.planned_start or exp.start_date
    effective_end = plan.planned_end or exp.end_date
    duration_days = None
    if effective_start and effective_end:
        duration_days = max(0, (effective_end - effective_start).days)

    # 1. Assigned Personnel
    personnel_list = db.query(Personnel).filter(
        (Personnel.expedition_id.ilike(exp.expedition_id))
        | (Personnel.expedition_id.ilike(exp.expedition_id.replace("-", "")))
    ).all()

    total_assigned_personnel = len(personnel_list) if personnel_list else (exp.personnel_count or 0)
    medically_cleared_count = sum(
        1 for p in personnel_list
        if p.medical_clearance and any(
            k in p.medical_clearance.lower() for k in ["valid", "certified", "fit", "shape-1", "class-1"]
        )
    ) if personnel_list else total_assigned_personnel

    survival_trained_count = sum(
        1 for p in personnel_list
        if p.survival_training and any(
            k in p.survival_training.lower() for k in ["valid", "certified", "master", "qualified", "fellow"]
        )
    ) if personnel_list else total_assigned_personnel

    roles = list({p.role for p in personnel_list if p.role}) if personnel_list else ([exp.lead_role] if exp.lead_role else [])
    lead_officer = exp.lead or (personnel_list[0].name if personnel_list else None)

    # 2. Cargo aggregation
    cargo_list = []
    if exp.station:
        station_keywords = [s.strip() for s in exp.station.split("&")]
        for kw in station_keywords:
            items = db.query(Cargo).filter(Cargo.destination.ilike(f"%{kw}%")).all()
            for item in items:
                if item not in cargo_list:
                    cargo_list.append(item)

    cargo_count = len(cargo_list) if cargo_list else (exp.cargo_count or 0)
    total_weight_mt = 0.0
    for c in cargo_list:
        if c.weight is not None:
            unit = (c.weight_unit or "MT").upper()
            if unit == "MT":
                total_weight_mt += float(c.weight)
            elif unit == "KG":
                total_weight_mt += float(c.weight) / 1000.0

    critical_cargo_count = sum(1 for c in cargo_list if c.priority == "Critical")
    cargo_categories = list({c.category for c in cargo_list if c.category})

    # 3. Vessel assignment
    vessel_assignment_data = None
    vessel_candidates = db.query(Vessel).filter(
        (Vessel.expedition_id.ilike(exp.expedition_id))
        | (Vessel.expedition_id.ilike(exp.expedition_id.replace("-", "")))
    ).all()
    if not vessel_candidates and (plan.vessel or exp.primary_vessel):
        v_name = (plan.vessel or exp.primary_vessel).split("(")[0].strip()
        vessel_candidates = db.query(Vessel).filter(Vessel.name.ilike(f"%{v_name}%")).all()

    if vessel_candidates:
        v = vessel_candidates[0]
        vessel_assignment_data = {
            "vessel_id": v.vessel_id,
            "name": v.name,
            "vessel_type": v.vessel_type,
            "status": v.status,
            "ice_class": v.ice_class,
            "eta": v.eta,
            "origin": v.origin,
            "destination": v.destination,
            "weather_status": v.weather_status,
            "speed_knots": float(v.speed_knots) if v.speed_knots is not None else None,
            "coordinates": f"{v.latitude}, {v.longitude}" if v.latitude is not None and v.longitude is not None else None,
        }

    # 4. Station details
    station_details_data = None
    station_records = db.query(Station).all()
    for st in station_records:
        if st.station_id.lower() in exp.station.lower() or st.name.lower() in exp.station.lower():
            station_details_data = {
                "station_id": st.station_id,
                "name": st.name,
                "location": st.location,
                "coordinates": st.coordinates,
                "status": st.status,
                "capacity": st.capacity,
                "current_occupancy": st.current_occupancy,
                "station_type": st.station_type,
                "sensor_id": st.sensor_id,
            }
            break

    # 5. Inventory at station
    inventory_items = []
    if exp.station:
        station_keywords = [s.strip() for s in exp.station.split("&")]
        for kw in station_keywords:
            invs = db.query(Inventory).filter(Inventory.location.ilike(f"%{kw}%")).all()
            for inv in invs:
                if inv not in inventory_items:
                    inventory_items.append(inv)

    if not inventory_items:
        inventory_items = db.query(Inventory).all()

    total_inventory_items = len(inventory_items)
    low_stock_items_count = sum(
        1 for inv in inventory_items if (inv.quantity or 0) <= (inv.minimum_stock or 0)
    )

    # 6. Active and Critical Alerts
    all_alerts = db.query(Alert).filter(Alert.status != "Resolved").all()
    active_alerts = []
    for alert in all_alerts:
        alert_text = f"{alert.message or ''} {alert.detail or ''} {alert.related_entity or ''}".lower()
        if exp.expedition_id.lower() in alert_text or (
            exp.station and any(kw.lower() in alert_text for kw in [s.strip() for s in exp.station.split("&")])
        ):
            active_alerts.append(alert)

    active_alerts_count = len(active_alerts)
    critical_alerts_count = sum(1 for a in active_alerts if a.severity == "Critical")

    # 7. Unresolved Emergency Incidents
    incidents = db.query(EmergencyIncident).filter(
        (EmergencyIncident.expedition_id.ilike(exp.expedition_id))
        | (EmergencyIncident.expedition_id.ilike(exp.expedition_id.replace("-", "")))
        | (EmergencyIncident.station_id.ilike(f"%{exp.station}%"))
    ).filter(
        EmergencyIncident.status.notin_(["Resolved", "Closed"])
    ).all()
    emergency_incident_count = len(incidents)

    # 8. Readiness calculation
    personnel_ready = (medically_cleared_count >= total_assigned_personnel) if total_assigned_personnel > 0 else True
    vessel_ready = (vessel_assignment_data is not None and vessel_assignment_data["weather_status"] != "DANGER") if vessel_assignment_data else True
    station_ready = (station_details_data is not None and station_details_data["status"] == "Operational") if station_details_data else True
    no_critical_alerts = (critical_alerts_count == 0 and emergency_incident_count == 0)

    readiness_score = 100
    if not personnel_ready:
        readiness_score -= 20
    if not station_ready:
        readiness_score -= 25
    if not vessel_ready:
        readiness_score -= 20
    if critical_alerts_count > 0:
        readiness_score -= min(30, critical_alerts_count * 15)
    if emergency_incident_count > 0:
        readiness_score -= min(40, emergency_incident_count * 20)
    readiness_score = max(0, min(100, readiness_score))

    readiness_status = "READY"
    if plan.planning_status == "ACTIVE":
        readiness_status = "OPERATIONAL"
    elif emergency_incident_count > 0 or critical_alerts_count > 0:
        readiness_status = "BLOCKED"
    elif readiness_score < 80:
        readiness_status = "PENDING_CHECKS"

    return {
        "expedition_id": exp.expedition_id,
        "expedition_name": exp.name,
        "expedition_status": exp.status,
        "planning_status": plan.planning_status,
        "season": exp.season,
        "station": exp.station,
        "start_date": exp.start_date,
        "end_date": exp.end_date,
        "planned_start": effective_start,
        "planned_end": effective_end,
        "duration_days": duration_days,
        "lead": exp.lead,
        "lead_role": exp.lead_role,
        "lead_org": exp.lead_org,
        "mandate": exp.mandate,
        "primary_vessel": exp.primary_vessel,
        "air_support": exp.air_support,
        "comms_link": exp.comms_link,
        "mission_objective": plan.mission_objective,
        "planning_notes": plan.planning_notes,
        "personnel": {
            "total_assigned": total_assigned_personnel,
            "medically_cleared_count": medically_cleared_count,
            "survival_trained_count": survival_trained_count,
            "roles": roles,
            "lead_officer": lead_officer,
        },
        "cargo": {
            "total_count": cargo_count,
            "total_weight_mt": round(total_weight_mt, 2),
            "critical_cargo_count": critical_cargo_count,
            "categories": cargo_categories,
        },
        "inventory": {
            "total_items_tracked": total_inventory_items,
            "low_stock_items_count": low_stock_items_count,
            "station_monitored": exp.station,
        },
        "vessel_assignment": vessel_assignment_data,
        "station_details": station_details_data,
        "active_alerts_count": active_alerts_count,
        "critical_alerts_count": critical_alerts_count,
        "emergency_incident_count": emergency_incident_count,
        "readiness": {
            "personnel_ready": personnel_ready,
            "vessel_ready": vessel_ready,
            "station_ready": station_ready,
            "no_critical_alerts": no_critical_alerts,
            "readiness_score": readiness_score,
            "readiness_status": readiness_status,
            "indicators": {
                "medical_clearance_rate": f"{medically_cleared_count}/{total_assigned_personnel}" if total_assigned_personnel > 0 else "N/A",
                "survival_training_rate": f"{survival_trained_count}/{total_assigned_personnel}" if total_assigned_personnel > 0 else "N/A",
                "station_status": station_details_data["status"] if station_details_data else "Unknown",
                "vessel_operational": vessel_ready,
                "unresolved_emergencies": emergency_incident_count,
                "active_critical_alerts": critical_alerts_count,
            },
        },
    }


# ==============================================================================
# Phase 2: Individual Packing, Team Load & Cargo Capacity Functions
# ==============================================================================

VALID_PACKING_PRIORITIES = ["CRITICAL", "HIGH", "NORMAL"]
VALID_PACKING_STATUSES = ["PLANNED", "PACKED", "INSPECTED", "LOADED"]

INITIAL_SEED_PACKING_ITEMS = [
    # EXP-2026-014 - Dr. Alok Verma
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4401",
        "personnel_name": "Dr. Alok Verma",
        "personnel_role": "Expedition Leader / Senior Glaciologist",
        "item_name": "Extreme Cold Weather Polar Parka & Salopettes",
        "category": "Protective Clothing",
        "quantity": 2,
        "unit": "sets",
        "unit_weight_kg": 2.4,
        "total_weight_kg": 4.8,
        "priority": "HIGH",
        "source_reason": "Mandatory Antarctic field survival equipment",
        "status": "PACKED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4401",
        "personnel_name": "Dr. Alok Verma",
        "personnel_role": "Expedition Leader / Senior Glaciologist",
        "item_name": "Polar Ice Core Sampling Auger & Core Tubes",
        "category": "Scientific Instrumentation",
        "quantity": 1,
        "unit": "kit",
        "unit_weight_kg": 5.5,
        "total_weight_kg": 5.5,
        "priority": "CRITICAL",
        "source_reason": "Dronning Maud Land deep ice-core paleoclimate mission",
        "status": "INSPECTED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4401",
        "personnel_name": "Dr. Alok Verma",
        "personnel_role": "Expedition Leader / Senior Glaciologist",
        "item_name": "Differential GPS Cryo-Survey Field Station",
        "category": "Field Navigation",
        "quantity": 1,
        "unit": "unit",
        "unit_weight_kg": 3.2,
        "total_weight_kg": 3.2,
        "priority": "HIGH",
        "source_reason": "Maitri II replacement site survey mapping",
        "status": "PLANNED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4401",
        "personnel_name": "Dr. Alok Verma",
        "personnel_role": "Expedition Leader / Senior Glaciologist",
        "item_name": "Personal Hypothermia Trauma Kit & O2 Canister",
        "category": "Medical Supplies",
        "quantity": 1,
        "unit": "kit",
        "unit_weight_kg": 1.2,
        "total_weight_kg": 1.2,
        "priority": "CRITICAL",
        "source_reason": "Class-1 Polar survival requirement",
        "status": "PACKED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    # EXP-2026-014 - Lt. Col. Vikramaditya Singh
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4404",
        "personnel_name": "Lt. Col. Vikramaditya Singh",
        "personnel_role": "Operations & Logistics Commander",
        "item_name": "Satellite Emergency Comms Terminal & LiFePO4 Battery",
        "category": "Communications",
        "quantity": 1,
        "unit": "unit",
        "unit_weight_kg": 4.5,
        "total_weight_kg": 4.5,
        "priority": "CRITICAL",
        "source_reason": "Primary overland traverse emergency communications link",
        "status": "INSPECTED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4404",
        "personnel_name": "Lt. Col. Vikramaditya Singh",
        "personnel_role": "Operations & Logistics Commander",
        "item_name": "Avalanche Search Beacon & Carbon Fiber Probe",
        "category": "Survival Equipment",
        "quantity": 1,
        "unit": "set",
        "unit_weight_kg": 0.9,
        "total_weight_kg": 0.9,
        "priority": "CRITICAL",
        "source_reason": "Glacial crevasse safety requirement",
        "status": "PACKED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4404",
        "personnel_name": "Lt. Col. Vikramaditya Singh",
        "personnel_role": "Operations & Logistics Commander",
        "item_name": "Heavy Vehicle Towing Rig & Synthetic Snatch Straps",
        "category": "Field Gear",
        "quantity": 1,
        "unit": "rig",
        "unit_weight_kg": 6.8,
        "total_weight_kg": 6.8,
        "priority": "HIGH",
        "source_reason": "Kässbohrer PistenBully traverse logistics",
        "status": "PLANNED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    # EXP-2026-014 - Dr. Sunita Deshmukh
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4409",
        "personnel_name": "Dr. Sunita Deshmukh",
        "personnel_role": "Medical Officer / Hyperbaric Specialist",
        "item_name": "Field Surgical & Cold Trauma Emergency Bag",
        "category": "Medical Supplies",
        "quantity": 1,
        "unit": "bag",
        "unit_weight_kg": 7.4,
        "total_weight_kg": 7.4,
        "priority": "CRITICAL",
        "source_reason": "Station field deployment medical officer requirement",
        "status": "INSPECTED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4409",
        "personnel_name": "Dr. Sunita Deshmukh",
        "personnel_role": "Medical Officer / Hyperbaric Specialist",
        "item_name": "Portable Automated External Defibrillator (AED Polar)",
        "category": "Medical Supplies",
        "quantity": 1,
        "unit": "unit",
        "unit_weight_kg": 2.1,
        "total_weight_kg": 2.1,
        "priority": "CRITICAL",
        "source_reason": "Mission-critical life support",
        "status": "PACKED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    # EXP-2026-014 - Er. Rajesh K. Nair
    {
        "expedition_id": "EXP-2026-014",
        "personnel_id": "NCPOR-P-4414",
        "personnel_name": "Er. Rajesh K. Nair",
        "personnel_role": "Chief Generator & Heavy Machinery Engineer",
        "item_name": "Arctic Generator Diagnostic Kit & Calibration Tools",
        "category": "Machinery Spares",
        "quantity": 1,
        "unit": "kit",
        "unit_weight_kg": 8.5,
        "total_weight_kg": 8.5,
        "priority": "HIGH",
        "source_reason": "Powerhouse turbine maintenance and wintering overhaul",
        "status": "PACKED",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
]

INITIAL_SEED_CAPACITIES = [
    {
        "expedition_id": "EXP-2026-014",
        "max_capacity_kg": 2500.0,
        "allocated_cargo_kg": 420.0,
        "notes": "Basler BT-67 Air Bridge & PistenBully 300 Polar Traverse payload ceiling",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-015",
        "max_capacity_kg": 1200.0,
        "allocated_cargo_kg": 150.0,
        "notes": "Dornier 228 Longyearbyen payload limit",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
    {
        "expedition_id": "EXP-2026-016",
        "max_capacity_kg": 3000.0,
        "allocated_cargo_kg": 600.0,
        "notes": "ORV Sagar Nidhi science hold payload quota",
        "created_at": "2026-09-01 00:00:00 UTC",
        "updated_at": "2026-09-18 10:00:00 UTC",
    },
]


def seed_initial_packing_if_empty(db: Session) -> None:
    """Seeds initial packing items and cargo capacity plans if empty."""
    # Seed capacity plans
    cap_count = db.query(CargoCapacityPlan).count()
    if cap_count == 0:
        for seed_data in INITIAL_SEED_CAPACITIES:
            exp_exists = db.query(Expedition).filter(
                Expedition.expedition_id == seed_data["expedition_id"]
            ).first()
            if exp_exists:
                db.add(CargoCapacityPlan(**seed_data))
        db.commit()

    # Seed packing items
    item_count = db.query(PackingItem).count()
    if item_count == 0:
        for item_data in INITIAL_SEED_PACKING_ITEMS:
            exp_exists = db.query(Expedition).filter(
                Expedition.expedition_id == item_data["expedition_id"]
            ).first()
            if exp_exists:
                db.add(PackingItem(**item_data))
        db.commit()


def find_packing_item_or_404(db: Session, expedition_id: str, item_id: int) -> PackingItem:
    """Finds a packing item by ID and expedition_id, or raises 404."""
    item = db.query(PackingItem).filter(
        PackingItem.id == item_id,
        (PackingItem.expedition_id.ilike(expedition_id))
        | (PackingItem.expedition_id.ilike(expedition_id.replace("-", "")))
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Packing item #{item_id} not found for expedition '{expedition_id}'.",
        )
    return item


def get_or_create_capacity_plan(db: Session, exp: Expedition) -> CargoCapacityPlan:
    """Retrieves or creates default cargo capacity plan for an expedition."""
    plan = db.query(CargoCapacityPlan).filter(
        CargoCapacityPlan.expedition_id == exp.expedition_id
    ).first()
    if plan:
        return plan

    # Check seed match
    for seed in INITIAL_SEED_CAPACITIES:
        if seed["expedition_id"].lower() == exp.expedition_id.lower():
            plan = CargoCapacityPlan(**seed)
            db.add(plan)
            db.commit()
            db.refresh(plan)
            return plan

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    default_plan = CargoCapacityPlan(
        expedition_id=exp.expedition_id,
        max_capacity_kg=2000.0,
        allocated_cargo_kg=0.0,
        notes=f"Default payload capacity allocated for {exp.name}",
        created_at=now_str,
        updated_at=now_str,
    )
    db.add(default_plan)
    db.commit()
    db.refresh(default_plan)
    return default_plan


def create_or_update_capacity_plan(
    db: Session,
    exp: Expedition,
    payload: CargoCapacityPlanCreateOrUpdate,
) -> CargoCapacityPlan:
    """Creates or updates the cargo capacity plan for an expedition."""
    if payload.max_capacity_kg <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum cargo capacity must be greater than 0 kg.",
        )
    if payload.allocated_cargo_kg is not None and payload.allocated_cargo_kg < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Allocated cargo weight cannot be negative.",
        )

    plan = db.query(CargoCapacityPlan).filter(
        CargoCapacityPlan.expedition_id == exp.expedition_id
    ).first()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    if not plan:
        plan = CargoCapacityPlan(
            expedition_id=exp.expedition_id,
            max_capacity_kg=round(float(payload.max_capacity_kg), 2),
            allocated_cargo_kg=round(float(payload.allocated_cargo_kg or 0.0), 2),
            notes=payload.notes.strip() if payload.notes else None,
            created_at=now_str,
            updated_at=now_str,
        )
        db.add(plan)
    else:
        plan.max_capacity_kg = round(float(payload.max_capacity_kg), 2)
        if payload.allocated_cargo_kg is not None:
            plan.allocated_cargo_kg = round(float(payload.allocated_cargo_kg), 2)
        if payload.notes is not None:
            plan.notes = payload.notes.strip() if payload.notes else None
        plan.updated_at = now_str

    db.commit()
    db.refresh(plan)
    return plan


def create_packing_item(
    db: Session,
    exp: Expedition,
    payload: PackingItemCreate,
) -> PackingItem:
    """Creates a new packing item for a specific person in an expedition."""
    if payload.quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity cannot be negative.",
        )
    if payload.unit_weight_kg < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unit weight cannot be negative.",
        )

    clean_item_name = payload.item_name.strip()
    if not clean_item_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item name is required.",
        )

    clean_priority = str(payload.priority or "NORMAL").strip().upper()
    if clean_priority not in VALID_PACKING_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority '{payload.priority}'. Allowed: {', '.join(VALID_PACKING_PRIORITIES)}",
        )

    clean_status = str(payload.status or "PLANNED").strip().upper()
    if clean_status not in VALID_PACKING_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Allowed: {', '.join(VALID_PACKING_STATUSES)}",
        )

    clean_pid = payload.personnel_id.strip()
    # Validate personnel exists in system
    person = db.query(Personnel).filter(
        (Personnel.personnel_id.ilike(clean_pid))
        | (Personnel.personnel_id.ilike(clean_pid.replace("-", "")))
        | (Personnel.name.ilike(clean_pid))
    ).first()

    person_name = payload.personnel_name.strip() if payload.personnel_name else (person.name if person else clean_pid)
    person_role = payload.personnel_role.strip() if payload.personnel_role else (person.role if person else "Expedition Member")

    # If personnel not found in DB, and not even a valid personnel ID or name provided
    if not person and not payload.personnel_name:
        # Check if clean_pid has at least some name/id format
        if not clean_pid or len(clean_pid) < 2:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Personnel '{clean_pid}' not found in roster.",
            )

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    total_weight = round(float(payload.quantity) * float(payload.unit_weight_kg), 2)

    new_item = PackingItem(
        expedition_id=exp.expedition_id,
        personnel_id=clean_pid,
        personnel_name=person_name,
        personnel_role=person_role,
        item_name=clean_item_name,
        category=payload.category.strip() if payload.category else "Personal Gear",
        quantity=payload.quantity,
        unit=payload.unit.strip() if payload.unit else "pcs",
        unit_weight_kg=round(float(payload.unit_weight_kg), 2),
        total_weight_kg=total_weight,
        priority=clean_priority,
        source_reason=payload.source_reason.strip() if payload.source_reason else None,
        status=clean_status,
        created_at=now_str,
        updated_at=now_str,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


def update_packing_item(
    db: Session,
    exp: Expedition,
    item_id: int,
    payload: PackingItemUpdate,
) -> PackingItem:
    """Updates an existing packing item."""
    item = find_packing_item_or_404(db, exp.expedition_id, item_id)
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    if payload.quantity is not None:
        if payload.quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity cannot be negative.",
            )
        item.quantity = payload.quantity

    if payload.unit_weight_kg is not None:
        if payload.unit_weight_kg < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unit weight cannot be negative.",
            )
        item.unit_weight_kg = round(float(payload.unit_weight_kg), 2)

    # Recalculate deterministic total weight
    item.total_weight_kg = round(float(item.quantity) * float(item.unit_weight_kg), 2)

    if payload.item_name is not None:
        clean_name = payload.item_name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item name cannot be empty.",
            )
        item.item_name = clean_name

    if payload.category is not None:
        item.category = payload.category.strip()
    if payload.unit is not None:
        item.unit = payload.unit.strip()

    if payload.priority is not None:
        clean_priority = str(payload.priority).strip().upper()
        if clean_priority not in VALID_PACKING_PRIORITIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority '{payload.priority}'. Allowed: {', '.join(VALID_PACKING_PRIORITIES)}",
            )
        item.priority = clean_priority

    if payload.status is not None:
        clean_status = str(payload.status).strip().upper()
        if clean_status not in VALID_PACKING_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{payload.status}'. Allowed: {', '.join(VALID_PACKING_STATUSES)}",
            )
        item.status = clean_status

    if payload.personnel_id is not None:
        item.personnel_id = payload.personnel_id.strip()
    if payload.personnel_name is not None:
        item.personnel_name = payload.personnel_name.strip()
    if payload.personnel_role is not None:
        item.personnel_role = payload.personnel_role.strip()
    if payload.source_reason is not None:
        item.source_reason = payload.source_reason.strip() if payload.source_reason else None

    item.updated_at = now_str
    db.commit()
    db.refresh(item)
    return item


def delete_packing_item(
    db: Session,
    exp: Expedition,
    item_id: int,
) -> dict[str, Any]:
    """Deletes a packing item from an expedition."""
    item = find_packing_item_or_404(db, exp.expedition_id, item_id)
    db.delete(item)
    db.commit()
    return {
        "success": True,
        "message": f"Packing item #{item_id} deleted successfully.",
        "id": item_id,
        "expedition_id": exp.expedition_id,
    }


def get_expedition_packing_items(
    db: Session,
    exp: Expedition,
    personnel_id: str | None = None,
) -> list[PackingItem]:
    """Retrieves packing items for an expedition, optionally filtered by personnel_id."""
    query = db.query(PackingItem).filter(
        (PackingItem.expedition_id.ilike(exp.expedition_id))
        | (PackingItem.expedition_id.ilike(exp.expedition_id.replace("-", "")))
    )
    if personnel_id:
        clean_pid = personnel_id.strip()
        query = query.filter(
            (PackingItem.personnel_id.ilike(clean_pid))
            | (PackingItem.personnel_id.ilike(clean_pid.replace("-", "")))
            | (PackingItem.personnel_name.ilike(clean_pid))
        )
    return query.order_by(PackingItem.id.asc()).all()


def get_individual_packing_summary(
    db: Session,
    exp: Expedition,
    personnel_id: str,
) -> dict[str, Any]:
    """Computes packing summary and total load for an individual person."""
    clean_pid = personnel_id.strip()
    person = db.query(Personnel).filter(
        (Personnel.personnel_id.ilike(clean_pid))
        | (Personnel.personnel_id.ilike(clean_pid.replace("-", "")))
        | (Personnel.name.ilike(clean_pid))
    ).first()

    items = get_expedition_packing_items(db, exp, personnel_id=clean_pid)
    total_qty = sum(item.quantity for item in items)
    total_weight = round(sum(float(item.total_weight_kg) for item in items), 2)

    person_name = person.name if person else (items[0].personnel_name if items else clean_pid)
    person_role = person.role if person else (items[0].personnel_role if items else "Expedition Member")
    organization = person.organization if person else exp.lead_org
    station = person.current_station if person else exp.station

    return {
        "personnel_id": person.personnel_id if person else clean_pid,
        "personnel_name": person_name,
        "personnel_role": person_role,
        "organization": organization,
        "station": station,
        "total_items_count": len(items),
        "total_quantity": total_qty,
        "total_weight_kg": total_weight,
        "items": items,
    }


def get_team_load_summary(db: Session, exp: Expedition) -> dict[str, Any]:
    """Computes total team load, per-person breakdowns, and priority distributions."""
    all_packing_items = get_expedition_packing_items(db, exp)
    all_personnel = db.query(Personnel).filter(
        (Personnel.expedition_id.ilike(exp.expedition_id))
        | (Personnel.expedition_id.ilike(exp.expedition_id.replace("-", "")))
    ).all()

    # Map items by personnel_id
    items_by_pid: dict[str, list[PackingItem]] = {}
    for item in all_packing_items:
        items_by_pid.setdefault(item.personnel_id, []).append(item)

    # Build per-person breakdowns
    personnel_breakdown: list[dict[str, Any]] = []
    processed_pids = set()

    # First add assigned personnel from Personnel table
    for p in all_personnel:
        p_items = items_by_pid.get(p.personnel_id, [])
        total_qty = sum(i.quantity for i in p_items)
        total_wt = round(sum(float(i.total_weight_kg) for i in p_items), 2)
        personnel_breakdown.append({
            "personnel_id": p.personnel_id,
            "personnel_name": p.name,
            "personnel_role": p.role,
            "organization": p.organization,
            "station": p.current_station,
            "total_items_count": len(p_items),
            "total_quantity": total_qty,
            "total_weight_kg": total_wt,
            "items": p_items,
        })
        processed_pids.add(p.personnel_id)

    # Add any personnel from packing items not in assigned Personnel table
    for pid, p_items in items_by_pid.items():
        if pid not in processed_pids:
            first_i = p_items[0]
            total_qty = sum(i.quantity for i in p_items)
            total_wt = round(sum(float(i.total_weight_kg) for i in p_items), 2)
            personnel_breakdown.append({
                "personnel_id": pid,
                "personnel_name": first_i.personnel_name or pid,
                "personnel_role": first_i.personnel_role or "Expedition Specialist",
                "organization": exp.lead_org,
                "station": exp.station,
                "total_items_count": len(p_items),
                "total_quantity": total_qty,
                "total_weight_kg": total_wt,
                "items": p_items,
            })
            processed_pids.add(pid)

    total_team_load = round(sum(float(i.total_weight_kg) for i in all_packing_items), 2)
    total_items = len(all_packing_items)
    total_qty_sum = sum(i.quantity for i in all_packing_items)

    # Priority breakdown
    priority_breakdown = {}
    for prio in VALID_PACKING_PRIORITIES:
        p_items = [i for i in all_packing_items if i.priority == prio]
        p_wt = round(sum(float(i.total_weight_kg) for i in p_items), 2)
        p_pct = round((p_wt / total_team_load * 100.0), 1) if total_team_load > 0 else 0.0
        priority_breakdown[prio] = {
            "item_count": len(p_items),
            "total_quantity": sum(i.quantity for i in p_items),
            "weight_kg": p_wt,
            "percentage": p_pct,
        }

    # Category breakdown
    category_breakdown = {}
    categories = sorted(list({i.category for i in all_packing_items if i.category}))
    for cat in categories:
        c_items = [i for i in all_packing_items if i.category == cat]
        c_wt = round(sum(float(i.total_weight_kg) for i in c_items), 2)
        c_pct = round((c_wt / total_team_load * 100.0), 1) if total_team_load > 0 else 0.0
        category_breakdown[cat] = {
            "item_count": len(c_items),
            "total_quantity": sum(i.quantity for i in c_items),
            "weight_kg": c_wt,
            "percentage": c_pct,
        }

    total_personnel_count = len(all_personnel) if all_personnel else (exp.personnel_count or len(personnel_breakdown))
    personnel_with_lists = sum(1 for p in personnel_breakdown if p["total_items_count"] > 0)

    return {
        "expedition_id": exp.expedition_id,
        "expedition_name": exp.name,
        "station": exp.station,
        "total_personnel_count": max(total_personnel_count, len(personnel_breakdown)),
        "personnel_with_packing_lists_count": personnel_with_lists,
        "total_items_count": total_items,
        "total_quantity": total_qty_sum,
        "total_team_load_kg": total_team_load,
        "priority_breakdown": priority_breakdown,
        "category_breakdown": category_breakdown,
        "personnel_breakdown": personnel_breakdown,
    }


def get_cargo_capacity_summary(db: Session, exp: Expedition) -> dict[str, Any]:
    """Computes planned load, remaining capacity, utilization, and capacity status."""
    cap_plan = get_or_create_capacity_plan(db, exp)
    all_packing_items = get_expedition_packing_items(db, exp)

    team_personal_load = round(sum(float(i.total_weight_kg) for i in all_packing_items), 2)
    allocated_cargo_wt = round(float(cap_plan.allocated_cargo_kg or 0.0), 2)
    total_planned_weight = round(team_personal_load + allocated_cargo_wt, 2)
    max_cap = round(float(cap_plan.max_capacity_kg or 2000.0), 2)

    remaining_cap = round(max(0.0, max_cap - total_planned_weight), 2)
    over_cap = round(max(0.0, total_planned_weight - max_cap), 2)
    utilization_pct = round((total_planned_weight / max_cap * 100.0), 2) if max_cap > 0 else 0.0
    status_str = "OVER_CAPACITY" if total_planned_weight > max_cap else "WITHIN_CAPACITY"

    critical_wt = round(sum(float(i.total_weight_kg) for i in all_packing_items if i.priority == "CRITICAL"), 2)
    high_wt = round(sum(float(i.total_weight_kg) for i in all_packing_items if i.priority == "HIGH"), 2)
    normal_wt = round(sum(float(i.total_weight_kg) for i in all_packing_items if i.priority == "NORMAL"), 2)

    return {
        "expedition_id": exp.expedition_id,
        "expedition_name": exp.name,
        "maximum_capacity_kg": max_cap,
        "allocated_cargo_weight_kg": allocated_cargo_wt,
        "team_personal_load_kg": team_personal_load,
        "total_planned_weight_kg": total_planned_weight,
        "remaining_capacity_kg": remaining_cap,
        "over_capacity_kg": over_cap,
        "capacity_utilization_pct": utilization_pct,
        "status": status_str,
        "critical_weight_kg": critical_wt,
        "high_weight_kg": high_wt,
        "normal_weight_kg": normal_wt,
        "notes": cap_plan.notes,
        "updated_at": cap_plan.updated_at,
    }


def get_expedition_packing_summary(db: Session, exp: Expedition) -> dict[str, Any]:
    """Aggregates both team load and cargo capacity into unified packing summary."""
    team_load = get_team_load_summary(db, exp)
    capacity = get_cargo_capacity_summary(db, exp)
    return {
        "expedition_id": exp.expedition_id,
        "expedition_name": exp.name,
        "team_load": team_load,
        "capacity": capacity,
    }

