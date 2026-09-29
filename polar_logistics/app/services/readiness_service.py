from datetime import datetime
from typing import Any
from sqlalchemy.orm import Session

from ..models import (
    Expedition,
    Personnel,
    PackingItem,
    CargoCapacityPlan,
    Inventory,
    ResupplyItem,
    Station,
    Vessel,
    EmergencyIncident,
    Alert,
)
from ..schemas import (
    ReadinessPillarResult,
    MissionReadinessResponse,
    PillarStatus,
)
from .expedition_planner_service import get_cargo_capacity_summary


def evaluate_personnel_pillar(db: Session, expedition: Expedition) -> ReadinessPillarResult:
    """
    Evaluate Pillar 1: PERSONNEL
    Deterministic checks:
    - Assigned personnel roster exists
    - Lead / Commanding officer designated
    - 100% certified Class-1 Polar Medical clearance
    - 100% certified ITBP / Polar Survival training qualification
    """
    blockers: list[str] = []
    warnings: list[str] = []
    details: dict[str, Any] = {}

    personnel = db.query(Personnel).filter(
        Personnel.expedition_id == expedition.expedition_id
    ).all()

    details["assigned_personnel_count"] = len(personnel)
    details["target_personnel_count"] = expedition.personnel_count or 1

    if len(personnel) == 0:
        blockers.append("No personnel roster records assigned to this expedition in the database.")
        return ReadinessPillarResult(
            category="PERSONNEL",
            status="FAILED",
            title="Personnel & Command Roster",
            summary="Personnel deployment roster is empty.",
            blockers=blockers,
            warnings=warnings,
            details=details,
        )

    # 1. Lead / Commander check
    lead_name = (expedition.lead or "").strip()
    has_lead = bool(lead_name) or any(
        any(k in (p.role or "").lower() for k in ["lead", "commander", "director", "in-charge", "officer", "chief"])
        for p in personnel
    )
    details["expedition_lead"] = lead_name or "Not designated"
    details["has_command_officer"] = has_lead

    if not has_lead:
        blockers.append("No Expedition Lead or Commanding Officer designated for deployment.")

    # 2. Medical clearance check
    medical_cleared_count = 0
    medical_issues = []
    for p in personnel:
        med = (p.medical_clearance or "").strip()
        if med and not any(bad in med.lower() for bad in ["pending", "unverified", "failed", "rejected", "expired", "none", "disqualified"]):
            medical_cleared_count += 1
        else:
            medical_issues.append(f"{p.name} ({p.personnel_id}) - Status: {med or 'Not Recorded'}")

    details["medical_cleared_count"] = medical_cleared_count
    details["medical_clearance_pct"] = round((medical_cleared_count / len(personnel)) * 100.0, 1)

    if medical_issues:
        blockers.append(f"{len(medical_issues)} personnel lack certified medical clearance: {', '.join(medical_issues[:3])}{'...' if len(medical_issues) > 3 else ''}")

    # 3. Survival training qualification check
    survival_cleared_count = 0
    survival_issues = []
    for p in personnel:
        surv = (p.survival_training or "").strip()
        if surv and not any(bad in surv.lower() for bad in ["pending", "uncertified", "failed", "rejected", "none", "disqualified"]):
            survival_cleared_count += 1
        else:
            survival_issues.append(f"{p.name} ({p.personnel_id}) - Status: {surv or 'Not Recorded'}")

    details["survival_qualified_count"] = survival_cleared_count
    details["survival_qualification_pct"] = round((survival_cleared_count / len(personnel)) * 100.0, 1)

    if survival_issues:
        blockers.append(f"{len(survival_issues)} personnel lack mandatory polar survival certification: {', '.join(survival_issues[:3])}{'...' if len(survival_issues) > 3 else ''}")

    status: PillarStatus = "FAILED" if blockers else "PASSED"
    summary = (
        f"All {len(personnel)} assigned personnel verified with leadership, AIIMS medical clearance, and ITBP survival qualifications."
        if status == "PASSED"
        else f"{len(blockers)} critical personnel requirement(s) failed."
    )

    return ReadinessPillarResult(
        category="PERSONNEL",
        status=status,
        title="Personnel & Command Roster",
        summary=summary,
        blockers=blockers,
        warnings=warnings,
        details=details,
    )


