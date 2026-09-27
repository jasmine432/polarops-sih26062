from datetime import datetime, date
from typing import Annotated, Any
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from ..database import engine
from ..models import Cargo
from ..schemas import CargoCreate, CargoResponse, CargoStatusUpdate
from ..auth import AuthenticatedUser, get_current_user, require_roles


router = APIRouter(
    prefix="/cargo",
    tags=["Cargo & Logistics"]
)

SessionLocal = sessionmaker(bind=engine)

INITIAL_SEED_CARGO = [
    {
        "cargo_id": "CRG-8821",
        "description": "Ultra-Low Sulfur Arctic Diesel (20,000L ISO Tank)",
        "category": "Fuel & Hydrocarbons",
        "weight": 18.4,
        "weight_unit": "MT",
        "origin": "Cape Town Staging Port",
        "destination": "Maitri Ice Shelf Berth",
        "transport_mode": "Polar Vessel",
        "priority": "Critical",
        "arrival_date": date(2026, 11, 4),
        "status": "In Transit",
    },
    {
        "cargo_id": "CRG-8826",
        "description": "PistenBully 300 Track Drive & Hydraulic Spare Assemblies",
        "category": "Machinery Spares",
        "weight": 9.2,
        "weight_unit": "MT",
        "origin": "Mormugao Port Goa",
        "destination": "Bharati Vehicle Bay",
        "transport_mode": "Polar Vessel",
        "priority": "High",
        "arrival_date": date(2026, 10, 24),
        "status": "Delayed",
    },
    {
        "cargo_id": "CRG-8830",
        "description": "Scientific Wintering Freeze-Dried Food Rations (18 MT)",
        "category": "Provisions & Food",
        "weight": 3.1,
        "weight_unit": "MT",
        "origin": "Cape Town Staging Port",
        "destination": "Maitri Station Hub",
        "transport_mode": "Polar Vessel",
        "priority": "High",
        "arrival_date": date(2026, 11, 10),
        "status": "Loaded",
    },
    {
        "cargo_id": "CRG-8833",
        "description": "Polar Environmental Radiosonde & AWS Spares",
        "category": "Scientific Instrumentation",
        "weight": 850.0,
        "weight_unit": "kg",
        "origin": "NCPOR Goa",
        "destination": "Bharati Met Lab",
        "transport_mode": "Air Cargo",
        "priority": "Standard",
        "arrival_date": date(2026, 10, 18),
        "status": "In Transit",
    },
    {
        "cargo_id": "CRG-8838",
        "description": "Lake Priyadarshini RO Water Filtration Replacement Cartridges",
        "category": "Machinery Spares",
        "weight": 1.4,
        "weight_unit": "MT",
        "origin": "Cape Town Staging Port",
        "destination": "Maitri Water Plant",
        "transport_mode": "Polar Vessel",
        "priority": "Critical",
        "arrival_date": date(2026, 11, 8),
        "status": "Packed",
    },
    {
        "cargo_id": "CRG-8842",
        "description": "Maitri Habitation Container Structural Fasteners & Sealants",
        "category": "Structural & Habitat",
        "weight": 2.2,
        "weight_unit": "MT",
        "origin": "Mormugao Port Goa",
        "destination": "Maitri Station Hub",
        "transport_mode": "Polar Vessel",
        "priority": "Standard",
        "arrival_date": date(2026, 11, 15),
        "status": "Planned",
    },
    {
        "cargo_id": "CRG-8845",
        "description": "Cryosphere Ice Core Drilling Assembly Bit",
        "category": "Scientific Instrumentation",
        "weight": 620.0,
        "weight_unit": "kg",
        "origin": "Cape Town Staging Port",
        "destination": "Bharati Glaciology Berth",
        "transport_mode": "Polar Vessel",
        "priority": "High",
        "arrival_date": date(2026, 10, 30),
        "status": "Loaded",
    },
    {
        "cargo_id": "CRG-8849",
        "description": "Polar Medicine & Emergency Trauma Kit",
        "category": "Medical Supplies",
        "weight": 340.0,
        "weight_unit": "kg",
        "origin": "AIIMS New Delhi",
        "destination": "Maitri Hospital Ward",
        "transport_mode": "Air Cargo",
        "priority": "Critical",
        "arrival_date": date(2026, 10, 15),
        "status": "In Transit",
    },
]


def _parse_arrival_date(val: Any) -> date | None:
    if val is None:
        return None
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        val = val.strip()
        if not val:
            return None
        # Handle ISO or YYYY-MM-DD strings (possibly with timestamps e.g. "2026-11-04 12:00 UTC")
        date_part = val[:10]
        try:
            return datetime.strptime(date_part, "%Y-%m-%d").date()
        except ValueError:
            return None
    return None


