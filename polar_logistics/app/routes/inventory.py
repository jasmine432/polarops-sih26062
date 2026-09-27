from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker

from ..database import engine
from ..models import Inventory
from ..schemas import InventoryCreate, InventoryResponse
from ..auth import AuthenticatedUser, get_current_user, require_roles

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)

SessionLocal = sessionmaker(bind=engine)

INITIAL_SEED_INVENTORY = [
    {
        "item_name": "Aviation Turbine Fuel (Jet A-1 Polar Spec)",
        "category": "Fuel & Energy",
        "quantity": 24000,
        "unit": "Liters",
        "location": "Maitri Base - Aviation Fuel Tank Farm Alpha",
        "minimum_stock": 80000,
    },
    {
        "item_name": "Lake Priyadarshini RO Membrane Cartridges",
        "category": "Water & Life Support",
        "quantity": 3,
        "unit": "Units",
        "location": "Maitri Base - Priyadarshini Water Pump House Module 2",
        "minimum_stock": 6,
    },
    {
        "item_name": "PistenBully 300 Polar Track Belts & Cleats",
        "category": "Vehicle & Machinery Spares",
        "quantity": 2,
        "unit": "Sets",
        "location": "Bharati Base - Heavy Vehicle Workshop Module",
        "minimum_stock": 4,
    },
    {
        "item_name": "Hypothermia Emergency Re-warming Units (Active Core)",
        "category": "Medical Supplies",
        "quantity": 2,
        "unit": "Units",
        "location": "Maitri Base - Polar Health Center Critical Care Bay",
        "minimum_stock": 4,
    },
    {
        "item_name": "Ultra-Low Temperature Scientific Grade Ethanol (99.8%)",
        "category": "Scientific Reagents",
        "quantity": 18,
        "unit": "Liters",
        "location": "Bharati Base - Atmospheric Chemistry Analytical Bay",
        "minimum_stock": 40,
    },
    {
        "item_name": "Antarctic Overwinter Expedition Rations (Retort MRE Packets)",
        "category": "Provisions & Rations",
        "quantity": 840,
        "unit": "Meals",
        "location": "Maitri Base - Main Habitat Cold Storage Annex",
        "minimum_stock": 1200,
    },
]


def _seed_inventory_if_empty(db) -> None:
    count = db.query(Inventory).count()
    if count == 0:
        for seed_data in INITIAL_SEED_INVENTORY:
            db.add(Inventory(**seed_data))
        db.commit()


@router.get("", response_model=list[InventoryResponse])
@router.get("/", response_model=list[InventoryResponse])
def get_inventory(_: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> Any:
    db = SessionLocal()
    try:
        _seed_inventory_if_empty(db)
        items = db.query(Inventory).order_by(Inventory.id.asc()).all()
        return items
    finally:
        db.close()


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_inventory(
    item: InventoryCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    clean_name = item.item_name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item name is required and cannot be empty.",
        )

    if item.quantity is not None and item.quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity cannot be negative.",
        )

    if item.minimum_stock is not None and item.minimum_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum stock cannot be negative.",
        )

    db = SessionLocal()
    try:
        clean_location = (item.location or "").strip()
        existing = db.query(Inventory).filter(
            Inventory.item_name.ilike(clean_name),
            Inventory.location.ilike(clean_location) if clean_location else True
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Inventory item '{clean_name}' already exists at location '{clean_location or 'Unassigned'}'.",
            )

        new_item = Inventory(
            item_name=clean_name,
            category=item.category.strip() if item.category else "Vehicle & Machinery Spares",
            quantity=item.quantity if item.quantity is not None else 0,
            unit=item.unit.strip() if item.unit else "Units",
            location=clean_location or "Maitri Base",
            minimum_stock=item.minimum_stock if item.minimum_stock is not None else 0,
        )

        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return {
            "success": True,
            "message": "Inventory item created successfully!",
            "id": new_item.id,
            "item_name": new_item.item_name,
        }
    finally:
        db.close()
