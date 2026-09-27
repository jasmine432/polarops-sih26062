import json
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker

from ..database import engine
from ..models import EmergencyIncident
from ..schemas import (
    EmergencyIncidentCreate,
    EmergencyIncidentResponse,
    EmergencyIncidentUpdate,
)
from ..auth import AuthenticatedUser, get_current_user, require_roles

router = APIRouter(
    prefix="/emergency-incidents",
    tags=["Emergency Incidents"],
)

SessionLocal = sessionmaker(bind=engine)

INITIAL_SEED_INCIDENTS = [
    {
        "incident_id": "INC-2026-04",
        "title": "Overdue Field Traverse / Severe Whiteout Hold",
        "description": "Geology Convoy PB-02 (4 crew members) halted at Waypoint 14 due to zero-visibility whiteout conditions and 34kt gusting winds. All 4 members are sheltered inside the heated mobile caboose with emergency rations.",
        "incident_type": "Field Traverse / Weather",
        "severity": "Critical",
        "status": "Responding",
        "location": "Schirmacher Oasis (Waypoint 14)",
        "station_id": "Maitri",
        "expedition_id": "EXP-2026-014",
        "expedition_name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "reported_by": "Radio Control Officer",
        "reported_at": "2026-09-17 18:22 UTC (45m ago)",
        "assigned_to": "SAR Sledge Team 1 (Maitri Base)",
        "assigned_unit": "SAR Sledge Team 1 (Maitri Base)",
        "lead_officer": "Lt. Col. Vikramaditya Singh / Dr. Alok Verma",
        "comms_frequency": "VHF Channel 16 / Sat HF 4125 kHz",
        "coordinates": "70°49' S, 11°38' E",
        "personnel_affected_count": 4,
        "cargo_affected_count": 1,
        "response_action": "Traverse Stop-Movement Directive Issued; Maitri SAR Sledge Standby Activation; 30-Minute Radio Welfare Schedule",
        "response_actions": json.dumps([
            {
                "title": "Traverse Stop-Movement Directive Issued",
                "unit": "Maitri Ops Desk",
                "time": "18:22 UTC",
                "status": "Active",
                "notes": "Strict order to remain in heated caboose until wind drops below 25 knots.",
            },
            {
                "title": "Maitri SAR Sledge Standby Activation",
                "unit": "Maitri SAR Sledge Unit",
                "time": "18:30 UTC",
                "status": "Standby",
                "notes": "PistenBully 300 pre-heated with medical trauma pack and satellite beacon.",
            },
            {
                "title": "30-Minute Radio Welfare Schedule Established",
                "unit": "Radio Control Room",
                "time": "18:45 UTC",
                "status": "In Progress",
                "notes": "Next scheduled check-in at 19:15 UTC.",
            },
        ]),
        "affected_personnel": json.dumps([
            {
                "id": "NCPOR-P-4428",
                "name": "Sub. Major Gurpreet Singh",
                "role": "Traverse Master / Driver",
                "station": "Schirmacher Waypoint 14",
                "bloodGroup": "O-",
                "medicalStatus": "Sheltered in Caboose · Vitals Nominal",
            },
            {
                "id": "NCPOR-P-4432",
                "name": "Dr. Tarun Sen",
                "role": "Field Geologist",
                "station": "Schirmacher Waypoint 14",
                "bloodGroup": "B+",
                "medicalStatus": "Sheltered in Caboose · Vitals Nominal",
            },
            {
                "id": "NCPOR-P-4435",
                "name": "Er. Kamalpreet Joshi",
                "role": "Radio Technician",
                "station": "Schirmacher Waypoint 14",
                "bloodGroup": "A+",
                "medicalStatus": "Maintaining VHF Watch",
            },
            {
                "id": "NCPOR-P-4439",
                "name": "Hav. Ramesh Yadav",
                "role": "EME Support Mechanic",
                "station": "Schirmacher Waypoint 14",
                "bloodGroup": "O+",
                "medicalStatus": "Generator Monitoring Active",
            },
        ]),
        "affected_cargo": json.dumps([
            {
                "id": "CRG-8826",
                "description": "PistenBully Track Spares & Field Drill Rig",
                "destination": "Bharati Vehicle Bay",
                "priority": "High",
                "currentStatus": "Secured on Traverse Sledge",
            },
        ]),
        "timeline": json.dumps([
            {
                "id": "EVT-01",
                "timestamp": "2026-09-17 18:22 UTC",
                "action": "Incident Reported: Convoy Overdue at Waypoint 14",
                "officer": "Radio Control Officer",
                "details": "Convoy PB-02 failed to log scheduled 18:00 UTC crossing due to sudden katabatic gale.",
            },
            {
                "id": "EVT-02",
                "timestamp": "2026-09-17 18:28 UTC",
                "action": "Radio Contact Re-established via VHF Ch 16",
                "officer": "Sub. Major Gurpreet Singh",
                "details": "Confirmed vehicle safely anchored. Visibility < 5 meters. 12 days rations on board.",
            },
            {
                "id": "EVT-03",
                "timestamp": "2026-09-17 18:35 UTC",
                "action": "Incident Classified as Critical Severity",
                "officer": "Dr. Alok Verma (Expedition Lead)",
                "details": "Activated SAR Standby Protocol and notified NCPOR headquarters Goa.",
            },
        ]),
    },
    {
        "incident_id": "INC-2026-05",
        "title": "Crevasse Hazard Zone Shift",
        "description": "Ground penetrating radar (GPR) scan revealed a 4-meter sub-surface snow bridge fracture along the primary vehicle track. Flags updated and heavy convoys diverted 1.8km south.",
        "incident_type": "Crevasse Hazard",
        "severity": "High",
        "status": "Responding",
        "location": "Polar Plateau Traverse km 22",
        "station_id": "Plateau Outpost",
        "expedition_id": "EXP-2026-014",
        "expedition_name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "reported_by": "Dr. Neha Kulkarni",
        "reported_at": "2026-09-17 16:00 UTC (3h ago)",
        "assigned_to": "Sub-glacial Glaciology & Safety Unit",
        "assigned_unit": "Sub-glacial Glaciology & Safety Unit",
        "lead_officer": "Dr. Alok Verma",
        "comms_frequency": "VHF Channel 12",
        "coordinates": "71°10' S, 12°05' E",
        "personnel_affected_count": 6,
        "cargo_affected_count": 2,
        "response_action": "Safety Perimeter Flagging & GPS Waypoint Upload",
        "response_actions": json.dumps([
            {
                "title": "Safety Perimeter Flagging & GPS Waypoint Upload",
                "unit": "Field Glaciology Team",
                "time": "16:30 UTC",
                "status": "Completed",
                "notes": "High-visibility red flags planted 200m ahead of crevasse lip.",
            },
        ]),
        "affected_personnel": json.dumps([
            {
                "id": "NCPOR-P-4441",
                "name": "Dr. Neha Kulkarni",
                "role": "Glaciologist / GPR Lead",
                "station": "Plateau Outpost",
                "bloodGroup": "B+",
                "medicalStatus": "Fit · On Site Survey",
            },
        ]),
        "affected_cargo": json.dumps([
            {
                "id": "CRG-8821",
                "description": "Ultra-Low Sulfur Arctic Diesel (ISO Tank)",
                "destination": "Maitri Ice Shelf Berth",
                "priority": "Critical",
                "currentStatus": "Rerouted to Southern Track",
            },
        ]),
        "timeline": json.dumps([
            {
                "id": "EVT-04",
                "timestamp": "2026-09-17 16:00 UTC",
                "action": "GPR Anomaly Detected on Primary Route",
                "officer": "Dr. Neha Kulkarni",
                "details": "Sub-surface void detected at 2.2m depth.",
            },
            {
                "id": "EVT-05",
                "timestamp": "2026-09-17 16:45 UTC",
                "action": "Route Correction Distributed to Navigation Units",
                "officer": "Logistics Desk",
                "details": "New GPS waypoint file uploaded to all vehicle Garmin units.",
            },
        ]),
    },
    {
        "incident_id": "INC-2026-03",
        "title": "Critical Consignment Customs Delay",
        "description": "Cummins Generator Turbocharger delivery held by South American customs authorities for secondary documentation review.",
        "incident_type": "Logistics Delay",
        "severity": "Moderate",
        "status": "Acknowledged",
        "location": "Punta Arenas Air Logistics Hub",
        "station_id": "Bharati",
        "expedition_id": "EXP-2026-014",
        "expedition_name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "reported_by": "Freight Forwarder",
        "reported_at": "2026-09-16 11:30 UTC",
        "assigned_to": "NCPOR Logistics Procurement Wing",
        "assigned_unit": "NCPOR Logistics Procurement Wing",
        "lead_officer": "Logistics Super Goa",
        "comms_frequency": "Email / Diplomatic Satcom",
        "coordinates": "53°09' S, 70°54' W",
        "personnel_affected_count": 0,
        "cargo_affected_count": 1,
        "response_action": "Embassy Expedite Note Issued",
        "response_actions": json.dumps([
            {
                "title": "Embassy Expedite Note Issued",
                "unit": "Ministry of Earth Sciences",
                "time": "14:00 UTC",
                "status": "In Progress",
                "notes": "Diplomatic transit clearance documents submitted.",
            },
        ]),
        "affected_personnel": json.dumps([]),
        "affected_cargo": json.dumps([
            {
                "id": "CRG-8834",
                "description": "Cummins QSK-60 Generator Turbocharger Assembly",
                "destination": "Bharati Power Module",
                "priority": "Critical",
                "currentStatus": "Customs Hold",
            },
        ]),
        "timeline": json.dumps([
            {
                "id": "EVT-06",
                "timestamp": "2026-09-16 11:30 UTC",
                "action": "Customs Hold Notice Received from Broker",
                "officer": "Freight Forwarder",
                "details": "Inspection scheduled for next business window.",
            },
        ]),
    },
    {
        "incident_id": "INC-2026-01",
        "title": "Hydraulic Fluid Hose Leak (PistenBully 300)",
        "description": "Minor hydraulic hose pinhole leak detected during routine morning vehicle inspection. Fluid contained in spill tray and hose replaced from base stock.",
        "incident_type": "Equipment Failure",
        "severity": "Low",
        "status": "Resolved",
        "location": "Bharati Station Vehicle Bay",
        "station_id": "Bharati",
        "expedition_id": "EXP-2026-014",
        "expedition_name": "44th Indian Scientific Expedition to Antarctica (ISEA)",
        "reported_by": "Er. Rajesh K. Nair",
        "reported_at": "2026-09-10 08:00 UTC",
        "resolved_at": "2026-09-10 09:15 UTC",
        "assigned_to": "Bharati Vehicle Maintenance Team",
        "assigned_unit": "Bharati Vehicle Maintenance Team",
        "lead_officer": "Er. Rajesh K. Nair",
        "comms_frequency": "Base Intercom",
        "coordinates": "69°24'28\" S, 76°11'14\" E",
        "personnel_affected_count": 0,
        "cargo_affected_count": 0,
        "response_action": "Hose Replacement & Spill Clean-up",
        "notes": "Hose replaced from station reserve. Hydraulic pressure pressure-tested to 280 bar with zero leaks. Vehicle cleared for traverse.",
        "resolution_notes": "Hose replaced from station reserve. Hydraulic pressure pressure-tested to 280 bar with zero leaks. Vehicle cleared for traverse.",
        "response_actions": json.dumps([
            {
                "title": "Hose Replacement & Spill Clean-up",
                "unit": "Mechanical Workshop",
                "time": "08:30 UTC",
                "status": "Completed",
                "notes": "Replaced with part #HYD-300-PB. Zero soil or ice contamination.",
            },
        ]),
        "affected_personnel": json.dumps([]),
        "affected_cargo": json.dumps([]),
        "timeline": json.dumps([
            {
                "id": "EVT-07",
                "timestamp": "2026-09-10 08:00 UTC",
                "action": "Leak Identified during Pre-trip Inspection",
                "officer": "Er. Rajesh K. Nair",
                "details": "Pinhole rupture on main boom lift circuit.",
            },
            {
                "id": "EVT-08",
                "timestamp": "2026-09-10 09:15 UTC",
                "action": "Repair Completed & Certified",
                "officer": "Er. Rajesh K. Nair",
                "details": "Incident closed and logged in station maintenance registry.",
            },
        ]),
    },
]


