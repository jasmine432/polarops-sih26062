"""
Phase 3.5 Mission Progress & Route Tracking Test Suite
PolarOps Polar Logistics Platform

Tests at minimum:
1. Invalid expedition -> 404
2. Valid expedition -> progress response
3. Coordinate validation
4. Haversine calculation using known coordinate pairs
5. Total route distance
6. Remaining distance
7. Progress percentage
8. Zero-distance route
9. Missing coordinates handled safely
10. No fabricated GPS data
11. Correct telemetry source labeling
12. Phase update authentication/RBAC
13. Progress calculation does not unexpectedly mutate DB
14. Existing Phase 1 regression
15. Existing Phase 2 regression
16. Existing Phase 3.1-3.4 regression
"""

import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
POLAR_DIR = PROJECT_ROOT / "polar_logistics"
if str(POLAR_DIR) not in sys.path:
    sys.path.insert(0, str(POLAR_DIR))

from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from polar_logistics.app.main import app
from polar_logistics.app.database import engine
from polar_logistics.app.models import (
    Expedition,
    Station,
    Vessel,
    Inventory,
    Cargo,
    Personnel,
)
from polar_logistics.app.services.tracking_service import (
    validate_coordinates,
    haversine_distance_km,
    calculate_route_total_distance,
    calculate_progress_along_route,
    calculate_deterministic_eta,
)

ADMIN_CREDS = {"identifier": "r.sharma@ncpor.gov.in", "password": "PolarOps2026!"}
DOCTOR_CREDS = {"identifier": "v.menon@maitri.aq", "password": "PolarOps2026!"}

SessionLocal = sessionmaker(bind=engine)


def get_token(creds, client=None):
    if client is None:
        client = TestClient(app)
    resp = client.post("/auth/login", json=creds)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def test_unit_calculations():
    # 1. Coordinate validation
    assert validate_coordinates(0.0, 0.0) is True
    assert validate_coordinates(-90.0, -180.0) is True
    assert validate_coordinates(90.0, 180.0) is True
    assert validate_coordinates(-70.7658, 11.7358) is True
    assert validate_coordinates("-56.45", "42.18") is True
    assert validate_coordinates(91.0, 0.0) is False
    assert validate_coordinates(-90.1, 0.0) is False
    assert validate_coordinates(0.0, 180.1) is False
    assert validate_coordinates(None, 10.0) is False
    assert validate_coordinates("invalid", 10.0) is False
    print("[PASS] 1. Coordinate validation boundaries verified")

    # 2. Haversine distance calculations
    assert haversine_distance_km(10.0, 20.0, 10.0, 20.0) == 0.0
    eq_dist = haversine_distance_km(0.0, 0.0, 0.0, 90.0)
    assert abs(eq_dist - 10007.54) < 10.0
    ct_maitri = haversine_distance_km(-33.9249, 18.4241, -70.7658, 11.7358)
    assert 4000.0 < ct_maitri < 4300.0
    assert haversine_distance_km(95.0, 0.0, 0.0, 0.0) == 0.0
    print("[PASS] 2. Haversine distance calculations verified against known geographic pairs")

    # 3. Route total distance
    waypoints = [
        {"latitude": -33.9249, "longitude": 18.4241},
        {"latitude": -56.45, "longitude": 42.18},
        {"latitude": -70.7658, "longitude": 11.7358},
    ]
    seg1 = haversine_distance_km(-33.9249, 18.4241, -56.45, 42.18)
    seg2 = haversine_distance_km(-56.45, 42.18, -70.7658, 11.7358)
    expected_total = round(seg1 + seg2, 2)
    calc_total = calculate_route_total_distance(waypoints)
    assert calc_total == expected_total
    print(f"[PASS] 3. Route total distance computation verified ({calc_total} km)")

    # 4. Zero distance & empty routes
    assert calculate_route_total_distance([]) == 0.0
    t, r, p, _ = calculate_progress_along_route([], None, "IN_TRANSIT")
    assert t == 0.0 and r == 0.0 and p == 0.0
    single = [{"latitude": -70.7658, "longitude": 11.7358}]
    assert calculate_route_total_distance(single) == 0.0
    t, r, p, _ = calculate_progress_along_route(single, None, "IN_TRANSIT")
    assert t == 0.0 and r == 0.0 and p == 0.0
    print("[PASS] 4. Zero-distance and empty route boundary conditions handled gracefully")

    # 5. Progress percentages and phases
    total_km = calculate_route_total_distance(waypoints)
    t, r, p, _ = calculate_progress_along_route(waypoints, None, "PLANNING")
    assert t == 0.0 and r == total_km and p == 0.0
    t, r, p, _ = calculate_progress_along_route(waypoints, None, "COMPLETED")
    assert t == total_km and r == 0.0 and p == 100.0

    curr = {"latitude": -56.45, "longitude": 42.18}
    t, r, p, wps = calculate_progress_along_route(waypoints, curr, "IN_TRANSIT")
    assert 0.0 < t < total_km
    assert round(t + r, 1) == round(total_km, 1)
    assert 0.0 < p < 100.0
    assert wps[0]["passed"] is True
    print(f"[PASS] 5. Mission phases and intermediate progress percentages verified ({p}% progress)")

    # 6. ETA calculation
    disp, breakdown = calculate_deterministic_eta(1852.0, 10.0, "14 Feb 2027")
    assert disp == "14 Feb 2027"
    assert "4d 4h" in breakdown
    disp, _ = calculate_deterministic_eta(1000.0, 0.0, "20 Feb 2027")
    assert disp == "20 Feb 2027"
    print("[PASS] 6. Deterministic ETA and transit duration verified")


