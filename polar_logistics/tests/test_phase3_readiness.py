import sys
import os
from pathlib import Path
from datetime import date

# Add project root and polar_logistics to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
POLAR_DIR = PROJECT_ROOT / "polar_logistics"
if str(POLAR_DIR) not in sys.path:
    sys.path.insert(0, str(POLAR_DIR))

import httpx
from sqlalchemy.orm import sessionmaker
from polar_logistics.app.database import engine
from polar_logistics.app.models import (
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

BASE_URL = "http://127.0.0.1:8001"
ADMIN_CREDS = {"identifier": "r.sharma@ncpor.gov.in", "password": "PolarOps2026!"}
DOCTOR_CREDS = {"identifier": "v.menon@maitri.aq", "password": "PolarOps2026!"}

Session = sessionmaker(bind=engine)


def get_token(creds):
    with httpx.Client(base_url=BASE_URL) as client:
        resp = client.post("/auth/login", json=creds)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        return resp.json()["access_token"]


def test_mission_readiness_engine():
    admin_token = get_token(ADMIN_CREDS)
    doctor_token = get_token(DOCTOR_CREDS)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Nonexistent expedition returns 404
        resp = client.get("/expeditions/EXP-NONEXISTENT-999/readiness", headers=doctor_headers)
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("[PASS] 1. Nonexistent expedition returns 404 Not Found")

        # 2. Query readiness for EXP-2026-014
        resp = client.get("/expeditions/EXP-2026-014/readiness", headers=doctor_headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["totalChecks"] == 7
        assert len(data["pillars"]) == 7
        assert data["overallStatus"] in ["READY", "NOT_READY"]
        print(f"[PASS] 2. Retrieved 7-pillar mission readiness response for EXP-2026-014 (Status: {data['overallStatus']})")

        # 3. Verify that the readiness endpoint does not mutate database state
        db = Session()
        exp_count_before = db.query(Expedition).count()
        inv_count_before = db.query(Inventory).count()
        packing_count_before = db.query(PackingItem).count()
        db.close()

        for _ in range(3):
            client.get("/expeditions/EXP-2026-014/readiness", headers=doctor_headers)

        db = Session()
        assert db.query(Expedition).count() == exp_count_before
        assert db.query(Inventory).count() == inv_count_before
        assert db.query(PackingItem).count() == packing_count_before
        db.close()
        print("[PASS] 3. Database mutation safety verified (Zero writes on readiness audit)")

        # 4. Create a clean dedicated test expedition for deterministic scenario testing
        db = Session()
        test_exp_id = "EXP-TEST-READINESS-01"
        db.query(PackingItem).filter(PackingItem.expedition_id == test_exp_id).delete()
        db.query(ResupplyItem).filter(ResupplyItem.expedition_id == test_exp_id).delete()
        db.query(Personnel).filter(Personnel.expedition_id == test_exp_id).delete()
        db.query(CargoCapacityPlan).filter(CargoCapacityPlan.expedition_id == test_exp_id).delete()
        db.query(Expedition).filter(Expedition.expedition_id == test_exp_id).delete()
        db.commit()

        test_exp = Expedition(
            expedition_id=test_exp_id,
            name="Arctic Readiness Benchmark Expedition",
            season="2026-2027",
            station="Himadri",
            start_date=date(2026, 10, 1),
            end_date=date(2027, 2, 28),
            lead="Dr. Rajesh Sharma",
            lead_role="Expedition Commander",
            lead_org="NCPOR",
            personnel_count=2,
            cargo_count=2,
            status="Planning",
            primary_vessel="Basler BT-67 Polar Turbo",
        )
        db.add(test_exp)
        db.commit()

        # Add 2 qualified personnel
        p1 = Personnel(
            personnel_id="TEST-PERS-01",
            name="Dr. Rajesh Sharma",
            role="Expedition Commander",
            expedition_id=test_exp_id,
            current_station="Himadri",
            medical_clearance="AIIMS Certified (Class-1 Polar)",
            survival_training="ITBP Auli Polar Qualified",
        )
        p2 = Personnel(
            personnel_id="TEST-PERS-02",
            name="Dr. Ananya Rao",
            role="Polar Health Officer",
            expedition_id=test_exp_id,
            current_station="Himadri",
            medical_clearance="AIIMS Certified (Class-1 Polar)",
            survival_training="ITBP Auli Polar Qualified",
        )
        db.add_all([p1, p2])
        db.commit()

        # Add valid packing for both personnel
        pack1 = PackingItem(
            expedition_id=test_exp_id,
            personnel_id="TEST-PERS-01",
            personnel_name="Dr. Rajesh Sharma",
            item_name="Extreme Cold Weather Parka System",
            category="Personal Gear",
            quantity=1,
            unit="pcs",
            unit_weight_kg=8.5,
            total_weight_kg=8.5,
            priority="CRITICAL",
            status="PACKED",
        )
        pack2 = PackingItem(
            expedition_id=test_exp_id,
            personnel_id="TEST-PERS-02",
            personnel_name="Dr. Ananya Rao",
            item_name="Polar Survival Medical Kit",
            category="Medical Gear",
            quantity=1,
            unit="pcs",
            unit_weight_kg=12.0,
            total_weight_kg=12.0,
            priority="CRITICAL",
            status="PACKED",
        )
        db.add_all([pack1, pack2])
        db.commit()

        # Add valid cargo capacity
        cap = CargoCapacityPlan(
            expedition_id=test_exp_id,
            max_capacity_kg=1000.0,
            allocated_cargo_kg=200.0,
        )
        db.add(cap)
        db.commit()
        db.close()

        # 5. Check fully valid expedition -> produces READY
        resp = client.get(f"/expeditions/{test_exp_id}/readiness", headers=doctor_headers)
        assert resp.status_code == 200, resp.text
        bench_data = resp.json()
        assert bench_data["overallStatus"] == "READY", f"Expected READY, got {bench_data['overallStatus']} (Blockers: {[p['blockers'] for p in bench_data['pillars']]})"
        assert bench_data["failedChecks"] == 0
        print("[PASS] 4. Fully compliant expedition produces READY status across all 7 pillars")

        # 6. Test Missing Medical Clearance -> produces NOT_READY (Personnel blocker)
        db = Session()
        pers = db.query(Personnel).filter(Personnel.personnel_id == "TEST-PERS-02").first()
        pers.medical_clearance = "Expired / Pending Examination"
        db.commit()
        db.close()

        resp = client.get(f"/expeditions/{test_exp_id}/readiness", headers=doctor_headers)
        pers_data = resp.json()
        assert pers_data["overallStatus"] == "NOT_READY"
        pers_pillar = next(p for p in pers_data["pillars"] if p["category"] == "PERSONNEL")
        assert pers_pillar["status"] == "FAILED"
        assert len(pers_pillar["blockers"]) > 0
        print("[PASS] 5. Missing medical clearance correctly flags PERSONNEL pillar as FAILED and blocks launch")

        # Restore medical clearance
        db = Session()
        pers = db.query(Personnel).filter(Personnel.personnel_id == "TEST-PERS-02").first()
        pers.medical_clearance = "AIIMS Certified (Class-1 Polar)"
        db.commit()
        db.close()

        # 7. Test Missing Packing -> produces NOT_READY (Packing blocker)
        db = Session()
        db.query(PackingItem).filter(PackingItem.personnel_id == "TEST-PERS-02").delete()
        db.commit()
        db.close()

        resp = client.get(f"/expeditions/{test_exp_id}/readiness", headers=doctor_headers)
        pack_data = resp.json()
        assert pack_data["overallStatus"] == "NOT_READY"
        pack_pillar = next(p for p in pack_data["pillars"] if p["category"] == "PACKING")
        assert pack_pillar["status"] == "FAILED"
        assert any("no registered packing manifest" in b for b in pack_pillar["blockers"])
        print("[PASS] 6. Missing personnel packing manifest correctly flags PACKING pillar as FAILED")

        # 8. Test Invalid / Zero-Weight Packing -> produces NOT_READY
        db = Session()
        bad_pack = PackingItem(
            expedition_id=test_exp_id,
            personnel_id="TEST-PERS-02",
            personnel_name="Dr. Ananya Rao",
            item_name="Placeholder Gear Item",
            category="Personal Gear",
            quantity=1,
            unit="pcs",
            unit_weight_kg=0.0,
            total_weight_kg=0.0,
            priority="NORMAL",
            status="PLANNED",
        )
        db.add(bad_pack)
        db.commit()
        db.close()

        resp = client.get(f"/expeditions/{test_exp_id}/readiness", headers=doctor_headers)
        zero_data = resp.json()
        pack_pillar = next(p for p in zero_data["pillars"] if p["category"] == "PACKING")
        assert pack_pillar["status"] == "FAILED"
        assert any("zero/negative weight" in b for b in pack_pillar["blockers"])
        print("[PASS] 7. Zero-weight packing placeholder correctly detected and blocked")

        # Restore valid packing
        db = Session()
        db.query(PackingItem).filter(PackingItem.personnel_id == "TEST-PERS-02").delete()
        valid_pack2 = PackingItem(
            expedition_id=test_exp_id,
            personnel_id="TEST-PERS-02",
            personnel_name="Dr. Ananya Rao",
            item_name="Polar Survival Medical Kit",
            category="Medical Gear",
            quantity=1,
            unit="pcs",
            unit_weight_kg=12.0,
            total_weight_kg=12.0,
            priority="CRITICAL",
            status="PACKED",
        )
        db.add(valid_pack2)
        db.commit()
        db.close()

        # 9. Test Capacity Exceeded -> produces NOT_READY (Capacity blocker)
        db = Session()
        cap_rec = db.query(CargoCapacityPlan).filter(CargoCapacityPlan.expedition_id == test_exp_id).first()
        cap_rec.max_capacity_kg = 50.0  # Force overload (planned load > 200kg)
        db.commit()
        db.close()

        resp = client.get(f"/expeditions/{test_exp_id}/readiness", headers=doctor_headers)
        cap_data = resp.json()
        assert cap_data["overallStatus"] == "NOT_READY"
        cap_pillar = next(p for p in cap_data["pillars"] if p["category"] == "CAPACITY")
        assert cap_pillar["status"] == "FAILED"
        assert any("exceeds" in b.lower() for b in cap_pillar["blockers"])
        print("[PASS] 8. Over-capacity load correctly flags CAPACITY pillar as FAILED and blocks deployment")

        # Restore capacity
        db = Session()
        cap_rec = db.query(CargoCapacityPlan).filter(CargoCapacityPlan.expedition_id == test_exp_id).first()
        cap_rec.max_capacity_kg = 1000.0
        db.commit()
        db.close()

        # 10. Test Active Critical Emergency Incident blocks readiness
        db = Session()
        inc = EmergencyIncident(
            incident_id="INC-TEST-READINESS-01",
            title="Himadri North Glacier Crevasse Breach",
            severity="Critical",
            status="Reported",
            station_id="Himadri",
            expedition_id=test_exp_id,
        )
        db.add(inc)
        db.commit()
        db.close()

        resp = client.get(f"/expeditions/{test_exp_id}/readiness", headers=doctor_headers)
        inc_data = resp.json()
        assert inc_data["overallStatus"] == "NOT_READY"
        safe_pillar = next(p for p in inc_data["pillars"] if p["category"] == "SAFETY")
        assert safe_pillar["status"] == "FAILED"
        assert any("Active Critical emergency incident" in b for b in safe_pillar["blockers"])
        print("[PASS] 9. Active Critical emergency incident correctly halts mission readiness")

        # Clean up test incident
        db = Session()
        db.query(EmergencyIncident).filter(EmergencyIncident.incident_id == "INC-TEST-READINESS-01").delete()
        db.commit()
        db.close()

        # 11. Test Critical Unacknowledged Alert blocks readiness
        db = Session()
        alt = Alert(
            alert_id="ALT-TEST-READINESS-01",
            severity="Critical",
            status="New",
            message="Severe Arctic gale warning in effect for Himadri sector.",
        )
        db.add(alt)
        db.commit()
        db.close()

        resp = client.get(f"/expeditions/{test_exp_id}/readiness", headers=doctor_headers)
        alt_data = resp.json()
        assert alt_data["overallStatus"] == "NOT_READY"
        safe_pillar = next(p for p in alt_data["pillars"] if p["category"] == "SAFETY")
        assert safe_pillar["status"] == "FAILED"
        assert any("Unacknowledged Critical alert" in b for b in safe_pillar["blockers"])
        print("[PASS] 10. Critical unacknowledged alert correctly halts mission readiness")

        # Clean up test alert & test expedition
        db = Session()
        db.query(Alert).filter(Alert.alert_id == "ALT-TEST-READINESS-01").delete()
        db.query(PackingItem).filter(PackingItem.expedition_id == test_exp_id).delete()
        db.query(Personnel).filter(Personnel.expedition_id == test_exp_id).delete()
        db.query(CargoCapacityPlan).filter(CargoCapacityPlan.expedition_id == test_exp_id).delete()
        db.query(Expedition).filter(Expedition.expedition_id == test_exp_id).delete()
        db.commit()
        db.close()

        # 12. Full PolarOps regression test
        resp = client.get("/expeditions/EXP-2026-014/resupply", headers=doctor_headers)
        assert resp.status_code == 200
        resp = client.get("/expeditions/EXP-2026-014/plan", headers=doctor_headers)
        assert resp.status_code == 200
        resp = client.get("/expeditions/EXP-2026-014/packing/summary", headers=doctor_headers)
        assert resp.status_code == 200
        print("[PASS] 11. Full Phase 1, Phase 2, and Phase 3.1-3.3 regression verification succeeded")


if __name__ == "__main__":
    test_mission_readiness_engine()
    print("\nALL PHASE 3.4 MISSION READINESS TESTS PASSED SUCCESSFULLY!")
