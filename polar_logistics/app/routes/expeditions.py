from datetime import datetime, date
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker

from ..database import engine
from ..models import Expedition, ExpeditionPlan, PackingItem, CargoCapacityPlan, ResupplyItem, Base
from ..schemas import (
    ExpeditionCreate,
    ExpeditionResponse,
    ExpeditionStatusUpdate,
    ExpeditionPlanCreate,
    ExpeditionPlanUpdate,
    ExpeditionPlanStatusUpdate,
    ExpeditionPlanResponse,
    ExpeditionPlanSummaryResponse,
    PackingItemCreate,
    PackingItemUpdate,
    PackingItemResponse,
    IndividualPackingSummary,
    TeamLoadSummaryResponse,
    CargoCapacityPlanCreateOrUpdate,
    CargoCapacitySummaryResponse,
    ExpeditionPackingSummaryResponse,
    ResupplyItemCreate,
    ResupplyItemUpdate,
    ResupplyItemResponse,
    MLResupplyGenerateRequest,
    MLResupplyGenerateResponse,
    MissionReadinessResponse,
    MissionProgressResponse,
    MissionPhaseUpdateRequest,
)
from ..auth import AuthenticatedUser, get_current_user, require_roles
from ..services.expedition_planner_service import (
    find_expedition_or_404,
    get_or_create_default_plan,
    create_or_update_plan,
    update_plan_status,
    get_planning_summary,
    seed_initial_plans_if_empty,
    create_packing_item,
    update_packing_item,
    delete_packing_item,
    get_expedition_packing_items,
    get_individual_packing_summary,
    get_team_load_summary,
    create_or_update_capacity_plan,
    get_cargo_capacity_summary,
    get_expedition_packing_summary,
    seed_initial_packing_if_empty,
)
from ..services.resupply_service import (
    get_resupply_items,
    create_resupply_item,
    update_resupply_item,
    delete_resupply_item,
    seed_initial_resupply_if_empty,
    generate_ml_resupply_recommendations,
)
from ..services.readiness_service import (
    audit_mission_readiness,
)
from ..services.tracking_service import (
    get_expedition_mission_progress,
    update_expedition_mission_phase,
)
from .stations import _seed_stations_if_empty
from .vessels import _seed_vessels_if_empty

router = APIRouter(
    prefix="/expeditions",
    tags=["Expeditions & Campaigns"]
)

SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)


INITIAL_SEED_EXPEDITIONS = [
    {
        "expedition_id": "EXP-2026-014",
        "name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "season": "2026-2027 (Austral Summer & Wintering Relocation)",
        "station": "Maitri & Bharati",
        "start_date": date(2026, 11, 20),
        "end_date": date(2027, 4, 10),
        "lead": "Dr. Alok Verma",
        "lead_role": "Expedition Leader / Senior Glaciologist",
        "lead_org": "National Centre for Polar and Ocean Research (NCPOR)",
        "personnel_count": 58,
        "cargo_count": 14,
        "status": "Active",
        "notes": "Primary 2026-2027 Antarctic campaign executing ice-core deep drilling at Dronning Maud Land, atmospheric physics lidar calibration, and Maitri II replacement station site preparatory surveys.",
        "mandate": "MoES Polar Mandate Ref #ANT-2026-44-NCPOR",
        "primary_vessel": "MV Vasily Golovnin (Chartered Polar Vessel)",
        "air_support": "Basler BT-67 Polar Turbo / DROMLAN Air Link",
        "comms_link": "INMARSAT Global Xpress & GSAT-7A Ku-Band Feed",
    },
    {
        "expedition_id": "EXP-2026-015",
        "name": "Indian Arctic Autumn Scientific Campaign (Himadri 2026)",
        "season": "2026 (Arctic Fall Transition Campaign)",
        "station": "Himadri (Arctic)",
        "start_date": date(2026, 9, 1),
        "end_date": date(2026, 10, 30),
        "lead": "Dr. K. S. Murthy",
        "lead_role": "Arctic Campaign Lead / Marine Biologist",
        "lead_org": "NCPOR Arctic Research Group",
        "personnel_count": 18,
        "cargo_count": 6,
        "status": "Active",
        "notes": "Ny-Alesund fjord hydrography, Svalbard atmospheric trace gas monitoring, Kongsfjorden marine sediment core analysis during autumn sea-ice formation onset.",
        "mandate": "MoES Arctic Protocol Ref #ARC-2026-09-NCPOR",
        "primary_vessel": "RV Lance (Norwegian Polar Institute Charter)",
        "air_support": "Lufttransport Dornier 228 (Longyearbyen - Ny-Alesund)",
        "comms_link": "Telenor Svalbard Fiber & Iridium Certus Marine Link",
    },
    {
        "expedition_id": "EXP-2026-016",
        "name": "Southern Ocean Paleoclimate Marine Cruise",
        "season": "2026-2027 (Pelagic Summer Cruise)",
        "station": "ORV Sagar Nidhi Hold",
        "start_date": date(2026, 12, 5),
        "end_date": date(2027, 2, 28),
        "lead": "Dr. Priya Nair",
        "lead_role": "Chief Scientist / Paleoceanographer",
        "lead_org": "NCPOR & National Institute of Oceanography (NIO)",
        "personnel_count": 32,
        "cargo_count": 8,
        "status": "Planning",
        "notes": "Multibeam bathymetric mapping and piston coring across the Polar Frontal Zone and Sub-Antarctic Front in the Indian sector of the Southern Ocean.",
        "mandate": "MoES Southern Ocean Mandate Ref #SO-2026-11-NCPOR",
        "primary_vessel": "ORV Sagar Nidhi (MoES Oceanographic Research Vessel)",
        "air_support": "Shipborne Helo Deck (Aerospatiale Alouette III)",
        "comms_link": "FleetBroadband 500 & Indian GSAT Maritime Link",
    },
]


