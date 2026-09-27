from sqlalchemy import Column, Integer, String, Text, Numeric, Date, Boolean
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, nullable=False)
    category = Column(String)
    quantity = Column(Integer, default=0)
    unit = Column(String)
    location = Column(String)
    minimum_stock = Column(Integer, default=0)


class Cargo(Base):
    __tablename__ = "cargo"

    id = Column(Integer, primary_key=True, index=True)
    cargo_id = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    weight = Column(Numeric, nullable=True)
    weight_unit = Column(String(20), nullable=True)
    origin = Column(String(150), nullable=True)
    destination = Column(String(150), nullable=True)
    transport_mode = Column(String(100), nullable=True)
    priority = Column(String(50), nullable=True)
    arrival_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=True)


class Expedition(Base):
    __tablename__ = "expeditions"

    id = Column(Integer, primary_key=True, index=True)
    expedition_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    season = Column(String(100), nullable=True)
    station = Column(String(150), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    lead = Column(String(150), nullable=True)
    lead_role = Column(String(150), default="Expedition Commander")
    lead_org = Column(String(200), default="National Centre for Polar and Ocean Research (NCPOR)")
    personnel_count = Column(Integer, default=1)
    cargo_count = Column(Integer, default=0)
    status = Column(String(50), default="Planning")
    notes = Column(Text, nullable=True)
    mandate = Column(Text, nullable=True)
    primary_vessel = Column(String(150), nullable=True)
    air_support = Column(String(150), nullable=True)
    comms_link = Column(String(150), nullable=True)


class Personnel(Base):
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    role = Column(String(150), nullable=False)
    organization = Column(String(200), default="National Centre for Polar and Ocean Research (NCPOR)")
    expedition_id = Column(String(100), default="EXP-2026-014")
    expedition_name = Column(String(255), default="44th Indian Scientific Expedition to Antarctica (ISEA)")
    current_station = Column(String(150), nullable=False)
    destination = Column(String(150), default="Maitri Base (Stationary)")
    departure = Column(String(100), nullable=True)
    expected_arrival = Column(String(100), nullable=True)
    transport_mode = Column(String(100), default="Station Base (No Transit)")
    status = Column(String(50), default="At Station")
    carrier_flight = Column(String(150), nullable=True)
    coordinates = Column(String(150), nullable=True)
    module_location = Column(String(150), nullable=True)
    vhf_callsign = Column(String(100), nullable=True)
    blood_group = Column(String(20), default="O+")
    medical_clearance = Column(String(150), default="AIIMS Certified (Class-1 Polar)")
    medical_clearance_date = Column(String(150), nullable=True)
    survival_training = Column(String(150), default="ITBP Auli Polar Qualified")
    survival_training_school = Column(String(150), nullable=True)
    emergency_role = Column(String(150), default="Station Operations Support")


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    coordinates = Column(String(150), nullable=False)
    latitude = Column(Numeric, nullable=True)
    longitude = Column(Numeric, nullable=True)
    elevation = Column(String(100), nullable=True)
    status = Column(String(50), default="Operational")
    station_type = Column(String(150), default="Antarctic Permanent Research Station")
    country = Column(String(100), default="India")
    established_year = Column(Integer, nullable=True)
    capacity = Column(Integer, default=25)
    current_occupancy = Column(Integer, default=24)
    contact_email = Column(String(150), nullable=True)
    sensor_id = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)


class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(Integer, primary_key=True, index=True)
    vessel_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    vessel_type = Column(String(150), default="Ice-Classed Polar Supply Vessel / Cargo Carrier")
    expedition_id = Column(String(100), default="EXP-2026-014")
    call_sign = Column(String(100), nullable=True)
    imo_number = Column(String(50), nullable=True)
    flag = Column(String(100), default="Cyprus (Chartered India)")
    captain = Column(String(150), nullable=True)
    leader = Column(String(150), default="Dr. Rajesh Sharma (NCPOR)")
    origin = Column(String(200), default="Cape Town Staging Port")
    destination = Column(String(200), default="Prydz Bay / Bharati → Maitri Berth")
    status = Column(String(50), default="In Transit")
    latitude = Column(Numeric, nullable=True, default=-56.45)
    longitude = Column(Numeric, nullable=True, default=42.18)
    heading = Column(String(50), default="145° SE")
    speed_knots = Column(Numeric, nullable=True, default=14.2)
    ice_class = Column(String(100), default="Arc7 Polar Icebreaker / DNV ICE-1A Super")
    cargo_count = Column(Integer, default=224)
    eta = Column(String(100), default="14 Feb 2027")
    last_known_timestamp = Column(String(150), default="2026-09-19 14:00 UTC")
    is_live_gps = Column(Boolean, default=False)
    weather_status = Column(String(50), default="SUITABLE")
    route_points = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)


class EmergencyIncident(Base):
    __tablename__ = "emergency_incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    incident_type = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=False, default="High")
    status = Column(String(50), nullable=False, default="Reported")
    location = Column(String(255), nullable=True)
    station_id = Column(String(100), nullable=True)
    expedition_id = Column(String(100), nullable=True)
    expedition_name = Column(String(255), nullable=True)
    reported_by = Column(String(150), nullable=True)
    reported_at = Column(String(150), nullable=True)
    resolved_at = Column(String(150), nullable=True)
    assigned_to = Column(String(150), nullable=True)
    assigned_unit = Column(String(150), nullable=True)
    lead_officer = Column(String(150), nullable=True)
    comms_frequency = Column(String(100), nullable=True)
    coordinates = Column(String(150), nullable=True)
    personnel_affected_count = Column(Integer, default=0)
    cargo_affected_count = Column(Integer, default=0)
    response_action = Column(Text, nullable=True)
    response_actions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    affected_personnel = Column(Text, nullable=True)
    affected_cargo = Column(Text, nullable=True)
    timeline = Column(Text, nullable=True)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), unique=True, nullable=False, index=True)
    severity = Column(String(50), nullable=False, default="Moderate")
    category = Column(String(100), nullable=False, default="Emergency")
    message = Column(String(500), nullable=False)
    detail = Column(Text, nullable=True)
    related_entity = Column(String(255), nullable=True)
    related_entity_route = Column(String(255), nullable=True)
    source_mechanism = Column(String(150), nullable=True, default="Manual Dispatch")
    status = Column(String(50), nullable=False, default="New")
    created_at = Column(String(150), nullable=True)
    created_date = Column(String(50), nullable=True)
    acknowledged_at = Column(String(150), nullable=True)
    acknowledged_by = Column(String(150), nullable=True)