def _seed_incidents_if_empty(db: Any) -> None:
    count = db.query(EmergencyIncident).count()
    if count == 0:
        for seed_data in INITIAL_SEED_INCIDENTS:
            record = EmergencyIncident(**seed_data)
            db.add(record)
        db.commit()


@router.get("", response_model=list[EmergencyIncidentResponse])
@router.get("/", response_model=list[EmergencyIncidentResponse])
def get_emergency_incidents(
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC", "DOCTOR"))]
) -> Any:
    db = SessionLocal()
    try:
        _seed_incidents_if_empty(db)
        incidents = db.query(EmergencyIncident).order_by(EmergencyIncident.id.asc()).all()
        return incidents
    finally:
        db.close()


@router.post("", response_model=EmergencyIncidentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=EmergencyIncidentResponse, status_code=status.HTTP_201_CREATED)
def create_emergency_incident(
    payload: EmergencyIncidentCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    clean_incident_id = payload.incident_id.strip()
    if not clean_incident_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident ID is required.",
        )

    clean_title = payload.title.strip()
    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident title is required.",
        )

    db = SessionLocal()
    try:
        # Check duplicate incident_id
        existing = db.query(EmergencyIncident).filter(
            EmergencyIncident.incident_id.ilike(clean_incident_id)
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Emergency incident with ID '{clean_incident_id}' already exists.",
            )

        new_incident = EmergencyIncident(
            incident_id=clean_incident_id,
            title=clean_title,
            description=payload.description,
            incident_type=payload.incident_type or "General Emergency",
            severity=payload.severity,
            status=payload.status,
            location=payload.location,
            station_id=payload.station_id,
            expedition_id=payload.expedition_id,
            expedition_name=payload.expedition_name,
            reported_by=payload.reported_by,
            reported_at=payload.reported_at,
            resolved_at=payload.resolved_at,
            assigned_to=payload.assigned_to or payload.assigned_unit,
            assigned_unit=payload.assigned_unit or payload.assigned_to,
            lead_officer=payload.lead_officer,
            comms_frequency=payload.comms_frequency,
            coordinates=payload.coordinates,
            personnel_affected_count=payload.personnel_affected_count or 0,
            cargo_affected_count=payload.cargo_affected_count or 0,
            response_action=payload.response_action,
            response_actions=payload.response_actions,
            notes=payload.notes,
            resolution_notes=payload.resolution_notes,
            affected_personnel=payload.affected_personnel,
            affected_cargo=payload.affected_cargo,
            timeline=payload.timeline,
        )

        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)
        return new_incident
    finally:
        db.close()


