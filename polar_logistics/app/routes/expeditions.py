from datetime import datetime, date
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker

from ..database import engine
from ..models import Expedition
from ..schemas import ExpeditionCreate, ExpeditionResponse, ExpeditionStatusUpdate
from ..auth import AuthenticatedUser, get_current_user, require_roles

router = APIRouter(
    prefix="/expeditions",
    tags=["Expeditions & Campaigns"]
)

SessionLocal = sessionmaker(bind=engine)

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