def test_api_integration():
    client = TestClient(app)
    admin_token = get_token(ADMIN_CREDS, client)
    doctor_token = get_token(DOCTOR_CREDS, client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}

    # 1. Invalid expedition returns 404
    res = client.get("/expeditions/NONEXISTENT-999/progress", headers=admin_headers)
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    print("[PASS] 7. Invalid expedition returns 404 Not Found")

    # 2. Valid expedition progress retrieved
    res = client.get("/expeditions/EXP-2026-014/progress", headers=admin_headers)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["expeditionId"] == "EXP-2026-014"
    assert "currentPhase" in data
    assert "origin" in data
    assert "destination" in data
    assert "waypoints" in data
    assert len(data["waypoints"]) >= 2
    assert data["totalDistanceKm"] > 0
    assert data["telemetrySource"] in ["LIVE_GPS", "PROTOTYPE_SIMULATED", "LOCATION_UNAVAILABLE"]
    assert "telemetryLabel" in data
    assert data["telemetryIsLive"] is False
    assert data["telemetrySource"] == "PROTOTYPE_SIMULATED"
    print(f"[PASS] 8. Valid expedition progress retrieved ({data['totalDistanceKm']} km total, source: {data['telemetrySource']})")

    # 3. Database read-only safety verified
    db = SessionLocal()
    try:
        inv_count_before = db.query(Inventory).count()
        cargo_count_before = db.query(Cargo).count()
        personnel_count_before = db.query(Personnel).count()
        exp_count_before = db.query(Expedition).count()
    finally:
        db.close()

    for _ in range(5):
        res = client.get("/expeditions/EXP-2026-014/progress", headers=admin_headers)
        assert res.status_code == 200

    db = SessionLocal()
    try:
        assert db.query(Inventory).count() == inv_count_before
        assert db.query(Cargo).count() == cargo_count_before
        assert db.query(Personnel).count() == personnel_count_before
        assert db.query(Expedition).count() == exp_count_before
    finally:
        db.close()
    print("[PASS] 9. Database read-only safety verified (zero database mutations on progress requests)")

    # 4. Phase update RBAC permissions
    res = client.patch(
        "/expeditions/EXP-2026-014/progress/phase",
        headers=doctor_headers,
        json={"phase": "IN_TRANSIT", "notes": "Unauthorized attempt"},
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"

    res = client.patch(
        "/expeditions/EXP-2026-014/progress/phase",
        headers=admin_headers,
        json={"phase": "IN_TRANSIT", "notes": "Convoy departed Cape Town staging port"},
    )
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    data = res.json()
    assert data["currentPhase"] == "IN_TRANSIT"
    assert data["status"] == "In Transit"

    # Reset back to Active for regression consistency
    res = client.patch(
        "/expeditions/EXP-2026-014/progress/phase",
        headers=admin_headers,
        json={"phase": "ACTIVE", "notes": "Mission active"},
    )
    assert res.status_code == 200
    print("[PASS] 10. Phase update RBAC permissions and controlled state updates verified")

    # 5. Full regression across Phase 1, Phase 2, Phase 3.1-3.4
    readiness_res = client.get("/expeditions/EXP-2026-014/readiness", headers=admin_headers)
    assert readiness_res.status_code == 200
    r_data = readiness_res.json()
    assert r_data["overallStatus"] in ["READY", "NOT_READY"]
    assert len(r_data["pillars"]) == 7

    resupply_res = client.get("/expeditions/EXP-2026-014/resupply", headers=admin_headers)
    assert resupply_res.status_code == 200

    packing_res = client.get("/expeditions/EXP-2026-014/packing/summary", headers=admin_headers)
    assert packing_res.status_code == 200

    plan_res = client.get("/expeditions/EXP-2026-014/plan", headers=admin_headers)
    assert plan_res.status_code == 200
    print("[PASS] 11. Full regression across Phase 1, Phase 2, Phase 3.1-3.4 passed successfully")


if __name__ == "__main__":
    print("\n--- RUNNING PHASE 3.5 MISSION PROGRESS & TRACKING TESTS ---")
    test_unit_calculations()
    test_api_integration()
    print("\nALL PHASE 3.5 MISSION PROGRESS TESTS PASSED SUCCESSFULLY!\n")
