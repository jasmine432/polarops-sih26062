from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker

from ..database import engine
from ..models import Alert, Base
from ..schemas import AlertCreate, AlertResponse, AlertUpdate
from ..auth import AuthenticatedUser, get_current_user, require_roles

router = APIRouter(
    prefix="/alerts",
    tags=["Operational Alerts"],
)

SessionLocal = sessionmaker(bind=engine)

# Ensure table exists
Base.metadata.create_all(bind=engine)

INITIAL_SEED_ALERTS = [
    {
        "alert_id": "ALT-2026-081",
        "severity": "Critical",
        "category": "Emergency",
        "message": "Overdue field traverse convoy PB-02 halted at Waypoint 14 under severe whiteout.",
        "detail": "SAR Sledge Standby activated from Maitri Station. VHF radio welfare schedule active.",
        "related_entity": "Incident INC-2026-04 (Schirmacher Oasis)",
        "related_entity_route": "/emergency/INC-2026-04",
        "created_at": "18:22 UTC (45m ago)",
        "created_date": "2026-09-17",
        "status": "New",
        "source_mechanism": "Manual Dispatch",
    },
    {
        "alert_id": "ALT-2026-080",
        "severity": "Critical",
        "category": "Environmental",
        "message": "Katabatic gale advisory in effect for Maitri Base with surface winds exceeding 34 knots.",
        "detail": "Blowing surface snow reducing visibility below 1.5 km. Whiteout Protocol Stage 1 restrictions active.",
        "related_entity": "Maitri Base AWS Telemetry",
        "related_entity_route": "/weather",
        "created_at": "18:20 UTC (47m ago)",
        "created_date": "2026-09-17",
        "status": "New",
        "source_mechanism": "Sensor Downlink",
    },
    {
        "alert_id": "ALT-2026-079",
        "severity": "High",
        "category": "Cargo",
        "message": "Cargo CRG-8834 (Cummins Turbocharger) has passed its expected arrival date due to customs hold.",
        "detail": "Consignment delayed at Punta Arenas air hub awaiting export certificate verification.",
        "related_entity": "Cargo CRG-8834 (Cummins Turbocharger)",
        "related_entity_route": "/cargo/CRG-8834",
        "created_at": "17:30 UTC (1h ago)",
        "created_date": "2026-09-17",
        "status": "New",
        "source_mechanism": "Rule-Based Threshold",
    },
    {
        "alert_id": "ALT-2026-078",
        "severity": "High",
        "category": "Inventory",
        "message": "Medical supplies below minimum stock at Maitri Base.",
        "detail": "Emergency Sterile Surgical Packs & Plasma Units (INV-MED-0412) count at 4 packs (Safety minimum: 8 packs).",
        "related_entity": "Inventory INV-MED-0412 (Surgical Packs & Plasma)",
        "related_entity_route": "/inventory/INV-MED-0412",
        "created_at": "15:00 UTC (3h ago)",
        "created_date": "2026-09-17",
        "status": "New",
        "source_mechanism": "Rule-Based Threshold",
    },
    {
        "alert_id": "ALT-2026-077",
        "severity": "Moderate",
        "category": "Inventory",
        "message": "Predicted inventory requirement exceeds current stock for Aviation Turbine Fuel (Jet A-1).",
        "detail": "ML demand forecast projects 96,000 L requirement vs 24,000 L physical stock (Estimated shortfall: +72,000 L).",
        "related_entity": "Inventory INV-POL-0101 (Jet A-1 Fuel)",
        "related_entity_route": "/inventory/INV-POL-0101",
        "created_at": "06:00 UTC (12h ago)",
        "created_date": "2026-09-17",
        "status": "Acknowledged",
        "source_mechanism": "ML Forecast",
    },
    {
        "alert_id": "ALT-2026-076",
        "severity": "Moderate",
        "category": "Personnel",
        "message": "Field traverse personnel NCPOR-P-4428 sheltering at field waypoint caboose.",
        "detail": "Sub. Major Gurpreet Singh confirmed sheltered with nominal vitals and 12-day emergency ration reserve.",
        "related_entity": "Personnel NCPOR-P-4428 (Sub. Major Gurpreet Singh)",
        "related_entity_route": "/personnel/NCPOR-P-4428",
        "created_at": "18:22 UTC (45m ago)",
        "created_date": "2026-09-17",
        "status": "Acknowledged",
        "source_mechanism": "Manual Dispatch",
    },
    {
        "alert_id": "ALT-2026-075",
        "severity": "High",
        "category": "Cargo",
        "message": "PistenBully track assembly consignment CRG-8826 delayed by vessel maintenance schedule.",
        "detail": "Charter vessel drydock inspection in Mormugao port extended by 9 days.",
        "related_entity": "Cargo CRG-8826 (Track Drive Spares)",
        "related_entity_route": "/cargo/CRG-8826",
        "created_at": "16:00 UTC (Yesterday)",
        "created_date": "2026-09-16",
        "status": "Acknowledged",
        "source_mechanism": "Rule-Based Threshold",
    },
    {
        "alert_id": "ALT-2026-072",
        "severity": "Low",
        "category": "Environmental",
        "message": "VFR helicopter flight clearances operational at Bharati Base runway.",
        "detail": "Visibility exceeding 10 km, wind speeds steady at 18 knots from East.",
        "related_entity": "Bharati Base AWS Telemetry",
        "related_entity_route": "/weather",
        "created_at": "14:00 UTC (2 days ago)",
        "created_date": "2026-09-15",
        "status": "Resolved",
        "source_mechanism": "Sensor Downlink",
    },
    {
        "alert_id": "ALT-2026-070",
        "severity": "Low",
        "category": "Inventory",
        "message": "Lake Priyadarshini water RO membrane filter replacement logged.",
        "detail": "Replaced element B-2 from station stock following high silt intake during thaw.",
        "related_entity": "Inventory INV-WTR-0204 (RO Membrane Filters)",
        "related_entity_route": "/inventory/INV-WTR-0204",
        "created_at": "11:00 UTC (Yesterday)",
        "created_date": "2026-09-16",
        "status": "Resolved",
        "source_mechanism": "Manual Dispatch",
    },
]


