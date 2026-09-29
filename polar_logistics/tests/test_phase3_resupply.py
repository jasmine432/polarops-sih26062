import sys
import os
from pathlib import Path

# Add project root and polar_logistics to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
POLAR_DIR = PROJECT_ROOT / "polar_logistics"
if str(POLAR_DIR) not in sys.path:
    sys.path.insert(0, str(POLAR_DIR))

import json
from fastapi.testclient import TestClient
from polar_logistics.app.main import app

# Demo credentials from auth.py
ADMIN_CREDS = {"identifier": "r.sharma@ncpor.gov.in", "password": "PolarOps2026!"}
PHC_CREDS = {"identifier": "a.rao@ncpor.gov.in", "password": "PolarOps2026!"}
DOCTOR_CREDS = {"identifier": "v.menon@maitri.aq", "password": "PolarOps2026!"}


def get_token(creds, client=None):
    if client is None:
        client = TestClient(app)
    resp = client.post("/auth/login", json=creds)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def test_phase3_resupply_workflow():
    client = TestClient(app)
    admin_token = get_token(ADMIN_CREDS, client)
    doctor_token = get_token(DOCTOR_CREDS, client)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}

    # 1. Retrieve initial resupply items
    resp = client.get("/expeditions/EXP-2026-014/resupply", headers=doctor_headers)
    assert resp.status_code == 200, resp.text
    initial_items = resp.json()
    assert isinstance(initial_items, list)
    print(f"[PASS] 1. Initial resupply items retrieved: {len(initial_items)} items")

    # 2. Check initial inventory quantity before resupply planning
    resp = client.get("/inventory", headers=doctor_headers)
    assert resp.status_code == 200
    inv_before = {item["id"]: item["quantity"] for item in resp.json()}

    # 3. Create a new manual resupply item (Test deterministic formula calculation)
    payload = {
        "inventoryId": 1,
        "itemName": "Extra Jet A-1 Reserve Drum",
        "category": "Fuel & Energy",
        "unit": "Liters",
        "currentStock": 500.0,
        "minimumStock": 1000.0,
        "predictedDemand": 800.0,
        "priority": "HIGH",
        "status": "PLANNED",
        "sourceStationId": "Cape Town Staging Port",
        "deliveryVesselId": "MV Vasily Golovnin",
    }
    resp = client.post("/expeditions/EXP-2026-014/resupply", json=payload, headers=admin_headers)
    assert resp.status_code == 201, resp.text
    created_item = resp.json()
    item_id = created_item["id"]

    # Verify deterministic calculations:
    # safety_stock = minimum_stock * 0.20 = 1000 * 0.20 = 200.0
    # reorder_threshold = minimum_stock + safety_stock = 1000 + 200 = 1200.0
    # projected_total_need = predicted_demand + minimum_stock + safety_stock = 800 + 1000 + 200 = 2000.0
    # resupply_quantity = max(0, 2000 - 500) = 1500.0
    assert created_item["safety_stock"] == 200.0
    assert created_item["reorder_threshold"] == 1200.0
    assert created_item["resupply_quantity"] == 1500.0
    assert created_item["status"] == "PLANNED"
    print(f"[PASS] 2. Created manual resupply item #{item_id} with deterministic formulas (safety_stock=200, resupply_qty=1500)")

    # 4. Verify Inventory.quantity is completely unchanged
    resp = client.get("/inventory", headers=doctor_headers)
    inv_after = {item["id"]: item["quantity"] for item in resp.json()}
    assert inv_before == inv_after, "Inventory quantity mutated unexpectedly during resupply creation!"
    print("[PASS] 3. Inventory.quantity remained completely unchanged after resupply item creation")

    # 5. Update resupply item (Approval workflow)
    update_payload = {
        "status": "APPROVED",
        "resupplyQuantity": 1600.0,
        "recommendationNotes": "Approved by Expedition Commander Dr. Alok Verma for deep-field traverse."
    }
    resp = client.patch(f"/expeditions/EXP-2026-014/resupply/{item_id}", json=update_payload, headers=admin_headers)
    assert resp.status_code == 200, resp.text
    updated_item = resp.json()
    assert updated_item["status"] == "APPROVED"
    assert updated_item["resupply_quantity"] == 1600.0
    print(f"[PASS] 4. Updated resupply item #{item_id} status to APPROVED")

    # 6. Delete resupply item
    resp = client.delete(f"/expeditions/EXP-2026-014/resupply/{item_id}", headers=admin_headers)
    assert resp.status_code == 200, resp.text
    print(f"[PASS] 5. Deleted resupply item #{item_id}")

    # 7. Test ML recommendation generation
    ml_generate_payload = {
        "stationOverride": "Maitri",
        "durationDaysOverride": 140,
        "leadTimeDays": 14,
        "includeAllCategories": True
    }
    resp = client.post("/expeditions/EXP-2026-014/resupply/generate-ml-recommendations", json=ml_generate_payload, headers=admin_headers)
    assert resp.status_code == 200, resp.text
    ml_result = resp.json()
    assert "recommendations" in ml_result
    assert ml_result["total_inventory_items_evaluated"] > 0
    assert len(ml_result["recommendations"]) > 0

    # Verify all newly generated recommendations start with status in SUGGESTED / APPROVED / PLANNED
    for rec in ml_result["recommendations"]:
        assert rec["status"] in ["SUGGESTED", "APPROVED", "PLANNED"]
        assert rec["safety_stock"] == round(rec["minimum_stock"] * 0.20, 2)
        assert rec["reorder_threshold"] == round(rec["minimum_stock"] + rec["safety_stock"], 2)
        assert rec["resupply_quantity"] >= 0

    print(f"[PASS] 6. ML Resupply Generation returned {len(ml_result['recommendations'])} items ({ml_result['ml_recommendations_count']} ML model predictions, {ml_result['fallback_recommendations_count']} baseline fallbacks)")

    # 8. Test ML Fallback Direct Calculation
    from app.services.resupply_service import (
        calculate_safety_stock,
        calculate_reorder_threshold,
        calculate_projected_total_need,
        calculate_recommended_resupply_quantity,
        determine_priority
    )
    s_stock = calculate_safety_stock(500.0)
    assert s_stock == 100.0
    r_thresh = calculate_reorder_threshold(500.0, s_stock)
    assert r_thresh == 600.0
    tot_need = calculate_projected_total_need(350.0, 500.0, s_stock)
    assert tot_need == 950.0
    rec_qty = calculate_recommended_resupply_quantity(tot_need, 400.0)
    assert rec_qty == 550.0
    assert determine_priority(400.0, r_thresh, 500.0, rec_qty) == "HIGH"
    assert determine_priority(0.0, r_thresh, 500.0, rec_qty) == "CRITICAL"
    print("[PASS] 7. Standalone mathematical verification of deterministic formulas verified")

    # 9. RBAC Test: DOCTOR role blocked from mutating resupply items
    resp = client.post("/expeditions/EXP-2026-014/resupply", json=payload, headers=doctor_headers)
    assert resp.status_code == 403, f"Expected 403 Forbidden for DOCTOR role, got {resp.status_code}"
    print("[PASS] 8. RBAC verified: DOCTOR role blocked (403 Forbidden) from mutating resupply items")

    # 10. Phase 1 & 2 full regression test
    resp = client.get("/expeditions", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/expeditions/EXP-2026-014/plan", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/expeditions/EXP-2026-014/plan/summary", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/expeditions/EXP-2026-014/packing/summary", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/expeditions/EXP-2026-014/load-summary", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/expeditions/EXP-2026-014/capacity", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/personnel", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/cargo", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/stations", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/vessels", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/tracking", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/emergency-incidents", headers=doctor_headers)
    assert resp.status_code == 200
    resp = client.get("/alerts", headers=doctor_headers)
    assert resp.status_code == 200
    print("[PASS] 9. Full PolarOps API regression test across all 12 core modules passed with 200 OK")


if __name__ == "__main__":
    test_phase3_resupply_workflow()
    print("\nALL PHASE 3.1 - 3.3 TESTS & REGRESSIONS PASSED SUCCESSFULLY!")