def _seed_expeditions_if_empty(db) -> None:
    count = db.query(Expedition).count()
    if count == 0:
        for seed_data in INITIAL_SEED_EXPEDITIONS:
            db.add(Expedition(**seed_data))
        db.commit()
    seed_initial_plans_if_empty(db)
    seed_initial_packing_if_empty(db)



def _parse_date(val: Any) -> date | None:
    if val is None or val == "":
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        clean_str = val.strip().split(" ")[0].split("T")[0]
        try:
            return datetime.strptime(clean_str, "%Y-%m-%d").date()
        except ValueError:
            return None
    return None


@router.get("", response_model=list[ExpeditionResponse])
@router.get("/", response_model=list[ExpeditionResponse])
def get_expeditions(_: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> Any:
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        items = db.query(Expedition).order_by(Expedition.id.asc()).all()
        return items
    finally:
        db.close()


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_expedition(
    payload: ExpeditionCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expedition name is required.",
        )

    clean_station = payload.station.strip()
    if not clean_station:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Station assignment is required.",
        )

    clean_lead = payload.lead.strip()
    if not clean_lead:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expedition lead name is required.",
        )

    start_dt = _parse_date(payload.start_date)
    if not start_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid expedition start date (YYYY-MM-DD) is required.",
        )

    end_dt = _parse_date(payload.end_date)
    if not end_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid expedition end date (YYYY-MM-DD) is required.",
        )

    if end_dt < start_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expedition end date cannot be prior to start date.",
        )

    if payload.personnel_count is not None and payload.personnel_count < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Personnel count must be at least 1.",
        )

    db = SessionLocal()
    try:
        # Check duplicate name
        existing_name = db.query(Expedition).filter(
            Expedition.name.ilike(clean_name)
        ).first()

        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expedition with name '{clean_name}' already exists in the database.",
            )

        # Generate expedition ID if not provided
        expedition_id = payload.expedition_id.strip() if payload.expedition_id else None
        if not expedition_id:
            year = start_dt.year
            count = db.query(Expedition).count() + 14
            expedition_id = f"EXP-{year}-0{count}"

        # Check duplicate expedition_id
        existing_id = db.query(Expedition).filter(
            Expedition.expedition_id.ilike(expedition_id)
        ).first()

        if existing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expedition ID '{expedition_id}' already exists in the database.",
            )

        year_str = f"{start_dt.year}-{start_dt.year + 1}"
        season_str = f"{year_str} (Registered Campaign)"

        new_exp = Expedition(
            expedition_id=expedition_id,
            name=clean_name,
            season=season_str,
            station=clean_station,
            start_date=start_dt,
            end_date=end_dt,
            lead=clean_lead,
            lead_role="Expedition Commander",
            lead_org="National Centre for Polar and Ocean Research (NCPOR)",
            personnel_count=payload.personnel_count or 1,
            cargo_count=0,
            status=payload.status or "Planning",
            notes=payload.notes.strip() if payload.notes else "New polar expedition campaign awaiting departure window clearance.",
            mandate=f"MoES Polar Order Ref #{expedition_id}-NCPOR",
            primary_vessel="Vessel Assignment in Progress",
            air_support="Air Logistics Awaiting Charter",
            comms_link="NCPOR Satellite Dispatch",
        )

        db.add(new_exp)
        db.commit()
        db.refresh(new_exp)

        return {
            "success": True,
            "message": "Expedition campaign created successfully!",
            "id": new_exp.id,
            "expedition_id": new_exp.expedition_id,
            "name": new_exp.name,
        }
    finally:
        db.close()


