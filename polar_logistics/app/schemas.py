from datetime import date
from typing import Any, Literal
from pydantic import BaseModel, Field



class InventoryCreate(BaseModel):
    item_name: str = Field(min_length=1, max_length=200)
    category: str | None = "Vehicle & Machinery Spares"
    quantity: int = Field(ge=0, default=0)
    unit: str | None = "Units"
    location: str | None = "Maitri Base"
    minimum_stock: int = Field(ge=0, default=0)


class InventoryResponse(BaseModel):
    id: int
    item_name: str
    category: str | None = None
    quantity: int | None = 0
    unit: str | None = None
    location: str | None = None
    minimum_stock: int | None = 0

    class Config:
        from_attributes = True


class InventoryTransactionCreate(BaseModel):
    transaction_type: str = Field(alias="transactionType", default="Consumption Drawdown")
    quantity: int = Field(ge=1)
    officer: str | None = "Logistics Officer"
    reference_doc: str | None = Field(alias="referenceDoc", default=None)

    class Config:
        populate_by_name = True


class InventoryTransactionResponse(BaseModel):
    id: int
    inventory_id: int
    transaction_type: str
    quantity: int
    unit: str | None = None
    balance_after: int
    officer: str | None = None
    reference_doc: str | None = None
    timestamp: str | None = None

    class Config:
        from_attributes = True


class CargoCreate(BaseModel):
    cargo_id: str = Field(min_length=1)
    description: str = Field(min_length=1)
    category: str | None = None
    weight: float | None = None
    weight_unit: str | None = "MT"
    origin: str | None = None
    destination: str | None = None
    transport_mode: str | None = None
    priority: str | None = "Standard"
    arrival_date: date | str | None = None
    status: str | None = "Planned"


class CargoResponse(BaseModel):
    id: int
    cargo_id: str
    description: str | None = None
    category: str | None = None
    weight: float | None = None
    weight_unit: str | None = None
    origin: str | None = None
    destination: str | None = None
    transport_mode: str | None = None
    priority: str | None = None
    arrival_date: Any | None = None
    status: str | None = None

    class Config:
        from_attributes = True


class CargoStatusUpdate(BaseModel):
    status: Literal[
        "Planned",
        "Packed",
        "Loaded",
        "In Transit",
        "Arrived",
        "Received",
        "Delayed",
    ]



class ExpeditionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    station: str = Field(min_length=1, max_length=150)
    start_date: date | str = Field(alias="startDate", default=None)
    end_date: date | str = Field(alias="endDate", default=None)
    lead: str = Field(min_length=1, max_length=150)
    personnel_count: int = Field(alias="personnelCount", ge=1, default=1)
    notes: str | None = None
    status: str | None = "Planning"
    expedition_id: str | None = Field(alias="expeditionId", default=None)

    class Config:
        populate_by_name = True


class ExpeditionResponse(BaseModel):
    id: int
    expedition_id: str
    name: str
    season: str | None = None
    station: str
    start_date: Any | None = None
    end_date: Any | None = None
    lead: str | None = None
    lead_role: str | None = None
    lead_org: str | None = None
    personnel_count: int | None = 1
    cargo_count: int | None = 0
    status: str | None = "Planning"
    notes: str | None = None
    mandate: str | None = None
    primary_vessel: str | None = None
    air_support: str | None = None
    comms_link: str | None = None

    class Config:
        from_attributes = True


class ExpeditionStatusUpdate(BaseModel):
    status: Literal["Planning", "Active", "Returning", "Concluded", "On Hold"]
    notes: str | None = None
    progress: int | None = None


class PersonnelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    role: str = Field(min_length=1, max_length=150)
    organization: str | None = "National Centre for Polar and Ocean Research (NCPOR)"
    expedition_id: str | None = Field(alias="expeditionId", default="EXP-2026-014")
    expedition_name: str | None = Field(alias="expeditionName", default=None)
    current_station: str = Field(alias="currentStation", min_length=1, max_length=150)
    destination: str = Field(min_length=1, max_length=150)
    departure: str = Field(min_length=1)
    expected_arrival: str = Field(alias="expectedArrival", min_length=1)
    transport_mode: str | None = Field(alias="transportMode", default="Basler BT-67 Air Lift")
    status: str | None = "In Transit"
    carrier_flight: str | None = Field(alias="carrierFlight", default=None)
    coordinates: str | None = None
    module_location: str | None = Field(alias="moduleLocation", default=None)
    vhf_callsign: str | None = Field(alias="vhfCallsign", default=None)
    blood_group: str | None = Field(alias="bloodGroup", default="O+")
    medical_clearance: str | None = Field(alias="medicalClearance", default="AIIMS Certified")
    medical_clearance_date: str | None = Field(alias="medicalClearanceDate", default=None)
    survival_training: str | None = Field(alias="survivalTraining", default="Polar Survival Certified")
    survival_training_school: str | None = Field(alias="survivalTrainingSchool", default=None)
    emergency_role: str | None = Field(alias="emergencyRole", default="Field Movement Specialist")
    personnel_id: str | None = Field(alias="personnelId", default=None)

    class Config:
        populate_by_name = True


class PersonnelResponse(BaseModel):
    id: int
    personnel_id: str
    name: str
    role: str
    organization: str | None = None
    expedition_id: str | None = None
    expedition_name: str | None = None
    current_station: str
    destination: str | None = None
    departure: str | None = None
    expected_arrival: str | None = None
    transport_mode: str | None = None
    status: str | None = None
    carrier_flight: str | None = None
    coordinates: str | None = None
    module_location: str | None = None
    vhf_callsign: str | None = None
    blood_group: str | None = None
    medical_clearance: str | None = None
    medical_clearance_date: str | None = None
    survival_training: str | None = None
    survival_training_school: str | None = None
    emergency_role: str | None = None

    class Config:
        from_attributes = True


class StationCreate(BaseModel):
    station_id: str | None = Field(alias="stationId", default=None)
    name: str = Field(min_length=1, max_length=255)
    location: str = Field(min_length=1, max_length=255)
    coordinates: str = Field(min_length=1, max_length=150)
    latitude: float | None = None
    longitude: float | None = None
    elevation: str | None = None
    status: str | None = "Operational"
    station_type: str | None = Field(alias="stationType", default="Antarctic Permanent Research Station")
    country: str | None = "India"
    established_year: int | None = Field(alias="establishedYear", default=None)
    capacity: int | None = Field(ge=0, default=25)
    current_occupancy: int | None = Field(alias="currentOccupancy", ge=0, default=0)
    contact_email: str | None = Field(alias="contactEmail", default=None)
    sensor_id: str | None = Field(alias="sensorId", default=None)
    notes: str | None = None

    class Config:
        populate_by_name = True


class StationResponse(BaseModel):
    id: int
    station_id: str
    name: str
    location: str
    coordinates: str
    latitude: float | None = None
    longitude: float | None = None
    elevation: str | None = None
    status: str | None = "Operational"
    station_type: str | None = None
    country: str | None = None
    established_year: int | None = None
    capacity: int | None = 0
    current_occupancy: int | None = 0
    contact_email: str | None = None
    sensor_id: str | None = None
    notes: str | None = None

    class Config:
        from_attributes = True


class VesselCreate(BaseModel):
    vessel_id: str | None = Field(alias="vesselId", default=None)
    name: str = Field(min_length=1, max_length=255)
    vessel_type: str | None = Field(alias="vesselType", default="Ice-Classed Polar Supply Vessel / Cargo Carrier")
    expedition_id: str | None = Field(alias="expeditionId", default="EXP-2026-014")
    call_sign: str | None = Field(alias="callSign", default=None)
    imo_number: str | None = Field(alias="imoNumber", default=None)
    flag: str | None = "Cyprus (Chartered India)"
    captain: str | None = None
    leader: str | None = "Dr. Rajesh Sharma (NCPOR)"
    origin: str = Field(min_length=1, max_length=200, default="Cape Town Staging Port")
    destination: str = Field(min_length=1, max_length=200, default="Prydz Bay / Bharati → Maitri Berth")
    status: str | None = "In Transit"
    latitude: float | None = -56.45
    longitude: float | None = 42.18
    heading: str | None = "145° SE"
    speed_knots: float | None = Field(alias="speedKnots", default=14.2)
    ice_class: str | None = Field(alias="iceClass", default="Arc7 Polar Icebreaker / DNV ICE-1A Super")
    cargo_count: int | None = Field(alias="cargoCount", default=224)
    eta: str | None = "14 Feb 2027"
    last_known_timestamp: str | None = Field(alias="lastKnownTimestamp", default=None)
    is_live_gps: bool | None = Field(alias="isLiveGps", default=False)
    weather_status: str | None = Field(alias="weatherStatus", default="SUITABLE")
    route_points: str | None = Field(alias="routePoints", default=None)
    notes: str | None = None

    class Config:
        populate_by_name = True