def evaluate_packing_pillar(db: Session, expedition: Expedition) -> ReadinessPillarResult:
    """
    Evaluate Pillar 2: PACKING
    Deterministic checks:
    - All assigned personnel have non-empty packing manifests
    - All item unit weights and quantities are strictly > 0
    - No placeholder weights (0.0 kg)
    """
    blockers: list[str] = []
    warnings: list[str] = []
    details: dict[str, Any] = {}

    personnel = db.query(Personnel).filter(
        Personnel.expedition_id == expedition.expedition_id
    ).all()

    packing_items = db.query(PackingItem).filter(
        PackingItem.expedition_id == expedition.expedition_id
    ).all()

    details["total_packing_items"] = len(packing_items)
    personnel_ids_with_packing = {item.personnel_id for item in packing_items}
    details["personnel_with_packing_count"] = len(personnel_ids_with_packing)
    details["total_assigned_personnel"] = len(personnel)

    # 1. Missing packing manifest check
    missing_manifests = [
        f"{p.name} ({p.personnel_id})"
        for p in personnel
        if p.personnel_id not in personnel_ids_with_packing
    ]
    if missing_manifests:
        blockers.append(f"{len(missing_manifests)} assigned personnel have no registered packing manifest: {', '.join(missing_manifests[:3])}{'...' if len(missing_manifests) > 3 else ''}")

    if len(packing_items) == 0:
        blockers.append("No gear packing items registered for this campaign.")

    # 2. Invalid weight / quantity check
    invalid_weight_items = []
    for item in packing_items:
        qty = item.quantity or 0
        u_weight = float(item.unit_weight_kg or 0.0)
        t_weight = float(item.total_weight_kg or 0.0)

        if qty <= 0 or u_weight <= 0.0 or t_weight <= 0.0:
            invalid_weight_items.append(f"'{item.item_name}' ({item.personnel_name or item.personnel_id}: {qty} qty, {u_weight} kg/unit)")

    if invalid_weight_items:
        blockers.append(f"{len(invalid_weight_items)} packing item(s) have invalid zero/negative weight or quantity: {', '.join(invalid_weight_items[:2])}")

    status: PillarStatus = "FAILED" if blockers else "PASSED"
    summary = (
        f"100% packing completion verified across {len(packing_items)} items for {len(personnel)} personnel with zero placeholder weights."
        if status == "PASSED"
        else f"{len(blockers)} packing checklist requirement(s) failed."
    )

    return ReadinessPillarResult(
        category="PACKING",
        status=status,
        title="Individual Packing & Team Gear",
        summary=summary,
        blockers=blockers,
        warnings=warnings,
        details=details,
    )