@router.patch("/{expedition_id}/status", response_model=ExpeditionResponse)
@router.patch("/{expedition_id}", response_model=ExpeditionResponse)
def update_expedition_status(
    expedition_id: str,
    payload: ExpeditionStatusUpdate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    db = SessionLocal()
    try:
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
                detail=f"Expedition '{expedition_id}' not found.",
            )

        if payload.status is not None:
            valid_statuses = ["Planning", "Active", "Returning", "Concluded", "On Hold"]
            if payload.status not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status '{payload.status}'. Allowed: {', '.join(valid_statuses)}",
                )
            exp.status = payload.status

        if payload.notes is not None:
            exp.notes = payload.notes

        db.commit()
        db.refresh(exp)

        return exp
    finally:
        db.close()


# ==============================================================================
# Expedition Planner Endpoints
# ==============================================================================

@router.get("/{expedition_id}/plan", response_model=ExpeditionPlanResponse)
@router.get("/{expedition_id}/plan/", response_model=ExpeditionPlanResponse)
def get_expedition_plan(
    expedition_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    """Retrieve complete planning information for a specific expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        plan = get_or_create_default_plan(db, exp)
        return plan
    finally:
        db.close()


@router.post("/{expedition_id}/plan", response_model=ExpeditionPlanResponse, status_code=status.HTTP_200_OK)
@router.post("/{expedition_id}/plan/", response_model=ExpeditionPlanResponse, status_code=status.HTTP_200_OK)
@router.patch("/{expedition_id}/plan", response_model=ExpeditionPlanResponse)
@router.patch("/{expedition_id}/plan/", response_model=ExpeditionPlanResponse)
@router.put("/{expedition_id}/plan", response_model=ExpeditionPlanResponse)
@router.put("/{expedition_id}/plan/", response_model=ExpeditionPlanResponse)
def create_or_update_expedition_plan(
    expedition_id: str,
    payload: ExpeditionPlanCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """Create or update planning details for a specific expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        plan = create_or_update_plan(db, exp, payload)
        return plan
    finally:
        db.close()


@router.patch("/{expedition_id}/plan/status", response_model=ExpeditionPlanResponse)
@router.patch("/{expedition_id}/plan/status/", response_model=ExpeditionPlanResponse)
def update_expedition_plan_status(
    expedition_id: str,
    payload: ExpeditionPlanStatusUpdate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """Update the planning lifecycle status for a specific expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        plan = update_plan_status(db, exp, payload)
        return plan
    finally:
        db.close()


@router.get("/{expedition_id}/plan/summary", response_model=ExpeditionPlanSummaryResponse)
@router.get("/{expedition_id}/plan/summary/", response_model=ExpeditionPlanSummaryResponse)
def get_expedition_planning_summary(
    expedition_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    """Retrieve an aggregated operational planning summary for an expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        summary = get_planning_summary(db, exp)
        return summary
    finally:
        db.close()


# ==============================================================================
# Phase 2: Individual Packing & Load Planning Endpoints
# ==============================================================================

@router.get("/{expedition_id}/packing", response_model=list[PackingItemResponse])
@router.get("/{expedition_id}/packing/", response_model=list[PackingItemResponse])
def get_expedition_packing(
    expedition_id: str,
    personnel_id: str | None = None,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)] = None,
) -> Any:
    """Retrieve packing list for an expedition, optionally filtered by personnel_id."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        items = get_expedition_packing_items(db, exp, personnel_id=personnel_id)
        return items
    finally:
        db.close()


@router.post("/{expedition_id}/packing", response_model=PackingItemResponse, status_code=status.HTTP_201_CREATED)
@router.post("/{expedition_id}/packing/", response_model=PackingItemResponse, status_code=status.HTTP_201_CREATED)
def add_expedition_packing_item(
    expedition_id: str,
    payload: PackingItemCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """Add a new packing item requirement for an individual in an expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        item = create_packing_item(db, exp, payload)
        return item
    finally:
        db.close()


