from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker

from ..database import engine
from ..models import Personnel
from ..schemas import PersonnelCreate, PersonnelResponse
from ..auth import AuthenticatedUser, get_current_user, require_roles

router = APIRouter(
    prefix="/personnel",
    tags=["Personnel & Rosters"]
)

SessionLocal = sessionmaker(bind=engine)

INITIAL_SEED_PERSONNEL = [
    {
        "personnel_id": "NCPOR-P-4401",
        "name": "Dr. Alok Verma",
        "role": "Expedition Leader / Senior Glaciologist",
        "organization": "National Centre for Polar and Ocean Research (NCPOR)",
        "expedition_id": "EXP-2026-014",
        "expedition_name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "current_station": "Maitri Base",
        "destination": "Maitri Base (Stationary)",
        "departure": "2026-11-20",
        "expected_arrival": "2026-11-25",
        "transport_mode": "Station Base (No Transit)",
        "status": "At Station",
        "carrier_flight": "Station Command Post",
        "coordinates": "70°45'57\" S, 11°44'09\" E",
        "module_location": "Maitri Main Habitat · Room 04",
        "vhf_callsign": "MAITRI-LEADER-01",
        "blood_group": "O+",
        "medical_clearance": "AIIMS Certified (Class-1 Polar)",
        "medical_clearance_date": "2026-08-10 (Valid for 18 Months)",
        "survival_training": "Master Winter Mountaineer",
        "survival_training_school": "ITBP Auli Mountaineering & Skiing Institute",
        "emergency_role": "Station Emergency Incident Commander",
    },
    {
        "personnel_id": "NCPOR-P-4404",
        "name": "Lt. Col. Vikramaditya Singh",
        "role": "Operations & Logistics Commander",
        "organization": "Indian Army (Corps of Engineers)",
        "expedition_id": "EXP-2026-014",
        "expedition_name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "current_station": "En Route (DROMLAN Feeder)",
        "destination": "Bharati Base",
        "departure": "2026-09-17 06:30 UTC",
        "expected_arrival": "2026-09-17 21:00 UTC",
        "transport_mode": "Basler BT-67 Air Lift",
        "status": "In Transit",
        "carrier_flight": "Basler BT-67 (Flight C-FTAP)",
        "coordinates": "69°50' S, 45°20' E (Mid-Flight)",
        "module_location": "Aircraft BT-67 Cabin",
        "vhf_callsign": "POLAR-COMMANDER-LOGS",
        "blood_group": "B+",
        "medical_clearance": "Army Base Hospital Delhi (Fit Category SHAPE-1)",
        "medical_clearance_date": "2026-07-15 (Valid for 24 Months)",
        "survival_training": "High Altitude & Extreme Cold Warfare",
        "survival_training_school": "High Altitude Warfare School (HAWS Gulmarg)",
        "emergency_role": "Search and Rescue (SAR) Tactical Controller",
    },
    {
        "personnel_id": "NCPOR-P-4409",
        "name": "Dr. Sunita Deshmukh",
        "role": "Medical Officer / Hyperbaric Specialist",
        "organization": "Indo-Tibetan Border Police (ITBP Medical)",
        "expedition_id": "EXP-2026-014",
        "expedition_name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "current_station": "Maitri Base",
        "destination": "Maitri Hospital Module",
        "departure": "2026-09-14",
        "expected_arrival": "2026-09-14",
        "transport_mode": "Station Base (No Transit)",
        "status": "At Station",
        "carrier_flight": "Hospital Module",
        "coordinates": "70°45'57\" S, 11°44'09\" E",
        "module_location": "Maitri Medical Bay & Hospital",
        "vhf_callsign": "MEDIC-MAITRI-01",
        "blood_group": "A+",
        "medical_clearance": "AIIMS Aeromedical Specialist Certified",
        "medical_clearance_date": "2026-08-01 (Valid for 24 Months)",
        "survival_training": "Advanced Winter Survival & Mountain Medicine",
        "survival_training_school": "ITBP Auli / NIM Uttarkashi",
        "emergency_role": "Chief Medical Officer / Triage Controller",
    },
    {
        "personnel_id": "NCPOR-P-4414",
        "name": "Er. Rajesh K. Nair",
        "role": "Chief Generator & Heavy Machinery Engineer",
        "organization": "NCPOR Technical Division",
        "expedition_id": "EXP-2026-014",
        "expedition_name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "current_station": "Bharati Base",
        "destination": "Bharati Base (Stationary)",
        "departure": "2026-09-01",
        "expected_arrival": "2026-09-05",
        "transport_mode": "Station Base (No Transit)",
        "status": "At Station",
        "carrier_flight": "Power Module Workshop",
        "coordinates": "69°24'28\" S, 76°11'14\" E",
        "module_location": "Bharati Power Plant Module #1",
        "vhf_callsign": "BHARATI-CHIEF-ENG",
        "blood_group": "AB+",
        "medical_clearance": "AIIMS Certified",
        "medical_clearance_date": "2026-07-20 (Valid for 18 Months)",
        "survival_training": "Auli Snow Safety Valid",
        "survival_training_school": "ITBP Auli Training Institute",
        "emergency_role": "Station Vital Systems & Fire Suppression Lead",
    },
    {
        "personnel_id": "NCPOR-P-4428",
        "name": "Sub. Major Gurpreet Singh",
        "role": "Heavy Vehicle Traverse Master",
        "organization": "Indian Army EME / NCPOR",
        "expedition_id": "EXP-2026-014",
        "expedition_name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "current_station": "Schirmacher Oasis (Field Waypoint 14)",
        "destination": "Maitri Base",
        "departure": "2026-09-17 14:00 UTC",
        "expected_arrival": "2026-09-18 10:00 UTC",
        "transport_mode": "PistenBully Sledge Traverse",
        "status": "In Transit",
        "carrier_flight": "PistenBully PB-02 Convoy",
        "coordinates": "70°49' S, 11°38' E (Field Shelter)",
        "module_location": "Mobile Heated Habitation Caboose #2",
        "vhf_callsign": "TRAVERSE-MASTER-02",
        "blood_group": "O-",
        "medical_clearance": "Army Medical Board Valid",
        "medical_clearance_date": "2026-06-15 (Valid for 24 Months)",
        "survival_training": "Siachen Polar & High Altitude Master",
        "survival_training_school": "Siachen Battle School / HAWS",
        "emergency_role": "Field Search & Rescue Vehicle Lead",
    },
    {
        "personnel_id": "NCPOR-P-4501",
        "name": "Dr. Priya Nambiar",
        "role": "Campaign Leader / Marine Biogeochemist",
        "organization": "National Centre for Polar and Ocean Research (NCPOR)",
        "expedition_id": "EXP-2026-015",
        "expedition_name": "Indian Arctic Autumn Scientific Campaign",
        "current_station": "Himadri Station",
        "destination": "Himadri Station (Ny-Ålesund)",
        "departure": "2026-08-15",
        "expected_arrival": "2026-08-16",
        "transport_mode": "Station Base (No Transit)",
        "status": "At Station",
        "carrier_flight": "Himadri Laboratory",
        "coordinates": "78°55' N, 11°56' E",
        "module_location": "Kings Bay Lab Suite 3",
        "vhf_callsign": "HIMADRI-LEAD-01",
        "blood_group": "A+",
        "medical_clearance": "AIIMS Certified",
        "medical_clearance_date": "2026-06-01 (Valid for 12 Months)",
        "survival_training": "Svalbard Polar Bear & Arctic Fire Safety",
        "survival_training_school": "UNIS Longyearbyen Safety Course",
        "emergency_role": "Arctic Safety & Environmental Warden",
    },
    {
        "personnel_id": "NCPOR-P-4301",
        "name": "Dr. M. S. Negi",
        "role": "Wintering Overwinter Commander (Relieved)",
        "organization": "National Centre for Polar and Ocean Research (NCPOR)",
        "expedition_id": "EXP-2026-017",
        "expedition_name": "43rd ISEA Wintering Relocation & Retrograde Team",
        "current_station": "Maitri Ice Shelf Berth",
        "destination": "Cape Town Staging Port",
        "departure": "2026-09-18 10:00 UTC",
        "expected_arrival": "2026-10-15 12:00 UTC",
        "transport_mode": "MV Vasily Golovnin",
        "status": "Transferred",
        "carrier_flight": "MV Vasily Golovnin (Cabin 12)",
        "coordinates": "70°02' S, 11°50' E (Berth)",
        "module_location": "Shipboard Stateroom",
        "vhf_callsign": "RETROGRADE-COMMAND-01",
        "blood_group": "O+",
        "medical_clearance": "Post-Wintering Fit to Travel",
        "medical_clearance_date": "2026-09-10",
        "survival_training": "Master Polar Instructor",
        "survival_training_school": "ITBP Auli Senior Fellow",
        "emergency_role": "Vessel Embarkation Officer",
    },
]


