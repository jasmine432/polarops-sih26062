from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker

from ..database import engine
from ..models import Inventory, InventoryTransaction, Base
from ..schemas import (
    InventoryCreate,
    InventoryResponse,
    InventoryTransactionCreate,
    InventoryTransactionResponse,
)
from ..auth import AuthenticatedUser, get_current_user, require_roles

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)

SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)

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


@router.post("/{inventory_id}/transactions", status_code=status.HTTP_201_CREATED)
@router.post("/{inventory_id}/transactions/", status_code=status.HTTP_201_CREATED)
@router.post("/{inventory_id}/transaction", status_code=status.HTTP_201_CREATED)
def log_inventory_transaction(
    inventory_id: str,
    payload: InventoryTransactionCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC", "DOCTOR"))],
) -> Any:
    db = SessionLocal()
    try:
        clean_id = inventory_id.strip()
        item = None
        if clean_id.isdigit():
            item = db.query(Inventory).filter(Inventory.id == int(clean_id)).first()
        elif clean_id.upper().startswith("INV-DB-"):
            num_part = clean_id.upper().replace("INV-DB-", "").lstrip("0")
            if num_part.isdigit():
                item = db.query(Inventory).filter(Inventory.id == int(num_part)).first()
            elif num_part == "":
                item = db.query(Inventory).filter(Inventory.id == 0).first()

        if not item:
            item = db.query(Inventory).filter(Inventory.item_name.ilike(clean_id)).first()

        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory item '{inventory_id}' not found.",
            )

        qty = payload.quantity
        if qty <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction quantity must be greater than zero.",
            )

        txn_type = payload.transaction_type.strip()
        current_qty = item.quantity or 0

        if txn_type == "Intake Delivery":
            effective_qty = qty
            new_balance = current_qty + qty
        elif txn_type in ["Consumption Drawdown", "Emergency Relocation"]:
            if current_qty < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient inventory quantity ({current_qty} {item.unit or 'Units'} available). Operation would result in negative stock.",
                )
            effective_qty = -qty
            new_balance = current_qty - qty
        elif txn_type == "Audit Verification":
            effective_qty = qty - current_qty
            new_balance = qty
        else:
            effective_qty = -qty
            if current_qty < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient inventory quantity ({current_qty} {item.unit or 'Units'} available).",
                )
            new_balance = current_qty - qty

        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        ref_doc = payload.reference_doc.strip() if payload.reference_doc else f"TXN-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        officer_name = payload.officer.strip() if payload.officer else user.name

        # Update persistent inventory stock
        item.quantity = new_balance

        # Record persistent transaction
        new_txn = InventoryTransaction(
            inventory_id=item.id,
            transaction_type=txn_type,
            quantity=effective_qty,
            unit=item.unit or "Units",
            balance_after=new_balance,
            officer=officer_name,
            reference_doc=ref_doc,
            timestamp=now_str,
        )

        db.add(new_txn)
        db.commit()
        db.refresh(item)
        db.refresh(new_txn)

        return {
            "success": True,
            "message": "Inventory transaction recorded successfully!",
            "inventory": InventoryResponse.model_validate(item),
            "transaction": InventoryTransactionResponse.model_validate(new_txn),
        }
    finally:
        db.close()


@router.get("/{inventory_id}/transactions", response_model=list[InventoryTransactionResponse])
@router.get("/{inventory_id}/transactions/", response_model=list[InventoryTransactionResponse])
def get_inventory_transactions(
    inventory_id: str,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> Any:
    db = SessionLocal()
    try:
        clean_id = inventory_id.strip()
        item_id = None
        if clean_id.isdigit():
            item_id = int(clean_id)
        elif clean_id.upper().startswith("INV-DB-"):
            num_part = clean_id.upper().replace("INV-DB-", "").lstrip("0")
            if num_part.isdigit():
                item_id = int(num_part)

        if item_id is None:
            item = db.query(Inventory).filter(Inventory.item_name.ilike(clean_id)).first()
            if item:
                item_id = item.id

        if item_id is None:
            return []

        txns = db.query(InventoryTransaction).filter(
            InventoryTransaction.inventory_id == item_id
        ).order_by(InventoryTransaction.id.desc()).all()

        return [InventoryTransactionResponse.model_validate(t) for t in txns]
    finally:
        db.close()