@router.post("/", response_model=dict)
@router.post("", response_model=dict)
def create_cargo(
    item: CargoCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> dict:
    db = SessionLocal()
    try:
        # Check for duplicate cargo_id
        existing = db.query(Cargo).filter(Cargo.cargo_id == item.cargo_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cargo consignment with ID '{item.cargo_id}' already exists in the database."
            )

        parsed_date = _parse_arrival_date(item.arrival_date)

        new_cargo = Cargo(
            cargo_id=item.cargo_id.strip(),
            description=item.description.strip() if item.description else None,
            category=item.category.strip() if item.category else None,
            weight=Decimal(str(item.weight)) if item.weight is not None else None,
            weight_unit=item.weight_unit.strip() if item.weight_unit else "MT",
            origin=item.origin.strip() if item.origin else None,
            destination=item.destination.strip() if item.destination else None,
            transport_mode=item.transport_mode.strip() if item.transport_mode else None,
            priority=item.priority.strip() if item.priority else "Standard",
            arrival_date=parsed_date,
            status=item.status.strip() if item.status else "Planned",
        )

        db.add(new_cargo)
        db.commit()
        db.refresh(new_cargo)

        return {
            "success": True,
            "message": "Cargo consignment created successfully!",
            "id": new_cargo.id,
            "cargo_id": new_cargo.cargo_id,
        }
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database constraint violation: {str(exc)}"
        )
    finally:
        db.close()


@router.get("/", response_model=list[dict])
@router.get("", response_model=list[dict])
def get_cargo_list(
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> list[dict]:
    db = SessionLocal()
    try:
        # If database table is empty, seed initial consignments once
        existing_count = db.query(Cargo).count()
        if existing_count == 0:
            for seed in INITIAL_SEED_CARGO:
                c = Cargo(**seed)
                db.add(c)
            db.commit()

        items = db.query(Cargo).order_by(Cargo.id.asc()).all()

        return [
            {
                "id": item.id,
                "cargo_id": item.cargo_id,
                "description": item.description,
                "category": item.category,
                "weight": float(item.weight) if item.weight is not None else 0.0,
                "weight_unit": item.weight_unit or "MT",
                "origin": item.origin,
                "destination": item.destination,
                "transport_mode": item.transport_mode,
                "priority": item.priority,
                "arrival_date": str(item.arrival_date) if item.arrival_date else None,
                "status": item.status,
            }
            for item in items
        ]
    finally:
        db.close()


@router.patch("/{cargo_id}/status", response_model=CargoResponse)
@router.patch("/{cargo_id}", response_model=CargoResponse)
def update_cargo_status(
    cargo_id: str,
    payload: CargoStatusUpdate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    db = SessionLocal()
    try:
        clean_id = cargo_id.strip()
        cargo = db.query(Cargo).filter(
            (Cargo.cargo_id.ilike(clean_id))
            | (Cargo.cargo_id.ilike(clean_id.replace("-", "")))
        ).first()

        if not cargo and clean_id.isdigit():
            cargo = db.query(Cargo).filter(Cargo.id == int(clean_id)).first()

        if not cargo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cargo consignment '{cargo_id}' not found.",
            )

        cargo.status = payload.status
        db.commit()
        db.refresh(cargo)

        return CargoResponse(
            id=cargo.id,
            cargo_id=cargo.cargo_id,
            description=cargo.description,
            category=cargo.category,
            weight=float(cargo.weight) if cargo.weight is not None else None,
            weight_unit=cargo.weight_unit,
            origin=cargo.origin,
            destination=cargo.destination,
            transport_mode=cargo.transport_mode,
            priority=cargo.priority,
            arrival_date=str(cargo.arrival_date) if cargo.arrival_date else None,
            status=cargo.status,
        )
    finally:
        db.close()


@router.get("/{cargo_id}", response_model=CargoResponse)
def get_cargo_item(
    cargo_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    db = SessionLocal()
    try:
        clean_id = cargo_id.strip()
        cargo = db.query(Cargo).filter(
            (Cargo.cargo_id.ilike(clean_id))
            | (Cargo.cargo_id.ilike(clean_id.replace("-", "")))
        ).first()

        if not cargo and clean_id.isdigit():
            cargo = db.query(Cargo).filter(Cargo.id == int(clean_id)).first()

        if not cargo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cargo consignment '{cargo_id}' not found.",
            )

        return CargoResponse(
            id=cargo.id,
            cargo_id=cargo.cargo_id,
            description=cargo.description,
            category=cargo.category,
            weight=float(cargo.weight) if cargo.weight is not None else None,
            weight_unit=cargo.weight_unit,
            origin=cargo.origin,
            destination=cargo.destination,
            transport_mode=cargo.transport_mode,
            priority=cargo.priority,
            arrival_date=str(cargo.arrival_date) if cargo.arrival_date else None,
            status=cargo.status,
        )
    finally:
        db.close()