class VesselResponse(BaseModel):
    id: int
    vessel_id: str
    name: str
    vessel_type: str | None = None
    expedition_id: str | None = None
    call_sign: str | None = None
    imo_number: str | None = None
    flag: str | None = None
    captain: str | None = None
    leader: str | None = None
    origin: str
    destination: str
    status: str | None = "In Transit"
    latitude: float | None = None
    longitude: float | None = None
    heading: str | None = None
    speed_knots: float | None = None
    ice_class: str | None = None
    cargo_count: int | None = 0
    eta: str | None = None
    last_known_timestamp: str | None = None
    is_live_gps: bool = False
    weather_status: str | None = "SUITABLE"
    route_points: str | None = None
    notes: str | None = None

    class Config:
        from_attributes = True


class EmergencyIncidentCreate(BaseModel):
    incident_id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    incident_type: str | None = Field(alias="incidentType", default=None)
    severity: Literal["Low", "Moderate", "High", "Critical"] = "High"
    status: Literal["Reported", "Acknowledged", "Responding", "Resolved", "Open", "Closed"] = "Reported"
    location: str | None = None
    station_id: str | None = Field(alias="stationId", default=None)
    expedition_id: str | None = Field(alias="expeditionId", default="EXP-2026-014")
    expedition_name: str | None = Field(alias="expeditionName", default=None)
    reported_by: str | None = Field(alias="reportedBy", default=None)
    reported_at: str | None = Field(alias="reportedAt", default=None)
    resolved_at: str | None = Field(alias="resolvedAt", default=None)
    assigned_to: str | None = Field(alias="assignedTo", default=None)
    assigned_unit: str | None = Field(alias="assignedUnit", default=None)
    lead_officer: str | None = Field(alias="leadOfficer", default=None)
    comms_frequency: str | None = Field(alias="commsFrequency", default=None)
    coordinates: str | None = None
    personnel_affected_count: int | None = Field(alias="personnelAffectedCount", default=0)
    cargo_affected_count: int | None = Field(alias="cargoAffectedCount", default=0)
    response_action: str | None = Field(alias="responseAction", default=None)
    response_actions: str | None = Field(alias="responseActions", default=None)
    notes: str | None = None
    resolution_notes: str | None = Field(alias="resolutionNotes", default=None)
    affected_personnel: str | None = Field(alias="affectedPersonnel", default=None)
    affected_cargo: str | None = Field(alias="affectedCargo", default=None)
    timeline: str | None = None

    class Config:
        populate_by_name = True


class EmergencyIncidentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    incident_type: str | None = Field(alias="incidentType", default=None)
    severity: Literal["Low", "Moderate", "High", "Critical"] | None = None
    status: Literal["Reported", "Acknowledged", "Responding", "Resolved", "Open", "Closed"] | None = None
    location: str | None = None
    station_id: str | None = Field(alias="stationId", default=None)
    expedition_id: str | None = Field(alias="expeditionId", default=None)
    expedition_name: str | None = Field(alias="expeditionName", default=None)
    reported_by: str | None = Field(alias="reportedBy", default=None)
    reported_at: str | None = Field(alias="reportedAt", default=None)
    resolved_at: str | None = Field(alias="resolvedAt", default=None)
    assigned_to: str | None = Field(alias="assignedTo", default=None)
    assigned_unit: str | None = Field(alias="assignedUnit", default=None)
    lead_officer: str | None = Field(alias="leadOfficer", default=None)
    comms_frequency: str | None = Field(alias="commsFrequency", default=None)
    coordinates: str | None = None
    personnel_affected_count: int | None = Field(alias="personnelAffectedCount", default=None)
    cargo_affected_count: int | None = Field(alias="cargoAffectedCount", default=None)
    response_action: str | None = Field(alias="responseAction", default=None)
    response_actions: str | None = Field(alias="responseActions", default=None)
    notes: str | None = None
    resolution_notes: str | None = Field(alias="resolutionNotes", default=None)
    affected_personnel: str | None = Field(alias="affectedPersonnel", default=None)
    affected_cargo: str | None = Field(alias="affectedCargo", default=None)
    timeline: str | None = None

    class Config:
        populate_by_name = True