def evaluate_capacity_pillar(db: Session, expedition: Expedition) -> ReadinessPillarResult:
    """
    Evaluate Pillar 3: CAPACITY
    Deterministic check:
    - (Team Personal Load + Allocated Cargo) <= Maximum Cargo Capacity
    """
    blockers: list[str] = []
    warnings: list[str] = []
    details: dict[str, Any] = {}

    summary = get_cargo_capacity_summary(db, expedition)
    max_cap = float(summary.get("maximum_capacity_kg", 2000.0))
    team_load = float(summary.get("team_personal_load_kg", 0.0))
    alloc_cargo = float(summary.get("allocated_cargo_weight_kg", 0.0))
    total_planned = float(summary.get("total_planned_weight_kg", 0.0))
    rem_cap = float(summary.get("remaining_capacity_kg", 0.0))
    over_cap = float(summary.get("over_capacity_kg", 0.0))
    util_pct = float(summary.get("capacity_utilization_pct", 0.0))
    cap_status = str(summary.get("status", "WITHIN_CAPACITY"))

    details["maximum_capacity_kg"] = max_cap
    details["team_personal_load_kg"] = team_load
    details["allocated_cargo_weight_kg"] = alloc_cargo
    details["total_planned_weight_kg"] = total_planned
    details["remaining_capacity_kg"] = rem_cap
    details["capacity_utilization_pct"] = util_pct
    details["capacity_status"] = cap_status

    if cap_status == "OVER_CAPACITY" or total_planned > max_cap:
        blockers.append(
            f"Cargo capacity exceeded: Total planned weight ({total_planned:.1f} kg) "
            f"exceeds maximum carrier limit ({max_cap:.1f} kg) by {over_cap:.1f} kg "
            f"(Utilization: {util_pct:.1f}%)."
        )

    status: PillarStatus = "FAILED" if blockers else "PASSED"
    pillar_summary = (
        f"Total load ({total_planned:.1f} kg) is within carrier limit of {max_cap:.1f} kg ({util_pct:.1f}% utilized, {rem_cap:.1f} kg headroom)."
        if status == "PASSED"
        else f"Expedition load exceeds transport capacity by {over_cap:.1f} kg."
    )

    return ReadinessPillarResult(
        category="CAPACITY",
        status=status,
        title="Cargo & Transport Capacity",
        summary=pillar_summary,
        blockers=blockers,
        warnings=warnings,
        details=details,
    )


def evaluate_inventory_pillar(db: Session, expedition: Expedition) -> ReadinessPillarResult:
    """
    Evaluate Pillar 4: INVENTORY
    Deterministic checks:
    - Critical consumable deficits at target station (Fuel, Water, Provisions, Medical)
    - Distinguish unmitigated deficits (FAILED) vs approved resupply plans (PASSED/WARNING)
    """
    blockers: list[str] = []
    warnings: list[str] = []
    details: dict[str, Any] = {}

    station_name = (expedition.station or "Maitri").strip()
    all_inventory = db.query(Inventory).all()
    
    target_inventory: list[Inventory] = []
    for inv in all_inventory:
        loc = (inv.location or "").lower()
        if any(part.strip().lower() in loc for part in station_name.split("&")):
            target_inventory.append(inv)
    if not target_inventory:
        target_inventory = all_inventory

    # Query approved resupply items for this expedition
    resupply_items = db.query(ResupplyItem).filter(
        ResupplyItem.expedition_id == expedition.expedition_id
    ).all()
    
    approved_resupply_map = {
        item.inventory_id: item
        for item in resupply_items
        if item.status in ["APPROVED", "IN_TRANSIT", "DELIVERED"] and item.inventory_id is not None
    }
    approved_resupply_by_name = {
        item.item_name.lower(): item
        for item in resupply_items
        if item.status in ["APPROVED", "IN_TRANSIT", "DELIVERED"]
    }

    critical_categories = ["fuel & energy", "water & life support", "provisions & rations", "medical supplies"]
    critical_stockouts = []
    low_stock_unapproved = []
    mitigated_items = []

    for inv in target_inventory:
        curr = float(inv.quantity or 0.0)
        min_stock = float(inv.minimum_stock or 0.0)
        cat = (inv.category or "").strip().lower()
        is_critical = any(c in cat for c in critical_categories)

        if curr < min_stock:
            # Check if covered by approved resupply
            approved = approved_resupply_map.get(inv.id) or approved_resupply_by_name.get(inv.item_name.lower())
            if approved and float(approved.resupply_quantity or 0.0) > 0:
                mitigated_items.append(f"{inv.item_name} ({curr}/{min_stock} {inv.unit} — Approved Resupply: +{approved.resupply_quantity} {approved.unit})")
            else:
                if curr <= 0 and is_critical:
                    critical_stockouts.append(f"{inv.item_name} (Stock: 0 {inv.unit or 'units'}, Minimum: {min_stock})")
                elif is_critical or curr <= 0:
                    low_stock_unapproved.append(f"{inv.item_name} ({curr}/{min_stock} {inv.unit or 'units'})")
                else:
                    warnings.append(f"Non-critical item below threshold: {inv.item_name} ({curr}/{min_stock} {inv.unit or 'units'}).")

    details["evaluated_inventory_items"] = len(target_inventory)
    details["mitigated_shortages_count"] = len(mitigated_items)
    details["critical_stockouts_count"] = len(critical_stockouts)
    details["low_stock_unapproved_count"] = len(low_stock_unapproved)

    if critical_stockouts:
        blockers.append(f"Critical consumable stockout with no approved resupply: {', '.join(critical_stockouts)}")

    if low_stock_unapproved:
        warnings.append(f"Low stock items without approved resupply: {', '.join(low_stock_unapproved[:3])}")

    status: PillarStatus = "FAILED" if blockers else ("WARNING" if warnings else "PASSED")
    summary = (
        f"Station inventory is fully supplied or deficits are mitigated by approved resupply plans."
        if status == "PASSED"
        else (f"Inventory warnings detected: {len(warnings)} pending supply item(s)." if status == "WARNING" else f"Critical inventory deficit: {len(blockers)} unmitigated stockout(s).")
    )

    return ReadinessPillarResult(
        category="INVENTORY",
        status=status,
        title="Station Inventory & Consumables",
        summary=summary,
        blockers=blockers,
        warnings=warnings,
        details=details,
    )


