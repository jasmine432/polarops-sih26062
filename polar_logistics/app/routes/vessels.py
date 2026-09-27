import json
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker

from ..database import engine
from ..models import Vessel
from ..schemas import VesselCreate, VesselResponse
from ..auth import AuthenticatedUser, get_current_user, require_roles

router = APIRouter(
    tags=["Tracking & Vessel Movement"]
)

SessionLocal = sessionmaker(bind=engine)

INITIAL_SEED_VESSELS = [
    {
        "vessel_id": "VSL-VASILY-01",
        "name": "MV Vasily Golovnin",
        "vessel_type": "Ice-Classed Polar Supply Vessel / Cargo Carrier",
        "expedition_id": "EXP-2026-014",
        "call_sign": "UBYF8",
        "imo_number": "8721200",
        "flag": "Cyprus (Chartered India)",
        "captain": "Capt. Alexey Ivanov",
        "leader": "Dr. Rajesh Sharma (NCPOR)",
        "origin": "Cape Town Staging Port",
        "destination": "Prydz Bay / Bharati → Maitri Berth",
        "status": "In Transit",
        "latitude": -56.45,
        "longitude": 42.18,
        "heading": "145° SE",
        "speed_knots": 14.2,
        "ice_class": "Arc7 Polar Icebreaker / DNV ICE-1A Super",
        "cargo_count": 224,
        "eta": "14 Feb 2027",
        "last_known_timestamp": "2026-09-19 14:00 UTC",
        "is_live_gps": False,
        "weather_status": "SUITABLE",
        "route_points": json.dumps([
            {"lat": -33.9249, "lng": 18.4241},
            {"lat": -44.5, "lng": 28.2},
            {"lat": -56.45, "lng": 42.18},
            {"lat": -64.2, "lng": 60.5},
            {"lat": -69.4078, "lng": 76.1872},
            {"lat": -70.7658, "lng": 11.7358}
        ]),
        "notes": "Primary ice-strengthened expedition carrier transporting heavy wintering cargo, fuel tanks, and scientific containers.",
    },
    {
        "vessel_id": "VSL-AGULHAS-02",
        "name": "S.A. Agulhas II",
        "vessel_type": "Polar Research & Supply Vessel",
        "expedition_id": "EXP-2026-014",
        "call_sign": "ZR6367",
        "imo_number": "9577135",
        "flag": "South Africa (Joint Logistics Partner)",
        "captain": "Capt. Knowledge Bengu",
        "leader": "Dr. Ananya Rao (PHC)",
        "origin": "Cape Town Staging Port",
        "destination": "Maitri Ice Shelf Berth",
        "status": "At Station",
        "latitude": -33.9249,
        "longitude": 18.4241,
        "heading": "000° N",
        "speed_knots": 0.0,
        "ice_class": "DNV ICE-10 (Polar Class 5)",
        "cargo_count": 140,
        "eta": "28 Feb 2027",
        "last_known_timestamp": "2026-09-19 12:00 UTC",
        "is_live_gps": False,
        "weather_status": "SUITABLE",
        "route_points": json.dumps([
            {"lat": -33.9249, "lng": 18.4241},
            {"lat": -50.0, "lng": 15.0},
            {"lat": -70.7658, "lng": 11.7358}
        ]),
        "notes": "Dedicated deep-water oceanographic vessel providing emergency backup and relief logistics.",
    },
    {
        "vessel_id": "AIR-BASLER-01",
        "name": "Basler BT-67 Polar Turbo",
        "vessel_type": "DROMLAN Polar Ski-Aircraft",
        "expedition_id": "EXP-2026-014",
        "call_sign": "C-FTGI",
        "imo_number": "N/A (Aircraft)",
        "flag": "Canada / ALCI Charter",
        "captain": "Capt. Mark Davis",
        "leader": "Dr. Vivek Menon (Maitri)",
        "origin": "Maitri Skiway Runway",
        "destination": "Novo Airfield Base",
        "status": "In Transit",
        "latitude": -70.7658,
        "longitude": 11.7358,
        "heading": "082° E",
        "speed_knots": 185.0,
        "ice_class": "Ski-Equipped Heavy Turboprop",
        "cargo_count": 12,
        "eta": "Same Day (18:00 UTC)",
        "last_known_timestamp": "2026-09-19 16:15 UTC",
        "is_live_gps": False,
        "weather_status": "SUITABLE",
        "route_points": json.dumps([
            {"lat": -70.7658, "lng": 11.7358},
            {"lat": -70.8167, "lng": 11.8333}
        ]),
        "notes": "Rapid air-link for vital medical supplies, critical spares, and personnel rotation between stations.",
    },
    {
        "vessel_id": "TRK-PISTEN-04",
        "name": "PistenBully 300 Polar Sledge Convoy #04",
        "vessel_type": "Over-Ice Heavy Traverse Sledge Convoy",
        "expedition_id": "EXP-2026-014",
        "call_sign": "VHF-CH12-TRAVERSE",
        "imo_number": "N/A (Ground Sledge)",
        "flag": "India (NCPOR Operations)",
        "captain": "Traverse Commander Ramesh Kumar",
        "leader": "Dr. Alok Verma",
        "origin": "Prydz Bay Anchorage",
        "destination": "Bharati Inland Scientific Depot",
        "status": "In Transit",
        "latitude": -68.95,
        "longitude": 75.60,
        "heading": "195° SSW",
        "speed_knots": 8.5,
        "ice_class": "Heavy Snow Caterpillar Tracked Sledge",
        "cargo_count": 8,
        "eta": "16 Feb 2027",
        "last_known_timestamp": "2026-09-19 17:15 UTC",
        "is_live_gps": False,
        "weather_status": "SUITABLE",
        "route_points": json.dumps([
            {"lat": -68.8, "lng": 75.0},
            {"lat": -68.95, "lng": 75.6},
            {"lat": -69.4078, "lng": 76.1872}
        ]),
        "notes": "Surface traverse convoy hauling deep-ice core drilling equipment across fast ice.",
    },
]


