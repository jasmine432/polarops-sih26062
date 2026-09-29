import logging
from datetime import datetime, date
from typing import Annotated, Any
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import text

from ..database import engine
from ..models import Cargo, Expedition
from ..schemas import CargoCreate, CargoResponse, CargoStatusUpdate, CargoUpdate
from ..auth import AuthenticatedUser, get_current_user, require_roles


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/cargo",
    tags=["Cargo & Logistics"]
)

SessionLocal = sessionmaker(bind=engine)


def _ensure_cargo_expedition_column() -> None:
    """Safe schema check to ensure expedition_id column and foreign key exist on cargo table without altering existing data."""
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE cargo ADD COLUMN IF NOT EXISTS expedition_id VARCHAR(100);"))
            if engine.dialect.name == "postgresql":
                conn.execute(text("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'fk_cargo_expeditions'
                        ) THEN
                            ALTER TABLE cargo
                            ADD CONSTRAINT fk_cargo_expeditions
                            FOREIGN KEY (expedition_id)
                            REFERENCES expeditions(expedition_id)
                            ON DELETE SET NULL;
                        END IF;
                    END $$;
                """))
            conn.commit()
    except SQLAlchemyError as exc:
        err_msg = str(exc).lower()
        if "already exists" in err_msg or "duplicate" in err_msg:
            logger.info("Schema column or constraint already present: %s", exc)
        else:
            logger.error("Failed to ensure cargo.expedition_id schema: %s", exc)
            raise RuntimeError(f"Database schema initialization failed for cargo.expedition_id: {exc}") from exc


# Run safe schema migration once at application startup (module import)
_ensure_cargo_expedition_column()



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

        # Validate expedition_id if supplied
        clean_exp_id = item.expedition_id.strip() if item.expedition_id else None
        if clean_exp_id:
            exp = db.query(Expedition).filter(
                (Expedition.expedition_id == clean_exp_id)
                | (Expedition.expedition_id.ilike(clean_exp_id))
            ).first()
            if not exp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Referenced expedition '{clean_exp_id}' does not exist in the database."
                )

        parsed_date = _parse_arrival_date(item.arrival_date)

        new_cargo = Cargo(
            cargo_id=item.cargo_id.strip(),
            expedition_id=clean_exp_id,
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
            "expedition_id": new_cargo.expedition_id,
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
    expedition_id: str | None = None,
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

        query = db.query(Cargo)
        if expedition_id:
            clean_exp_id = expedition_id.strip()
            query = query.filter(
                (Cargo.expedition_id == clean_exp_id)
                | (Cargo.expedition_id.ilike(clean_exp_id))
            )

        items = query.order_by(Cargo.id.asc()).all()

        return [
            {
                "id": item.id,
                "cargo_id": item.cargo_id,
                "expedition_id": item.expedition_id,
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


def _find_cargo_or_404(db: Any, cargo_id: str) -> Cargo:
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
    return cargo


def _to_cargo_response(cargo: Cargo) -> CargoResponse:
    return CargoResponse(
        id=cargo.id,
        cargo_id=cargo.cargo_id,
        expedition_id=cargo.expedition_id,
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


@router.patch("/{cargo_id}/status", response_model=CargoResponse)
def update_cargo_status(
    cargo_id: str,
    payload: CargoStatusUpdate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    db = SessionLocal()
    try:
        cargo = _find_cargo_or_404(db, cargo_id)
        cargo.status = payload.status
        db.commit()
        db.refresh(cargo)
        return _to_cargo_response(cargo)
    finally:
        db.close()


@router.patch("/{cargo_id}", response_model=CargoResponse)
@router.put("/{cargo_id}", response_model=CargoResponse)
def update_cargo(
    cargo_id: str,
    payload: CargoUpdate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    db = SessionLocal()
    try:
        cargo = _find_cargo_or_404(db, cargo_id)

        if payload.expedition_id is not None:
            clean_exp_id = payload.expedition_id.strip() if isinstance(payload.expedition_id, str) else None
            if clean_exp_id:
                exp = db.query(Expedition).filter(
                    (Expedition.expedition_id == clean_exp_id)
                    | (Expedition.expedition_id.ilike(clean_exp_id))
                ).first()
                if not exp:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Referenced expedition '{clean_exp_id}' does not exist in the database."
                    )
                cargo.expedition_id = clean_exp_id
            else:
                cargo.expedition_id = None

        if payload.description is not None:
            cargo.description = payload.description.strip()
        if payload.category is not None:
            cargo.category = payload.category.strip()
        if payload.weight is not None:
            cargo.weight = Decimal(str(payload.weight))
        if payload.weight_unit is not None:
            cargo.weight_unit = payload.weight_unit.strip()
        if payload.origin is not None:
            cargo.origin = payload.origin.strip()
        if payload.destination is not None:
            cargo.destination = payload.destination.strip()
        if payload.transport_mode is not None:
            cargo.transport_mode = payload.transport_mode.strip()
        if payload.priority is not None:
            cargo.priority = payload.priority.strip()
        if payload.arrival_date is not None:
            cargo.arrival_date = _parse_arrival_date(payload.arrival_date)
        if payload.status is not None:
            cargo.status = payload.status.strip()

        db.commit()
        db.refresh(cargo)
        return _to_cargo_response(cargo)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database constraint violation: {str(exc)}"
        )
    finally:
        db.close()


@router.delete("/{cargo_id}", response_model=dict)
def delete_cargo(
    cargo_id: str,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> dict:
    db = SessionLocal()
    try:
        cargo = _find_cargo_or_404(db, cargo_id)
        deleted_cargo_id = cargo.cargo_id
        db.delete(cargo)
        db.commit()

        return {
            "success": True,
            "message": f"Cargo consignment '{deleted_cargo_id}' deleted successfully.",
            "cargo_id": deleted_cargo_id,
        }
    finally:
        db.close()


@router.get("/{cargo_id}", response_model=CargoResponse)
def get_cargo_item(
    cargo_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    db = SessionLocal()
    try:
        cargo = _find_cargo_or_404(db, cargo_id)
        return _to_cargo_response(cargo)
    finally:
        db.close()