def evaluate_assets_pillar(db: Session, expedition: Expedition) -> ReadinessPillarResult:
    """
    Evaluate Pillar 5: ASSETS (VESSEL)
    Deterministic checks:
    - Primary transport vessel registered
    - Operational status (not disabled/maintenance/drydock)
    - Ice-class suitability
    - Weather safety status (not DANGER/SEVERE_BLIZZARD)
    """
    blockers: list[str] = []
    warnings: list[str] = []
    details: dict[str, Any] = {}

    vessel_name = (expedition.primary_vessel or "").strip()
    vessel = None

    if vessel_name:
        # Search by name match
        vessel = db.query(Vessel).filter(Vessel.name.ilike(f"%{vessel_name[:15]}%")).first()

    if not vessel:
        vessel = db.query(Vessel).filter(Vessel.expedition_id == expedition.expedition_id).first()

    if not vessel:
        blockers.append("Cannot verify — required vessel data unavailable: No primary transport vessel registered for this campaign.")
        return ReadinessPillarResult(
            category="ASSETS",
            status="FAILED",
            title="Transport Vessels & Carriers",
            summary="Primary carrier vessel data unavailable in master database.",
            blockers=blockers,
            warnings=warnings,
            details={"vessel_name": vessel_name or "Not Specified"},
        )

    details["vessel_name"] = vessel.name
    details["vessel_type"] = vessel.vessel_type
    details["vessel_status"] = vessel.status
    details["ice_class"] = vessel.ice_class
    details["weather_status"] = vessel.weather_status

    # 1. Operational status check
    v_status = (vessel.status or "").lower()
    if any(bad in v_status for bad in ["disabled", "maintenance", "drydock", "decommissioned", "damaged"]):
        blockers.append(f"Primary vessel '{vessel.name}' is non-operational (Status: {vessel.status}).")

    # 2. Weather status check
    w_status = (vessel.weather_status or "").upper()
    if w_status in ["DANGER", "SEVERE_BLIZZARD", "CYCLONE", "HAZARDOUS"]:
        blockers.append(f"Primary vessel '{vessel.name}' reports hazardous transit weather status: {w_status}.")
    elif w_status in ["CAUTION", "ADVISORY"]:
        warnings.append(f"Primary vessel '{vessel.name}' transit weather status advisory: {w_status}.")

    # 3. Polar ice class suitability check
    ice_class = (vessel.ice_class or "").lower()
    if not ice_class or any(non_ice in ice_class for non_ice in ["unclassified", "non-ice", "unspecified"]):
        warnings.append(f"Vessel '{vessel.name}' has uncertified polar ice class rating ({vessel.ice_class or 'Unspecified'}).")

    status: PillarStatus = "FAILED" if blockers else ("WARNING" if warnings else "PASSED")
    summary = (
        f"Primary carrier '{vessel.name}' verified operational ({vessel.status}), polar ice-class certified, and clear for transit."
        if status == "PASSED"
        else (f"Vessel advisory: {warnings[0]}" if status == "WARNING" else f"Vessel blocker: {blockers[0]}")
    )

    return ReadinessPillarResult(
        category="ASSETS",
        status=status,
        title="Transport Vessels & Carriers",
        summary=summary,
        blockers=blockers,
        warnings=warnings,
        details=details,
    )