class EmergencyIncidentResponse(BaseModel):
    id: int
    incident_id: str
    title: str
    description: str | None = None
    incident_type: str | None = None
    severity: str
    status: str
    location: str | None = None
    station_id: str | None = None
    expedition_id: str | None = None
    expedition_name: str | None = None
    reported_by: str | None = None
    reported_at: str | None = None
    resolved_at: str | None = None
    assigned_to: str | None = None
    assigned_unit: str | None = None
    lead_officer: str | None = None
    comms_frequency: str | None = None
    coordinates: str | None = None
    personnel_affected_count: int | None = 0
    cargo_affected_count: int | None = 0
    response_action: str | None = None
    response_actions: str | None = None
    notes: str | None = None
    resolution_notes: str | None = None
    affected_personnel: str | None = None
    affected_cargo: str | None = None
    timeline: str | None = None

    class Config:
        from_attributes = True


class AlertCreate(BaseModel):
    alert_id: str | None = Field(default=None, alias="alertId")
    severity: Literal["Critical", "High", "Moderate", "Low"] = "Moderate"
    category: Literal["Inventory", "Cargo", "Personnel", "Emergency", "Environmental"] = "Emergency"
    message: str = Field(min_length=1, max_length=500)
    detail: str | None = None
    related_entity: str | None = Field(default=None, alias="relatedEntity")
    related_entity_route: str | None = Field(default=None, alias="relatedEntityRoute")
    source_mechanism: Literal["Rule-Based Threshold", "ML Forecast", "Sensor Downlink", "Manual Dispatch"] | str | None = Field(default="Manual Dispatch", alias="sourceMechanism")
    status: Literal["New", "Acknowledged", "Resolved"] | None = "New"

    class Config:
        populate_by_name = True


class AlertUpdate(BaseModel):
    status: Literal["New", "Acknowledged", "Resolved"] | None = None
    severity: Literal["Critical", "High", "Moderate", "Low"] | None = None
    detail: str | None = None
    acknowledged_by: str | None = Field(default=None, alias="acknowledgedBy")
    acknowledged_at: str | None = Field(default=None, alias="acknowledgedAt")

    class Config:
        populate_by_name = True


class AlertResponse(BaseModel):
    id: int
    alert_id: str
    severity: str
    category: str
    message: str
    detail: str | None = None
    related_entity: str | None = None
    related_entity_route: str | None = None
    source_mechanism: str | None = None
    status: str
    created_at: str | None = None
    created_date: str | None = None
    acknowledged_at: str | None = None
    acknowledged_by: str | None = None

    class Config:
        from_attributes = True


# ==============================================================================
# Expedition Planning & Mission Lifecycle Schemas
# ==============================================================================

PlanningStatusType = Literal[
    "PLANNING",
    "READY_FOR_REVIEW",
    "READY",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
]


class ExpeditionPlanCreate(BaseModel):
    planning_status: PlanningStatusType | str | None = Field(alias="planningStatus", default="PLANNING")
    mission_objective: str | None = Field(alias="missionObjective", default=None)
    planned_start: date | str | None = Field(alias="plannedStart", default=None)
    planned_end: date | str | None = Field(alias="plannedEnd", default=None)
    station: str | None = None
    vessel: str | None = None
    lead_planner: str | None = Field(alias="leadPlanner", default=None)
    planning_notes: str | None = Field(alias="planningNotes", default=None)

    class Config:
        populate_by_name = True


class ExpeditionPlanUpdate(BaseModel):
    planning_status: PlanningStatusType | str | None = Field(alias="planningStatus", default=None)
    mission_objective: str | None = Field(alias="missionObjective", default=None)
    planned_start: date | str | None = Field(alias="plannedStart", default=None)
    planned_end: date | str | None = Field(alias="plannedEnd", default=None)
    station: str | None = None
    vessel: str | None = None
    lead_planner: str | None = Field(alias="leadPlanner", default=None)
    planning_notes: str | None = Field(alias="planningNotes", default=None)

    class Config:
        populate_by_name = True