def _seed_personnel_if_empty(db) -> None:
    count = db.query(Personnel).count()
    if count == 0:
        for seed_data in INITIAL_SEED_PERSONNEL:
            db.add(Personnel(**seed_data))
        db.commit()


@router.get("", response_model=list[PersonnelResponse])
@router.get("/", response_model=list[PersonnelResponse])
def get_personnel(_: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> Any:
    db = SessionLocal()
    try:
        _seed_personnel_if_empty(db)
        items = db.query(Personnel).order_by(Personnel.id.asc()).all()
        return items
    finally:
        db.close()


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_personnel(
    payload: PersonnelCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Personnel full name is required.",
        )

    clean_role = payload.role.strip()
    if not clean_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Personnel role / assignment is required.",
        )

    clean_station = payload.current_station.strip()
    if not clean_station:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current station is required.",
        )

    clean_destination = payload.destination.strip()
    if not clean_destination:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Destination sector is required.",
        )

    clean_departure = payload.departure.strip()
    if not clean_departure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Departure date is required.",
        )

    clean_arrival = payload.expected_arrival.strip()
    if not clean_arrival:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expected arrival date is required.",
        )

    db = SessionLocal()
    try:
        # Generate personnel_id if not provided
        personnel_id = payload.personnel_id.strip() if payload.personnel_id else None
        if not personnel_id:
            count = db.query(Personnel).count() + 1
            personnel_id = f"NCPOR-P-{4430 + count}"

        # Check duplicate personnel_id
        existing_id = db.query(Personnel).filter(
            Personnel.personnel_id.ilike(personnel_id)
        ).first()

        if existing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Personnel record with ID '{personnel_id}' already exists in the database.",
            )

        exp_name = payload.expedition_name
        if not exp_name:
            if payload.expedition_id == "EXP-2026-014":
                exp_name = "44th Indian Scientific Expedition to Antarctica (ISEA)"
            elif payload.expedition_id == "EXP-2026-015":
                exp_name = "Indian Arctic Autumn Scientific Campaign"
            elif payload.expedition_id == "EXP-2026-017":
                exp_name = "43rd ISEA Wintering Relocation & Retrograde Team"
            else:
                exp_name = "Indian Scientific Polar Expedition"

        transport_mode = payload.transport_mode or "Basler BT-67 Air Lift"
        carrier_flight = payload.carrier_flight or f"{transport_mode} Unit"
        vhf_callsign = payload.vhf_callsign or f"POLAR-PERS-{personnel_id.replace('NCPOR-P-', '')}"

        new_person = Personnel(
            personnel_id=personnel_id,
            name=clean_name,
            role=clean_role,
            organization=payload.organization.strip() if payload.organization else "National Centre for Polar and Ocean Research (NCPOR)",
            expedition_id=payload.expedition_id or "EXP-2026-014",
            expedition_name=exp_name,
            current_station=clean_station,
            destination=clean_destination,
            departure=clean_departure,
            expected_arrival=clean_arrival,
            transport_mode=transport_mode,
            status=payload.status or "In Transit",
            carrier_flight=carrier_flight,
            coordinates=payload.coordinates or "In Transit (Telemetry Pending)",
            module_location=payload.module_location or "Transit Vehicle Berth",
            vhf_callsign=vhf_callsign,
            blood_group=payload.blood_group or "O+",
            medical_clearance=payload.medical_clearance or "AIIMS Certified",
            medical_clearance_date=payload.medical_clearance_date or "2026-08-01 (Valid for 18 Months)",
            survival_training=payload.survival_training or "Polar Survival Certified",
            survival_training_school=payload.survival_training_school or "ITBP Auli / High Altitude School",
            emergency_role=payload.emergency_role or "Field Movement Specialist",
        )

        db.add(new_person)
        db.commit()
        db.refresh(new_person)

        return {
            "success": True,
            "message": "Personnel movement manifest registered successfully!",
            "id": new_person.id,
            "personnel_id": new_person.personnel_id,
            "name": new_person.name,
        }
    finally:
        db.close()