def evaluate_station_pillar(db: Session, expedition: Expedition) -> ReadinessPillarResult:
    """
    Evaluate Pillar 6: STATION
    Deterministic checks:
    - Target research station exists and is Operational
    - Station has available capacity headroom for expedition personnel
    """
    blockers: list[str] = []
    warnings: list[str] = []
    details: dict[str, Any] = {}

    station_name = (expedition.station or "").strip()
    station = None

    if station_name:
        parts = [p.strip() for p in station_name.split("&") if p.strip()]
        for p in parts:
            stn_match = db.query(Station).filter(
                (Station.name.ilike(f"%{p}%")) | (Station.station_id.ilike(f"%{p}%"))
            ).first()
            if stn_match:
                station = stn_match
                break

    if not station:
        blockers.append(f"Cannot verify — target research station '{station_name or 'Unspecified'}' is not registered in operational master database.")
        return ReadinessPillarResult(
            category="STATION",
            status="FAILED",
            title="Target Research Base",
            summary="Target research station not found in operational database.",
            blockers=blockers,
            warnings=warnings,
            details={"requested_station": station_name},
        )

    details["station_id"] = station.station_id
    details["station_name"] = station.name
    details["station_status"] = station.status
    details["max_capacity"] = station.capacity or 25
    details["current_occupancy"] = station.current_occupancy or 0
    details["expedition_personnel"] = expedition.personnel_count or 1

    # 1. Operational status
    if (station.status or "").lower() not in ["operational", "active"]:
        blockers.append(f"Target station '{station.name}' is not in operational status (Status: {station.status}).")

    # 2. Capacity headroom
    capacity = station.capacity or 25
    occupancy = station.current_occupancy or 0
    needed = expedition.personnel_count or 1

    if occupancy >= capacity:
        blockers.append(f"Target station '{station.name}' is already at full capacity ({occupancy}/{capacity} beds occupied).")
    elif (occupancy + needed) > capacity:
        blockers.append(
            f"Station capacity exceeded: Current occupancy ({occupancy}) + expedition team ({needed}) = "
            f"{occupancy + needed} exceeds base maximum capacity ({capacity})."
        )
    elif (occupancy + needed) >= (capacity * 0.95):
        warnings.append(f"Station near capacity threshold: {occupancy + needed}/{capacity} beds will be allocated ({round((occupancy + needed)/capacity * 100)}%).")

    status: PillarStatus = "FAILED" if blockers else ("WARNING" if warnings else "PASSED")
    summary = (
        f"Station '{station.name}' verified operational with sufficient capacity accommodation."
        if status == "PASSED"
        else (f"Station advisory: {warnings[0]}" if status == "WARNING" else f"Station capacity/status blocker: {blockers[0]}")
    )

    return ReadinessPillarResult(
        category="STATION",
        status=status,
        title="Target Research Base",
        summary=summary,
        blockers=blockers,
        warnings=warnings,
        details=details,
    )