class ExpeditionPlanStatusUpdate(BaseModel):
    planning_status: PlanningStatusType | str = Field(alias="planningStatus")
    planning_notes: str | None = Field(alias="planningNotes", default=None)

    class Config:
        populate_by_name = True


class ExpeditionPlanResponse(BaseModel):
    id: int
    expedition_id: str
    planning_status: str
    mission_objective: str | None = None
    planned_start: Any | None = None
    planned_end: Any | None = None
    station: str | None = None
    vessel: str | None = None
    lead_planner: str | None = None
    planning_notes: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

    class Config:
        from_attributes = True


class PlanningPersonnelSummary(BaseModel):
    total_assigned: int = 0
    medically_cleared_count: int = 0
    survival_trained_count: int = 0
    roles: list[str] = []
    lead_officer: str | None = None


class PlanningCargoSummary(BaseModel):
    total_count: int = 0
    total_weight_mt: float | None = 0.0
    critical_cargo_count: int = 0
    categories: list[str] = []


class PlanningInventorySummary(BaseModel):
    total_items_tracked: int = 0
    low_stock_items_count: int = 0
    station_monitored: str | None = None


class PlanningReadinessSummary(BaseModel):
    personnel_ready: bool = True
    vessel_ready: bool = True
    station_ready: bool = True
    no_critical_alerts: bool = True
    readiness_score: int = 100
    readiness_status: Literal["READY", "PENDING_CHECKS", "BLOCKED", "OPERATIONAL"] = "READY"
    indicators: dict[str, Any] = {}


class ExpeditionPlanSummaryResponse(BaseModel):
    expedition_id: str
    expedition_name: str
    expedition_status: str
    planning_status: str
    season: str | None = None
    station: str
    start_date: Any | None = None
    end_date: Any | None = None
    planned_start: Any | None = None
    planned_end: Any | None = None
    duration_days: int | None = None
    lead: str | None = None
    lead_role: str | None = None
    lead_org: str | None = None
    mandate: str | None = None
    primary_vessel: str | None = None
    air_support: str | None = None
    comms_link: str | None = None
    mission_objective: str | None = None
    planning_notes: str | None = None
    personnel: PlanningPersonnelSummary
    cargo: PlanningCargoSummary
    inventory: PlanningInventorySummary
    vessel_assignment: dict[str, Any] | None = None
    station_details: dict[str, Any] | None = None
    active_alerts_count: int = 0
    critical_alerts_count: int = 0
    emergency_incident_count: int = 0
    readiness: PlanningReadinessSummary


# ==============================================================================
# Phase 2: Individual Packing, Team Load & Cargo Capacity Schemas
# ==============================================================================

PackingPriorityType = Literal["CRITICAL", "HIGH", "NORMAL"]
PackingStatusType = Literal["PLANNED", "PACKED", "INSPECTED", "LOADED"]


class PackingItemCreate(BaseModel):
    personnel_id: str = Field(alias="personnelId", min_length=1)
    personnel_name: str | None = Field(alias="personnelName", default=None)
    personnel_role: str | None = Field(alias="personnelRole", default=None)
    item_name: str = Field(alias="itemName", min_length=1, max_length=255)
    category: str | None = "Personal Gear"
    quantity: int = Field(ge=0, default=1)
    unit: str | None = "pcs"
    unit_weight_kg: float = Field(alias="unitWeightKg", ge=0.0, default=0.0)
    priority: PackingPriorityType | str = "NORMAL"
    source_reason: str | None = Field(alias="sourceReason", default=None)
    status: PackingStatusType | str = "PLANNED"

    class Config:
        populate_by_name = True


class PackingItemUpdate(BaseModel):
    personnel_id: str | None = Field(alias="personnelId", default=None)
    personnel_name: str | None = Field(alias="personnelName", default=None)
    personnel_role: str | None = Field(alias="personnelRole", default=None)
    item_name: str | None = Field(alias="itemName", default=None)
    category: str | None = None
    quantity: int | None = Field(ge=0, default=None)
    unit: str | None = None
    unit_weight_kg: float | None = Field(alias="unitWeightKg", ge=0.0, default=None)
    priority: PackingPriorityType | str | None = None
    source_reason: str | None = Field(alias="sourceReason", default=None)
    status: PackingStatusType | str | None = None

    class Config:
        populate_by_name = True