def _ensure_seed_alerts():
    db = SessionLocal()
    try:
        count = db.query(Alert).count()
        if count == 0:
            for item in INITIAL_SEED_ALERTS:
                alert = Alert(**item)
                db.add(alert)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Seed alert error: {e}")
    finally:
        db.close()


# Run seeding check on startup
_ensure_seed_alerts()


@router.get("", response_model=list[AlertResponse])
def get_alerts(
    user: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC", "DOCTOR"))],
) -> list[AlertResponse]:
    """Retrieve all operational alerts ordered by id DESC."""
    _ensure_seed_alerts()
    db = SessionLocal()
    try:
        alerts = db.query(Alert).order_by(Alert.id.desc()).all()
        return [AlertResponse.model_validate(a) for a in alerts]
    finally:
        db.close()


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    payload: AlertCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> AlertResponse:
    """Create a new operational alert (ADMIN only)."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        alert_id = payload.alert_id
        if not alert_id or not alert_id.strip():
            alert_id = f"ALT-2026-{int(now.timestamp()) % 10000:04d}"

        alert_id = alert_id.strip().upper()

        # Check unique alert_id
        existing = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Alert ID '{alert_id}' already exists.",
            )

        now_str = now.strftime("%H:%M UTC (Just now)")
        now_date = now.strftime("%Y-%m-%d")

        route = payload.related_entity_route
        if not route and payload.related_entity:
            entity_lower = payload.related_entity.lower()
            if "cargo" in entity_lower or "crg" in entity_lower:
                route = "/cargo"
            elif "inv" in entity_lower or "fuel" in entity_lower or "medical" in entity_lower or "pack" in entity_lower:
                route = "/inventory"
            elif "ncpor-p" in entity_lower or "personnel" in entity_lower:
                route = "/personnel"
            elif "inc-" in entity_lower or "incident" in entity_lower:
                route = "/emergency"
            elif "weather" in entity_lower or "telemetry" in entity_lower or "aws" in entity_lower:
                route = "/weather"
            else:
                route = "/dashboard"

        new_alert = Alert(
            alert_id=alert_id,
            severity=payload.severity,
            category=payload.category,
            message=payload.message.strip(),
            detail=payload.detail.strip() if payload.detail else None,
            related_entity=payload.related_entity.strip() if payload.related_entity else None,
            related_entity_route=route,
            source_mechanism=payload.source_mechanism or "Manual Dispatch",
            status=payload.status or "New",
            created_at=now_str,
            created_date=now_date,
        )

        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        return AlertResponse.model_validate(new_alert)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    finally:
        db.close()


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_by_id(
    alert_id: str,
    user: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC", "DOCTOR"))],
) -> AlertResponse:
    """Get single alert by alert_id."""
    db = SessionLocal()
    try:
        clean_id = alert_id.strip()
        alert = (
            db.query(Alert)
            .filter((Alert.alert_id == clean_id) | (Alert.alert_id == clean_id.upper()))
            .first()
        )
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert '{alert_id}' not found.",
            )
        return AlertResponse.model_validate(alert)
    finally:
        db.close()


@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: str,
    payload: AlertUpdate,
    user: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> AlertResponse:
    """Update alert status/details or acknowledge (ADMIN only)."""
    db = SessionLocal()
    try:
        clean_id = alert_id.strip()
        alert = (
            db.query(Alert)
            .filter((Alert.alert_id == clean_id) | (Alert.alert_id == clean_id.upper()))
            .first()
        )
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert '{alert_id}' not found.",
            )

        if payload.status is not None:
            alert.status = payload.status
            if payload.status == "Acknowledged":
                now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
                alert.acknowledged_at = payload.acknowledged_at or now
                alert.acknowledged_by = payload.acknowledged_by or user.name

        if payload.severity is not None:
            alert.severity = payload.severity

        if payload.detail is not None:
            alert.detail = payload.detail

        if payload.acknowledged_by is not None:
            alert.acknowledged_by = payload.acknowledged_by

        if payload.acknowledged_at is not None:
            alert.acknowledged_at = payload.acknowledged_at

        db.commit()
        db.refresh(alert)
        return AlertResponse.model_validate(alert)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    finally:
        db.close()