def evaluate_safety_pillar(db: Session, expedition: Expedition) -> ReadinessPillarResult:
    """
    Evaluate Pillar 7: SAFETY
    Deterministic checks:
    - 0 unresolved Critical / High severity emergency incidents
    - 0 unacknowledged Critical alerts
    """
    blockers: list[str] = []
    warnings: list[str] = []
    details: dict[str, Any] = {}

    station_name = (expedition.station or "").strip()
    
    # Query emergency incidents
    incidents = db.query(EmergencyIncident).all()
    active_incidents = [
        inc for inc in incidents
        if (inc.status or "").lower() in ["reported", "in progress", "investigating", "escalated", "active"]
        and (
            (inc.expedition_id and inc.expedition_id == expedition.expedition_id)
            or (inc.station_id and any(part.strip().lower() in inc.station_id.lower() for part in station_name.split("&")))
            or (inc.location and any(part.strip().lower() in inc.location.lower() for part in station_name.split("&")))
        )
    ]

    details["active_incidents_count"] = len(active_incidents)

    for inc in active_incidents:
        sev = (inc.severity or "").lower()
        if sev in ["critical", "high"]:
            blockers.append(f"Active {inc.severity} emergency incident #{inc.incident_id}: '{inc.title}' (Status: {inc.status}).")
        else:
            warnings.append(f"Active {inc.severity} incident #{inc.incident_id}: '{inc.title}'.")

    # Query alerts matching station or expedition context
    alerts = db.query(Alert).all()
    station_parts = [p.strip().lower() for p in station_name.split("&") if p.strip()]

    unack_critical_alerts = [
        alt for alt in alerts
        if (alt.status or "").lower() in ["new", "active", "unacknowledged"]
        and (alt.severity or "").lower() == "critical"
        and (
            any(part in (alt.related_entity or "").lower() for part in station_parts)
            or any(part in (alt.message or "").lower() for part in station_parts)
            or (alt.related_entity_route and expedition.expedition_id.lower() in alt.related_entity_route.lower())
            or (alt.related_entity and expedition.expedition_id.lower() in alt.related_entity.lower())
        )
    ]

    details["unacknowledged_critical_alerts_count"] = len(unack_critical_alerts)

    for alt in unack_critical_alerts:
        blockers.append(f"Unacknowledged Critical alert #{alt.alert_id}: '{alt.message}'.")

    status: PillarStatus = "FAILED" if blockers else ("WARNING" if warnings else "PASSED")
    summary = (
        "0 active critical emergency incidents and 0 unacknowledged critical alerts."
        if status == "PASSED"
        else (f"Safety advisory: {warnings[0]}" if status == "WARNING" else f"Safety blocker: {blockers[0]}")
    )

    return ReadinessPillarResult(
        category="SAFETY",
        status=status,
        title="Safety, Incidents & Alerts",
        summary=summary,
        blockers=blockers,
        warnings=warnings,
        details=details,
    )


def audit_mission_readiness(db: Session, expedition: Expedition) -> MissionReadinessResponse:
    """
    Execute deterministic Mission Readiness Audit across all 7 operational pillars.
    Zero database mutations performed.
    """
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    pillars: list[ReadinessPillarResult] = [
        evaluate_personnel_pillar(db, expedition),
        evaluate_packing_pillar(db, expedition),
        evaluate_capacity_pillar(db, expedition),
        evaluate_inventory_pillar(db, expedition),
        evaluate_assets_pillar(db, expedition),
        evaluate_station_pillar(db, expedition),
        evaluate_safety_pillar(db, expedition),
    ]

    passed_count = sum(1 for p in pillars if p.status == "PASSED")
    warning_count = sum(1 for p in pillars if p.status == "WARNING")
    failed_count = sum(1 for p in pillars if p.status == "FAILED")
    total_blockers = sum(len(p.blockers) for p in pillars)

    overall_status: str = "READY" if (failed_count == 0 and total_blockers == 0) else "NOT_READY"

    if overall_status == "READY":
        summary_text = f"Expedition cleared: All 7 mission readiness pillars passed successfully ({passed_count} Passed, {warning_count} Warnings, 0 Blockers)."
    else:
        summary_text = f"Expedition deployment on hold: {failed_count} pillar(s) failed with {total_blockers} critical operational blocker(s)."

    return MissionReadinessResponse(
        expedition_id=expedition.expedition_id,
        expedition_name=expedition.name,
        overall_status=overall_status,
        readiness_summary=summary_text,
        total_checks=len(pillars),
        passed_checks=passed_count,
        warning_checks=warning_count,
        failed_checks=failed_count,
        pillars=pillars,
        evaluated_at=now_str,
    )