class PackingItemResponse(BaseModel):
    id: int
    expedition_id: str
    personnel_id: str
    personnel_name: str | None = None
    personnel_role: str | None = None
    item_name: str
    category: str
    quantity: int
    unit: str | None = None
    unit_weight_kg: float
    total_weight_kg: float
    priority: str
    source_reason: str | None = None
    status: str
    created_at: str | None = None
    updated_at: str | None = None

    class Config:
        from_attributes = True


class IndividualPackingSummary(BaseModel):
    personnel_id: str
    personnel_name: str
    personnel_role: str | None = None
    organization: str | None = None
    station: str | None = None
    total_items_count: int = 0
    total_quantity: int = 0
    total_weight_kg: float = 0.0
    items: list[PackingItemResponse] = []


class PriorityBreakdownItem(BaseModel):
    item_count: int = 0
    total_quantity: int = 0
    weight_kg: float = 0.0
    percentage: float = 0.0


class TeamLoadSummaryResponse(BaseModel):
    expedition_id: str
    expedition_name: str
    station: str
    total_personnel_count: int = 0
    personnel_with_packing_lists_count: int = 0
    total_items_count: int = 0
    total_quantity: int = 0
    total_team_load_kg: float = 0.0
    priority_breakdown: dict[str, PriorityBreakdownItem] = {}
    category_breakdown: dict[str, PriorityBreakdownItem] = {}
    personnel_breakdown: list[IndividualPackingSummary] = []


class CargoCapacityPlanCreateOrUpdate(BaseModel):
    max_capacity_kg: float = Field(alias="maxCapacityKg", gt=0)
    allocated_cargo_kg: float | None = Field(alias="allocatedCargoKg", ge=0.0, default=0.0)
    notes: str | None = None

    class Config:
        populate_by_name = True


class CargoCapacitySummaryResponse(BaseModel):
    expedition_id: str
    expedition_name: str
    maximum_capacity_kg: float
    allocated_cargo_weight_kg: float
    team_personal_load_kg: float
    total_planned_weight_kg: float
    remaining_capacity_kg: float
    over_capacity_kg: float
    capacity_utilization_pct: float
    status: Literal["WITHIN_CAPACITY", "OVER_CAPACITY"]
    critical_weight_kg: float = 0.0
    high_weight_kg: float = 0.0
    normal_weight_kg: float = 0.0
    notes: str | None = None
    updated_at: str | None = None


class ExpeditionPackingSummaryResponse(BaseModel):
    expedition_id: str
    expedition_name: str
    team_load: TeamLoadSummaryResponse
    capacity: CargoCapacitySummaryResponse