@router.patch("/{expedition_id}/packing/{item_id}", response_model=PackingItemResponse)
@router.patch("/{expedition_id}/packing/{item_id}/", response_model=PackingItemResponse)
@router.put("/{expedition_id}/packing/{item_id}", response_model=PackingItemResponse)
@router.put("/{expedition_id}/packing/{item_id}/", response_model=PackingItemResponse)
def modify_expedition_packing_item(
    expedition_id: str,
    item_id: int,
    payload: PackingItemUpdate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """Modify details, quantity, or unit weight of an individual's packing item."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        item = update_packing_item(db, exp, item_id, payload)
        return item
    finally:
        db.close()


@router.delete("/{expedition_id}/packing/{item_id}")
@router.delete("/{expedition_id}/packing/{item_id}/")
def remove_expedition_packing_item(
    expedition_id: str,
    item_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """Remove a packing item requirement from an expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        result = delete_packing_item(db, exp, item_id)
        return result
    finally:
        db.close()


@router.get("/{expedition_id}/packing/summary", response_model=ExpeditionPackingSummaryResponse)
@router.get("/{expedition_id}/packing/summary/", response_model=ExpeditionPackingSummaryResponse)
def get_expedition_packing_summary_endpoint(
    expedition_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    """Retrieve complete team load & cargo capacity planning summary for an expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        summary = get_expedition_packing_summary(db, exp)
        return summary
    finally:
        db.close()


@router.get("/{expedition_id}/load-summary", response_model=TeamLoadSummaryResponse)
@router.get("/{expedition_id}/load-summary/", response_model=TeamLoadSummaryResponse)
def get_expedition_load_summary_endpoint(
    expedition_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    """Retrieve team load aggregation, individual breakdowns, and weight distributions."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        summary = get_team_load_summary(db, exp)
        return summary
    finally:
        db.close()


@router.get("/{expedition_id}/capacity", response_model=CargoCapacitySummaryResponse)
@router.get("/{expedition_id}/capacity/", response_model=CargoCapacitySummaryResponse)
def get_expedition_capacity_endpoint(
    expedition_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    """Retrieve cargo capacity analysis, remaining margin, utilization %, and over-capacity status."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        summary = get_cargo_capacity_summary(db, exp)
        return summary
    finally:
        db.close()


@router.post("/{expedition_id}/capacity", response_model=CargoCapacitySummaryResponse)
@router.post("/{expedition_id}/capacity/", response_model=CargoCapacitySummaryResponse)
@router.patch("/{expedition_id}/capacity", response_model=CargoCapacitySummaryResponse)
@router.patch("/{expedition_id}/capacity/", response_model=CargoCapacitySummaryResponse)
@router.put("/{expedition_id}/capacity", response_model=CargoCapacitySummaryResponse)
@router.put("/{expedition_id}/capacity/", response_model=CargoCapacitySummaryResponse)
def update_expedition_capacity_endpoint(
    expedition_id: str,
    payload: CargoCapacityPlanCreateOrUpdate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """Set or update cargo capacity constraints and allocated cargo weights for an expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        create_or_update_capacity_plan(db, exp, payload)
        summary = get_cargo_capacity_summary(db, exp)
        return summary
    finally:
        db.close()


# =========================================================================
# PHASE 3.1 - 3.3 RESUPPLY PLANNER & ML DEMAND INTEGRATION ENDPOINTS
# =========================================================================

@router.get("/{expedition_id}/resupply", response_model=list[ResupplyItemResponse])
@router.get("/{expedition_id}/resupply/", response_model=list[ResupplyItemResponse])
def get_expedition_resupply_items_endpoint(
    expedition_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    """Retrieve all planned/recommended resupply line items for an expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        seed_initial_resupply_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        items = get_resupply_items(db, exp)
        return items
    finally:
        db.close()


@router.post("/{expedition_id}/resupply", response_model=ResupplyItemResponse, status_code=status.HTTP_201_CREATED)
@router.post("/{expedition_id}/resupply/", response_model=ResupplyItemResponse, status_code=status.HTTP_201_CREATED)
def create_expedition_resupply_item_endpoint(
    expedition_id: str,
    payload: ResupplyItemCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """Create a new planned/recommended resupply line item for an expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        item = create_resupply_item(db, exp, payload)
        return item
    finally:
        db.close()


@router.patch("/{expedition_id}/resupply/{item_id}", response_model=ResupplyItemResponse)
@router.patch("/{expedition_id}/resupply/{item_id}/", response_model=ResupplyItemResponse)
def update_expedition_resupply_item_endpoint(
    expedition_id: str,
    item_id: int,
    payload: ResupplyItemUpdate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """Update a resupply item (e.g. adjust quantities, mark as APPROVED, PLANNED, or CANCELLED)."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        try:
            item = update_resupply_item(db, exp, item_id, payload)
            return item
        except ValueError as err:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    finally:
        db.close()


@router.delete("/{expedition_id}/resupply/{item_id}")
@router.delete("/{expedition_id}/resupply/{item_id}/")
def remove_expedition_resupply_item_endpoint(
    expedition_id: str,
    item_id: int,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """Remove a resupply planning line item from an expedition."""
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        try:
            result = delete_resupply_item(db, exp, item_id)
            return result
        except ValueError as err:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    finally:
        db.close()


@router.post("/{expedition_id}/resupply/generate-ml-recommendations", response_model=MLResupplyGenerateResponse)
@router.post("/{expedition_id}/resupply/generate-ml-recommendations/", response_model=MLResupplyGenerateResponse)
async def generate_ml_recommendations_endpoint(
    expedition_id: str,
    payload: MLResupplyGenerateRequest,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC"))],
) -> Any:
    """
    Run ML inventory demand forecasting across station inventory to generate
    SUGGESTED resupply items for human-in-the-loop review.
    """
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        response = await generate_ml_resupply_recommendations(db, exp, payload)
        return response
    finally:
        db.close()


# =========================================================================
# PHASE 3.4 MISSION READINESS ENGINE ENDPOINT
# =========================================================================

@router.get("/{expedition_id}/readiness", response_model=MissionReadinessResponse)
@router.get("/{expedition_id}/readiness/", response_model=MissionReadinessResponse)
def get_expedition_mission_readiness_endpoint(
    expedition_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    """
    Execute real-time deterministic Mission Readiness Audit across 7 operational pillars:
    PERSONNEL, PACKING, CAPACITY, INVENTORY, ASSETS, STATION, SAFETY.
    Zero database mutation.
    """
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        seed_initial_packing_if_empty(db)
        seed_initial_resupply_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        result = audit_mission_readiness(db, exp)
        return result
    finally:
        db.close()


# =========================================================================
# PHASE 3.5 MISSION PROGRESS & ROUTE TRACKING ENDPOINTS
# =========================================================================

@router.get("/{expedition_id}/progress", response_model=MissionProgressResponse)
@router.get("/{expedition_id}/progress/", response_model=MissionProgressResponse)
def get_expedition_mission_progress_endpoint(
    expedition_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    """
    Retrieve real-time computed mission progress, route waypoints, traveled distance,
    remaining distance, current location fix, and telemetry provenance.
    Zero database mutation.
    """
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        _seed_stations_if_empty(db)
        _seed_vessels_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        return get_expedition_mission_progress(db, exp)
    finally:
        db.close()


@router.patch("/{expedition_id}/progress/phase", response_model=MissionProgressResponse)
@router.patch("/{expedition_id}/progress/phase/", response_model=MissionProgressResponse)
def update_expedition_mission_phase_endpoint(
    expedition_id: str,
    payload: MissionPhaseUpdateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_roles("ADMIN", "PHC")),
    ],
) -> Any:
    """
    Controlled manual advancement/update of expedition mission phase.
    """
    db = SessionLocal()
    try:
        _seed_expeditions_if_empty(db)
        _seed_stations_if_empty(db)
        _seed_vessels_if_empty(db)
        exp = find_expedition_or_404(db, expedition_id)
        try:
            return update_expedition_mission_phase(
                db, exp, payload.phase, current_user, payload.notes
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    finally:
        db.close()
