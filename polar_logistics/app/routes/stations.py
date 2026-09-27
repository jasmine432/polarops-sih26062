from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import sessionmaker

from ..database import engine
from ..models import Station
from ..schemas import StationCreate, StationResponse
from ..auth import AuthenticatedUser, get_current_user, require_roles

router = APIRouter(
    prefix="/stations",
    tags=["Stations & Weather"]
)

SessionLocal = sessionmaker(bind=engine)

INITIAL_SEED_STATIONS = [
    {
        "station_id": "Maitri",
        "name": "Maitri Research Base",
        "location": "Schirmacher Oasis, Queen Maud Land, East Antarctica",
        "coordinates": "70°45'57\" S, 11°44'09\" E",
        "latitude": -70.7658,
        "longitude": 11.7358,
        "elevation": "117m above sea level",
        "status": "Operational",
        "station_type": "Antarctic Permanent Research Station",
        "country": "India",
        "established_year": 1989,
        "capacity": 25,
        "current_occupancy": 24,
        "contact_email": "maitri.base@ncpor.gov.in",
        "sensor_id": "NCPOR-AWS-MT-01",
        "notes": "India's second permanent Antarctic research base, commissioned in 1989 in the ice-free rocky Schirmacher Oasis.",
    },
    {
        "station_id": "Bharati",
        "name": "Bharati Research Base",
        "location": "Larsemann Hills, East Antarctica",
        "coordinates": "69°24'28\" S, 76°11'14\" E",
        "latitude": -69.4078,
        "longitude": 76.1872,
        "elevation": "35m above sea level",
        "status": "Operational",
        "station_type": "Antarctic Permanent Research Station",
        "country": "India",
        "established_year": 2012,
        "capacity": 47,
        "current_occupancy": 33,
        "contact_email": "bharati.base@ncpor.gov.in",
        "sensor_id": "NCPOR-AWS-BH-02",
        "notes": "State-of-the-art energy-efficient research station commissioned in 2012 overlooking Prydz Bay.",
    },
    {
        "station_id": "Himadri",
        "name": "Himadri Research Station",
        "location": "Ny-Ålesund, Svalbard, Arctic",
        "coordinates": "78°55'24\" N, 11°55'43\" E",
        "latitude": 78.9234,
        "longitude": 11.9286,
        "elevation": "15m above sea level",
        "status": "Operational",
        "station_type": "Arctic Year-Round Research Station",
        "country": "India",
        "established_year": 2008,
        "capacity": 8,
        "current_occupancy": 4,
        "contact_email": "himadri.base@ncpor.gov.in",
        "sensor_id": "NCPOR-AWS-HM-03",
        "notes": "India's dedicated Arctic research station located in the international science village of Ny-Ålesund, Svalbard.",
    },
    {
        "station_id": "DakshinGangotri",
        "name": "Dakshin Gangotri Historical Base",
        "location": "Queen Maud Land Ice Shelf, Antarctica",
        "coordinates": "70°05'54\" S, 12°00'06\" E",
        "latitude": -70.0984,
        "longitude": 12.0016,
        "elevation": "30m above sea level",
        "status": "Standby",
        "station_type": "Antarctic Historical Site & Supply Depot",
        "country": "India",
        "established_year": 1983,
        "capacity": 0,
        "current_occupancy": 0,
        "contact_email": "ncpor.depot@ncpor.gov.in",
        "sensor_id": "NCPOR-AWS-DG-00",
        "notes": "First Indian Antarctic research station, now maintained as a protected Antarctic historical monument and unmanned supply/fuel depot.",
    },
]


def _seed_stations_if_empty(db) -> None:
    count = db.query(Station).count()
    if count == 0:
        for seed_data in INITIAL_SEED_STATIONS:
            db.add(Station(**seed_data))
        db.commit()


@router.get("", response_model=list[StationResponse])
@router.get("/", response_model=list[StationResponse])
def get_stations(_: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> Any:
    db = SessionLocal()
    try:
        _seed_stations_if_empty(db)
        items = db.query(Station).order_by(Station.id.asc()).all()
        return items
    finally:
        db.close()


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_station(
    payload: StationCreate,
    _: Annotated[AuthenticatedUser, Depends(require_roles("ADMIN"))],
) -> Any:
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Station name is required.",
        )

    clean_location = payload.location.strip()
    if not clean_location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Station location description is required.",
        )

    clean_coordinates = payload.coordinates.strip()
    if not clean_coordinates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Station coordinates are required.",
        )

    db = SessionLocal()
    try:
        # Generate station_id if not provided
        station_id = payload.station_id.strip() if payload.station_id else None
        if not station_id:
            # Generate alphanumeric ID from name
            clean_token = "".join(ch for ch in clean_name if ch.isalnum())
            station_id = clean_token[:20] if clean_token else f"STN-{db.query(Station).count() + 1}"

        # Check duplicate station_id
        existing_id = db.query(Station).filter(
            Station.station_id.ilike(station_id)
        ).first()

        if existing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Station with ID '{station_id}' already exists in the database.",
            )

        # Check duplicate name
        existing_name = db.query(Station).filter(
            Station.name.ilike(clean_name)
        ).first()

        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Station with name '{clean_name}' already exists in the database.",
            )

        sensor_id = payload.sensor_id.strip() if payload.sensor_id else f"NCPOR-AWS-{station_id[:3].upper()}-01"

        new_station = Station(
            station_id=station_id,
            name=clean_name,
            location=clean_location,
            coordinates=clean_coordinates,
            latitude=payload.latitude,
            longitude=payload.longitude,
            elevation=payload.elevation.strip() if payload.elevation else "Sea Level",
            status=payload.status or "Operational",
            station_type=payload.station_type or "Polar Research Outpost",
            country=payload.country or "India",
            established_year=payload.established_year or 2026,
            capacity=payload.capacity if payload.capacity is not None else 25,
            current_occupancy=payload.current_occupancy if payload.current_occupancy is not None else 0,
            contact_email=payload.contact_email.strip() if payload.contact_email else f"{station_id.lower()}@ncpor.gov.in",
            sensor_id=sensor_id,
            notes=payload.notes.strip() if payload.notes else "Newly registered polar expedition station facility.",
        )

        db.add(new_station)
        db.commit()
        db.refresh(new_station)

        return {
            "success": True,
            "message": "Station master record registered successfully!",
            "id": new_station.id,
            "station_id": new_station.station_id,
            "name": new_station.name,
            "location": new_station.location,
        }
    finally:
        db.close()
