import json
import math
from datetime import datetime, timezone
from typing import Any, Tuple

from sqlalchemy.orm import Session

from ..models import Expedition, ExpeditionPlan, Station, Vessel
from ..auth import AuthenticatedUser


EARTH_RADIUS_KM = 6371.0


def validate_coordinates(lat: Any, lon: Any) -> bool:
    """
    Validate that latitude and longitude are numbers within valid Earth geographic bounds:
    -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0
    """
    if lat is None or lon is None:
        return False
    try:
        lat_f = float(lat)
        lon_f = float(lon)
        if math.isnan(lat_f) or math.isnan(lon_f) or math.isinf(lat_f) or math.isinf(lon_f):
            return False
        return -90.0 <= lat_f <= 90.0 and -180.0 <= lon_f <= 180.0
    except (ValueError, TypeError):
        return False


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compute geographic distance between two coordinate pairs using the Haversine formula.
    Returns distance in kilometers rounded to 2 decimal places.
    """
    if not validate_coordinates(lat1, lon1) or not validate_coordinates(lat2, lon2):
        return 0.0

    lat1_f = float(lat1)
    lon1_f = float(lon1)
    lat2_f = float(lat2)
    lon2_f = float(lon2)

    if lat1_f == lat2_f and lon1_f == lon2_f:
        return 0.0

    phi1 = math.radians(lat1_f)
    phi2 = math.radians(lat2_f)
    delta_phi = math.radians(lat2_f - lat1_f)
    delta_lambda = math.radians(lon2_f - lon1_f)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    a = max(0.0, min(1.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = EARTH_RADIUS_KM * c
    return round(distance, 2)


def calculate_route_total_distance(waypoints: list[dict[str, Any]]) -> float:
    """
    Calculate the sum of Haversine segment distances along an ordered sequence of waypoints.
    """
    if not waypoints or len(waypoints) < 2:
        return 0.0

    total_km = 0.0
    for i in range(len(waypoints) - 1):
        p1 = waypoints[i]
        p2 = waypoints[i + 1]
        if validate_coordinates(p1.get("latitude"), p1.get("longitude")) and validate_coordinates(
            p2.get("latitude"), p2.get("longitude")
        ):
            seg_dist = haversine_distance_km(
                float(p1["latitude"]),
                float(p1["longitude"]),
                float(p2["latitude"]),
                float(p2["longitude"]),
            )
            total_km += seg_dist

    return round(total_km, 2)


def calculate_progress_along_route(
    waypoints: list[dict[str, Any]],
    current_location: dict[str, Any] | None,
    current_phase: str,
) -> Tuple[float, float, float, list[dict[str, Any]]]:
    """
    Deterministically computes (distance_traveled_km, remaining_distance_km, progress_percent, updated_waypoints).
    """
    norm_phase = current_phase.strip().upper() if current_phase else "PLANNING"
    total_distance_km = calculate_route_total_distance(waypoints)

    if total_distance_km <= 0.0 or not waypoints:
        return 0.0, 0.0, 0.0, waypoints

    # Complete or concluded phase
    if norm_phase in ["COMPLETED", "CONCLUDED"]:
        updated_wps = []
        for wp in waypoints:
            copy_wp = dict(wp)
            copy_wp["passed"] = True
            updated_wps.append(copy_wp)
        return total_distance_km, 0.0, 100.0, updated_wps

    # Planning or preparation phase
    if norm_phase in ["PLANNING", "PREPARATION", "ON_HOLD"]:
        updated_wps = []
        for wp in waypoints:
            copy_wp = dict(wp)
            copy_wp["passed"] = False
            updated_wps.append(copy_wp)
        return 0.0, total_distance_km, 0.0, updated_wps

    # Arrived or Active at destination station
    if norm_phase in ["ARRIVED", "ACTIVE"]:
        updated_wps = []
        for wp in waypoints:
            copy_wp = dict(wp)
            copy_wp["passed"] = True
            updated_wps.append(copy_wp)
        return total_distance_km, 0.0, 100.0, updated_wps

    # In Transit / Departed / Returning
    # Evaluate progress based on waypoints and current location
    has_curr_coords = current_location and validate_coordinates(
        current_location.get("latitude"), current_location.get("longitude")
    )

    if not has_curr_coords:
        # Without current coordinates, default to initial departure baseline
        updated_wps = []
        for idx, wp in enumerate(waypoints):
            copy_wp = dict(wp)
            copy_wp["passed"] = (idx == 0)
            updated_wps.append(copy_wp)
        return 0.0, total_distance_km, 0.0, updated_wps

    curr_lat = float(current_location["latitude"])
    curr_lon = float(current_location["longitude"])

    # Compute segment distances
    segment_distances = []
    for i in range(len(waypoints) - 1):
        p1 = waypoints[i]
        p2 = waypoints[i + 1]
        d = haversine_distance_km(
            float(p1["latitude"]),
            float(p1["longitude"]),
            float(p2["latitude"]),
            float(p2["longitude"]),
        )
        segment_distances.append(d)

    # Find closest segment and compute distance traveled
    best_segment_idx = 0
    min_deviation = float("inf")

    for i in range(len(segment_distances)):
        p1 = waypoints[i]
        p2 = waypoints[i + 1]
        s_dist = segment_distances[i]

        d_to_curr = haversine_distance_km(float(p1["latitude"]), float(p1["longitude"]), curr_lat, curr_lon)
        d_from_curr = haversine_distance_km(curr_lat, curr_lon, float(p2["latitude"]), float(p2["longitude"]))

        # Triangular deviation: (d(A, P) + d(P, B)) - d(A, B)
        deviation = (d_to_curr + d_from_curr) - s_dist
        if deviation < min_deviation:
            min_deviation = deviation
            best_segment_idx = i

    # Sum distances of all segments prior to the active segment
    dist_before_active = sum(segment_distances[:best_segment_idx])
    p_start_active = waypoints[best_segment_idx]
    dist_in_active = haversine_distance_km(
        float(p_start_active["latitude"]),
        float(p_start_active["longitude"]),
        curr_lat,
        curr_lon,
    )

    traveled_km = min(total_distance_km, dist_before_active + dist_in_active)
    traveled_km = max(0.0, round(traveled_km, 2))
    remaining_km = max(0.0, round(total_distance_km - traveled_km, 2))
    progress_pct = round((traveled_km / total_distance_km) * 100.0, 1) if total_distance_km > 0 else 0.0

    # Mark passed waypoints
    updated_wps = []
    for idx, wp in enumerate(waypoints):
        copy_wp = dict(wp)
        if idx <= best_segment_idx:
            copy_wp["passed"] = True
        else:
            # If current location is very close (< 25km) to waypoint idx, consider it passed
            wp_lat = float(wp["latitude"])
            wp_lon = float(wp["longitude"])
            if haversine_distance_km(curr_lat, curr_lon, wp_lat, wp_lon) <= 25.0:
                copy_wp["passed"] = True
            else:
                copy_wp["passed"] = False
        updated_wps.append(copy_wp)

    return traveled_km, remaining_km, progress_pct, updated_wps


def format_lat_lon(lat: float | None, lon: float | None) -> str | None:
    """Format decimal degrees into human-readable geographic coordinate string."""
    if lat is None or lon is None:
        return None
    lat_f = float(lat)
    lon_f = float(lon)
    lat_card = "N" if lat_f >= 0 else "S"
    lon_card = "E" if lon_f >= 0 else "W"
    return f"{abs(lat_f):.4f}° {lat_card}, {abs(lon_f):.4f}° {lon_card}"


def get_station_by_name_or_id(db: Session, identifier: str) -> Station | None:
    """Helper to find a station by name or station_id substring."""
    if not identifier:
        return None
    clean = identifier.strip().lower()
    stations = db.query(Station).all()
    for st in stations:
        if st.station_id.lower() in clean or clean in st.station_id.lower():
            return st
        if st.name.lower() in clean or clean in st.name.lower():
            return st
    return None


def calculate_deterministic_eta(
    remaining_distance_km: float,
    speed_knots: float | None,
    explicit_eta: str | None = None,
) -> Tuple[str | None, str | None]:
    """
    Calculate deterministic ETA based on remaining distance and cruise speed.
    Returns (eta_display, eta_breakdown).
    """
    if speed_knots and float(speed_knots) > 0.0 and remaining_distance_km > 0.0:
        speed_kmh = float(speed_knots) * 1.852
        hours_needed = remaining_distance_km / speed_kmh
        days = int(hours_needed // 24)
        hours = int(round(hours_needed % 24))

        if days > 0:
            breakdown = f"{days}d {hours}h transit required at {float(speed_knots):.1f} knots ({speed_kmh:.1f} km/h)"
        else:
            breakdown = f"{hours}h transit required at {float(speed_knots):.1f} knots ({speed_kmh:.1f} km/h)"

        display_eta = explicit_eta if explicit_eta else f"Estimated {days}d {hours}h"
        return display_eta, breakdown

    if explicit_eta:
        return explicit_eta, "Scheduled arrival date recorded in vessel logbook"

    return None, None


def get_expedition_mission_progress(db: Session, expedition: Expedition) -> dict[str, Any]:
    """
    Read-only deterministic mission progress and route tracking evaluation.
    Zero database mutations.
    """
    notes: list[str] = []

    # 1. Normalize current phase
    raw_status = (expedition.status or "Planning").strip()
    status_upper = raw_status.upper()

    phase_map = {
        "PLANNING": "PLANNING",
        "PREPARATION": "PREPARATION",
        "DEPARTED": "DEPARTED",
        "IN TRANSIT": "IN_TRANSIT",
        "IN_TRANSIT": "IN_TRANSIT",
        "ARRIVED": "ARRIVED",
        "ACTIVE": "ACTIVE",
        "RETURNING": "RETURNING",
        "COMPLETED": "COMPLETED",
        "CONCLUDED": "COMPLETED",
        "ON HOLD": "ON_HOLD",
        "ON_HOLD": "ON_HOLD",
    }
    current_phase = phase_map.get(status_upper, "PLANNING")

    # 2. Lookup primary vessel
    vessel = db.query(Vessel).filter(Vessel.expedition_id == expedition.expedition_id).first()
    if not vessel and expedition.primary_vessel and expedition.primary_vessel.strip():
        vessel = db.query(Vessel).filter(Vessel.name.ilike(f"%{expedition.primary_vessel.strip()}%")).first()

    # 3. Lookup destination station
    dest_station = get_station_by_name_or_id(db, expedition.station)

    # 4. Extract Route & Waypoints
    waypoints: list[dict[str, Any]] = []
    origin_name = "Cape Town Staging Port"
    origin_lat: float | None = -33.9249
    origin_lon: float | None = 18.4241

    dest_name = expedition.station or "Antarctic Station"
    dest_lat: float | None = None
    dest_lon: float | None = None

    if dest_station and validate_coordinates(dest_station.latitude, dest_station.longitude):
        dest_lat = float(dest_station.latitude)
        dest_lon = float(dest_station.longitude)
        dest_name = dest_station.name

    # Check for Arctic expedition destination (e.g. Himadri in Svalbard)
    if "himadri" in (expedition.station or "").lower() or "arctic" in (expedition.name or "").lower():
        origin_name = "Longyearbyen Port Depot"
        origin_lat = 78.2232
        origin_lon = 15.6267
        if not dest_lat:
            dest_lat = 78.9234
            dest_lon = 11.9286
            dest_name = "Himadri Research Station, Ny-Ålesund"

    # Route extraction from Vessel
    if vessel and vessel.route_points:
        try:
            raw_pts = json.loads(vessel.route_points)
            if isinstance(raw_pts, list) and len(raw_pts) > 0:
                for idx, pt in enumerate(raw_pts):
                    pt_lat = pt.get("lat") or pt.get("latitude")
                    pt_lon = pt.get("lng") or pt.get("lon") or pt.get("longitude")
                    if validate_coordinates(pt_lat, pt_lon):
                        wp_name = (
                            origin_name
                            if idx == 0
                            else (dest_name if idx == len(raw_pts) - 1 else f"Polar Transit Waypoint #{idx + 1}")
                        )
                        waypoints.append(
                            {
                                "name": wp_name,
                                "latitude": float(pt_lat),
                                "longitude": float(pt_lon),
                                "order": idx + 1,
                                "passed": False,
                                "estimated_arrival": None,
                            }
                        )
        except Exception:
            notes.append("Vessel route points JSON could not be parsed; deriving fallback route.")

    # Fallback waypoint generation if no route_points
    if not waypoints:
        if origin_lat is not None and origin_lon is not None and dest_lat is not None and dest_lon is not None:
            waypoints = [
                {
                    "name": origin_name,
                    "latitude": origin_lat,
                    "longitude": origin_lon,
                    "order": 1,
                    "passed": False,
                    "estimated_arrival": None,
                },
                {
                    "name": dest_name,
                    "latitude": dest_lat,
                    "longitude": dest_lon,
                    "order": 2,
                    "passed": False,
                    "estimated_arrival": None,
                },
            ]
        else:
            notes.append("Complete origin and destination coordinate pairs unavailable for route calculation.")

    # 5. Extract Current Location
    curr_lat: float | None = None
    curr_lon: float | None = None
    curr_loc_name: str | None = None
    telemetry_is_live = False

    if vessel and validate_coordinates(vessel.latitude, vessel.longitude):
        curr_lat = float(vessel.latitude)
        curr_lon = float(vessel.longitude)
        curr_loc_name = f"{vessel.name} Position ({format_lat_lon(curr_lat, curr_lon)})"
        telemetry_is_live = bool(vessel.is_live_gps)
    elif current_phase in ["ARRIVED", "ACTIVE", "COMPLETED"] and dest_lat is not None:
        curr_lat = dest_lat
        curr_lon = dest_lon
        curr_loc_name = f"Stationary at {dest_name}"
    elif current_phase in ["PLANNING", "PREPARATION"] and origin_lat is not None:
        curr_lat = origin_lat
        curr_lon = origin_lon
        curr_loc_name = f"Staged at {origin_name}"

    current_location_dict = (
        {
            "name": curr_loc_name,
            "latitude": curr_lat,
            "longitude": curr_lon,
            "formatted_coordinates": format_lat_lon(curr_lat, curr_lon),
        }
        if curr_lat is not None and curr_lon is not None
        else None
    )

    # 6. Telemetry Source Identification
    if telemetry_is_live:
        telemetry_source = "LIVE_GPS"
        telemetry_label = "Live Marine GPS Telemetry Feed"
    elif current_location_dict is not None:
        telemetry_source = "PROTOTYPE_SIMULATED"
        telemetry_label = "Prototype / Simulated Telemetry"
    else:
        telemetry_source = "LOCATION_UNAVAILABLE"
        telemetry_label = "Location Data Unavailable"
        notes.append("No active telemetry feed or location fix available.")

    # 7. Compute Distance and Progress
    traveled_km, remaining_km, progress_pct, updated_waypoints = calculate_progress_along_route(
        waypoints, current_location_dict, current_phase
    )
    total_km = calculate_route_total_distance(updated_waypoints)

    # 8. Deterministic ETA
    speed_knots = float(vessel.speed_knots) if (vessel and vessel.speed_knots is not None) else None
    explicit_eta = vessel.eta if (vessel and vessel.eta) else None
    display_eta, eta_breakdown = calculate_deterministic_eta(remaining_km, speed_knots, explicit_eta)

    return {
        "expeditionId": expedition.expedition_id,
        "expeditionName": expedition.name,
        "currentPhase": current_phase,
        "status": raw_status,
        "origin": {
            "name": origin_name,
            "latitude": origin_lat,
            "longitude": origin_lon,
            "formatted_coordinates": format_lat_lon(origin_lat, origin_lon),
        },
        "destination": {
            "name": dest_name,
            "latitude": dest_lat,
            "longitude": dest_lon,
            "formatted_coordinates": format_lat_lon(dest_lat, dest_lon),
        },
        "currentLocation": current_location_dict,
        "waypoints": updated_waypoints,
        "totalDistanceKm": total_km,
        "distanceTraveledKm": traveled_km,
        "remainingDistanceKm": remaining_km,
        "progressPercent": progress_pct,
        "telemetrySource": telemetry_source,
        "telemetryLabel": telemetry_label,
        "telemetryIsLive": telemetry_is_live,
        "heading": vessel.heading if vessel else None,
        "speedKnots": speed_knots,
        "eta": display_eta,
        "etaBreakdown": eta_breakdown,
        "vesselName": vessel.name if vessel else (expedition.primary_vessel or "Unassigned"),
        "lastKnownTimestamp": vessel.last_known_timestamp if vessel else None,
        "notes": notes,
    }


def update_expedition_mission_phase(
    db: Session,
    expedition: Expedition,
    new_phase: str,
    user: AuthenticatedUser,
    notes: str | None = None,
) -> dict[str, Any]:
    """
    Controlled manual update of expedition mission phase.
    Persists phase to Expedition.status and ExpeditionPlan.planning_status.
    """
    valid_phases = {
        "PLANNING": "Planning",
        "PREPARATION": "Preparation",
        "DEPARTED": "Departed",
        "IN_TRANSIT": "In Transit",
        "ARRIVED": "Arrived",
        "ACTIVE": "Active",
        "RETURNING": "Returning",
        "COMPLETED": "Completed",
        "ON_HOLD": "On Hold",
    }

    norm_phase = new_phase.strip().upper()
    if norm_phase not in valid_phases:
        raise ValueError(f"Invalid mission phase '{new_phase}'. Valid phases: {list(valid_phases.keys())}")

    db_status_value = valid_phases[norm_phase]
    expedition.status = db_status_value
    if notes:
        timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        append_note = f"\n[{timestamp_str} - {user.name} ({user.role})]: Phase updated to {db_status_value}. {notes}"
        expedition.notes = (expedition.notes or "") + append_note

    # Also update associated plan if present using canonical planning status
    plan = db.query(ExpeditionPlan).filter(ExpeditionPlan.expedition_id == expedition.expedition_id).first()
    if plan:
        plan_status_map = {
            "PLANNING": "PLANNING",
            "PREPARATION": "PLANNING",
            "ON_HOLD": "PLANNING",
            "DEPARTED": "ACTIVE",
            "IN_TRANSIT": "ACTIVE",
            "ARRIVED": "ACTIVE",
            "ACTIVE": "ACTIVE",
            "RETURNING": "ACTIVE",
            "COMPLETED": "COMPLETED",
        }
        plan.planning_status = plan_status_map.get(norm_phase, "ACTIVE")

    db.commit()
    db.refresh(expedition)

    return get_expedition_mission_progress(db, expedition)