def _seed_vessels_if_empty(db) -> None:
    count = db.query(Vessel).count()
    if count == 0:
        for seed_data in INITIAL_SEED_VESSELS:
            db.add(Vessel(**seed_data))
        db.commit()


# Route handlers for both /tracking and /vessels
@router.get("/vessels", response_model=list[VesselResponse])
@router.get("/vessels/", response_model=list[VesselResponse])
@router.get("/tracking", response_model=list[VesselResponse])
@router.get("/tracking/", response_model=list[VesselResponse])
def get_vessels_or_tracking(_: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> Any:
    db = SessionLocal()
    try:
        _seed_vessels_if_empty(db)
        items = db.query(Vessel).order_by(Vessel.id.asc()).all()
        return items
    finally:
        db.close()


@router.post("/vessels", status_code=status.HTTP_201_CREATED)
@router.post("/vessels/", status_code=status.HTTP_201_CREATED)
@router.post("/tracking", status_code=status.HTTP_201_CREATED)
@router.post("/tracking/", status_code=status.HTTP_201_CREATED)
def create_vessel_or_tracking(
    payload: VesselCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vessel / carrier name is required.",
        )

    clean_origin = payload.origin.strip()
    if not clean_origin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Departure origin port/base is required.",
        )

    clean_destination = payload.destination.strip()
    if not clean_destination:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voyage destination is required.",
        )

    db = SessionLocal()
    try:
        vessel_id = payload.vessel_id.strip() if payload.vessel_id else None
        if not vessel_id:
            clean_token = "".join(ch for ch in clean_name if ch.isalnum()).upper()
            vessel_id = f"VSL-{clean_token[:12]}" if clean_token else f"VSL-{db.query(Vessel).count() + 1}"

        # Check duplicate vessel_id
        existing_id = db.query(Vessel).filter(
            Vessel.vessel_id.ilike(vessel_id)
        ).first()

        if existing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vessel or movement record with ID '{vessel_id}' already exists.",
            )

        # Check duplicate vessel name
        existing_name = db.query(Vessel).filter(
            Vessel.name.ilike(clean_name)
        ).first()

        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vessel or carrier with name '{clean_name}' already exists in database.",
            )

        # Default route points if not provided
        route_pts = payload.route_points
        if not route_pts:
            route_pts = json.dumps([
                {"lat": payload.latitude or -56.45, "lng": payload.longitude or 42.18}
            ])

        new_vessel = Vessel(
            vessel_id=vessel_id,
            name=clean_name,
            vessel_type=payload.vessel_type or "Ice-Classed Polar Supply Vessel / Cargo Carrier",
            expedition_id=payload.expedition_id or "EXP-2026-014",
            call_sign=payload.call_sign.strip() if payload.call_sign else "VHF-POLAR-OPS",
            imo_number=payload.imo_number.strip() if payload.imo_number else "IMO-UNREGISTERED",
            flag=payload.flag or "India / NCPOR Charter",
            captain=payload.captain.strip() if payload.captain else "Command Officer Assigned",
            leader=payload.leader.strip() if payload.leader else "Dr. Rajesh Sharma (NCPOR)",
            origin=clean_origin,
            destination=clean_destination,
            status=payload.status or "In Transit",
            latitude=payload.latitude if payload.latitude is not None else -56.45,
            longitude=payload.longitude if payload.longitude is not None else 42.18,
            heading=payload.heading or "145° SE",
            speed_knots=payload.speed_knots if payload.speed_knots is not None else 12.0,
            ice_class=payload.ice_class or "Arc7 Polar Icebreaker / DNV ICE-1A Super",
            cargo_count=payload.cargo_count if payload.cargo_count is not None else 50,
            eta=payload.eta or "TBD",
            last_known_timestamp=payload.last_known_timestamp or "Operational Telemetry",
            is_live_gps=payload.is_live_gps if payload.is_live_gps is not None else False,
            weather_status=payload.weather_status or "SUITABLE",
            route_points=route_pts,
            notes=payload.notes.strip() if payload.notes else "Registered polar logistics transport carrier.",
        )

        db.add(new_vessel)
        db.commit()
        db.refresh(new_vessel)

        return {
            "success": True,
            "message": "Vessel / Movement tracking record created successfully in database!",
            "id": new_vessel.id,
            "vessel_id": new_vessel.vessel_id,
            "name": new_vessel.name,
            "origin": new_vessel.origin,
            "destination": new_vessel.destination,
            "status": new_vessel.status,
        }
    finally:
        db.close()