ResupplyPriority = Literal["CRITICAL", "HIGH", "NORMAL", "LOW"]
ResupplyStatus = Literal["SUGGESTED", "PLANNED", "APPROVED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]


class ResupplyItemCreate(BaseModel):
    inventory_id: int | None = Field(default=None, alias="inventoryId")
    item_name: str = Field(min_length=1, max_length=255, alias="itemName")
    category: str = Field(min_length=1, max_length=100, default="Provisions & Rations")
    unit: str | None = Field(default="units", max_length=50)
    current_stock: float = Field(ge=0.0, default=0.0, alias="currentStock")
    minimum_stock: float = Field(ge=0.0, default=0.0, alias="minimumStock")
    predicted_demand: float = Field(ge=0.0, default=0.0, alias="predictedDemand")
    safety_stock: float | None = Field(ge=0.0, default=None, alias="safetyStock")
    reorder_threshold: float | None = Field(ge=0.0, default=None, alias="reorderThreshold")
    resupply_quantity: float | None = Field(ge=0.0, default=None, alias="resupplyQuantity")
    source_station_id: str | None = Field(default="Cape Town Staging Depot", alias="sourceStationId")
    delivery_vessel_id: str | None = Field(default=None, alias="deliveryVesselId")
    target_eta: str | None = Field(default=None, alias="targetEta")
    priority: ResupplyPriority = Field(default="NORMAL")
    status: ResupplyStatus = Field(default="PLANNED")
    is_ml_recommended: bool = Field(default=False, alias="isMlRecommended")
    ml_confidence: str | None = Field(default=None, alias="mlConfidence")
    recommendation_notes: str | None = Field(default=None, alias="recommendationNotes")

    class Config:
        populate_by_name = True


class ResupplyItemUpdate(BaseModel):
    item_name: str | None = Field(default=None, min_length=1, max_length=255, alias="itemName")
    category: str | None = Field(default=None, min_length=1, max_length=100)
    unit: str | None = Field(default=None, max_length=50)
    current_stock: float | None = Field(default=None, ge=0.0, alias="currentStock")
    minimum_stock: float | None = Field(default=None, ge=0.0, alias="minimumStock")
    predicted_demand: float | None = Field(default=None, ge=0.0, alias="predictedDemand")
    safety_stock: float | None = Field(default=None, ge=0.0, alias="safetyStock")
    reorder_threshold: float | None = Field(default=None, ge=0.0, alias="reorderThreshold")
    resupply_quantity: float | None = Field(default=None, ge=0.0, alias="resupplyQuantity")
    source_station_id: str | None = Field(default=None, alias="sourceStationId")
    delivery_vessel_id: str | None = Field(default=None, alias="deliveryVesselId")
    target_eta: str | None = Field(default=None, alias="targetEta")
    priority: ResupplyPriority | None = None
    status: ResupplyStatus | None = None
    recommendation_notes: str | None = Field(default=None, alias="recommendationNotes")

    class Config:
        populate_by_name = True


class ResupplyItemResponse(BaseModel):
    id: int
    expedition_id: str
    inventory_id: int | None = None
    item_name: str
    category: str
    unit: str | None = None
    current_stock: float
    minimum_stock: float
    predicted_demand: float
    safety_stock: float
    reorder_threshold: float
    resupply_quantity: float
    source_station_id: str | None = None
    delivery_vessel_id: str | None = None
    target_eta: str | None = None
    priority: str
    status: str
    is_ml_recommended: bool = False
    ml_confidence: str | None = None
    recommendation_notes: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

    class Config:
        from_attributes = True


class MLResupplyGenerateRequest(BaseModel):
    station_override: str | None = Field(default=None, alias="stationOverride")
    duration_days_override: int | None = Field(default=None, ge=1, alias="durationDaysOverride")
    lead_time_days: int | None = Field(default=14, ge=0, alias="leadTimeDays")
    include_all_categories: bool = Field(default=True, alias="includeAllCategories")

    class Config:
        populate_by_name = True


class MLResupplyGenerateResponse(BaseModel):
    expedition_id: str
    expedition_name: str
    station: str
    total_inventory_items_evaluated: int
    ml_recommendations_count: int
    fallback_recommendations_count: int
    items_requiring_resupply_count: int
    recommendations: list[ResupplyItemResponse]
    execution_notes: str | None = None


# =========================================================================
# PHASE 3.4 MISSION READINESS ENGINE SCHEMAS
# =========================================================================

PillarCategory = Literal[
    "PERSONNEL",
    "PACKING",
    "CAPACITY",
    "INVENTORY",
    "ASSETS",
    "STATION",
    "SAFETY",
]
PillarStatus = Literal["PASSED", "WARNING", "FAILED"]


class ReadinessPillarResult(BaseModel):
    category: PillarCategory
    status: PillarStatus
    title: str
    summary: str
    blockers: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    details: dict[str, Any] = Field(default_factory=dict)

    class Config:
        populate_by_name = True


class MissionReadinessResponse(BaseModel):
    expedition_id: str = Field(alias="expeditionId")
    expedition_name: str = Field(alias="expeditionName")
    overall_status: Literal["READY", "NOT_READY"] = Field(alias="overallStatus")
    readiness_summary: str = Field(alias="readinessSummary")
    total_checks: int = Field(default=7, alias="totalChecks")
    passed_checks: int = Field(default=0, alias="passedChecks")
    warning_checks: int = Field(default=0, alias="warningChecks")
    failed_checks: int = Field(default=0, alias="failedChecks")
    pillars: list[ReadinessPillarResult] = Field(default_factory=list)
    evaluated_at: str | None = Field(default=None, alias="evaluatedAt")

    class Config:
        populate_by_name = True