@router.get("/{incident_id}", response_model=EmergencyIncidentResponse)
def get_emergency_incident_by_id(
    incident_id: str,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN", "PHC", "DOCTOR"))],
) -> Any:
    db = SessionLocal()
    try:
        clean_id = incident_id.strip()
        incident = db.query(EmergencyIncident).filter(
            (EmergencyIncident.incident_id.ilike(clean_id))
            | (EmergencyIncident.incident_id.ilike(clean_id.replace("-", "")))
        ).first()

        if not incident and clean_id.isdigit():
            incident = db.query(EmergencyIncident).filter(
                EmergencyIncident.id == int(clean_id)
            ).first()

        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Emergency incident '{incident_id}' not found.",
            )

        return incident
    finally:
        db.close()


@router.patch("/{incident_id}", response_model=EmergencyIncidentResponse)
def update_emergency_incident(
    incident_id: str,
    payload: EmergencyIncidentUpdate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    db = SessionLocal()
    try:
        clean_id = incident_id.strip()
        incident = db.query(EmergencyIncident).filter(
            (EmergencyIncident.incident_id.ilike(clean_id))
            | (EmergencyIncident.incident_id.ilike(clean_id.replace("-", "")))
        ).first()

        if not incident and clean_id.isdigit():
            incident = db.query(EmergencyIncident).filter(
                EmergencyIncident.id == int(clean_id)
            ).first()

        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Emergency incident '{incident_id}' not found.",
            )

        update_data = payload.model_dump(exclude_unset=True, by_alias=False)
        for field, value in update_data.items():
            if value is not None:
                setattr(incident, field, value)

        db.commit()
        db.refresh(incident)
        return incident
    finally:
        db.close()
