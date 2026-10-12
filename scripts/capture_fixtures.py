"""Captures REAL backend responses as test fixtures (needs the backend on :8000). Read-only use of the API; never edits backend code."""
import json, os, urllib.request, sys
B = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
def post(p): r = urllib.request.Request(B + "/assess", data=json.dumps(p).encode(), headers={"content-type": "application/json"}); return json.loads(urllib.request.urlopen(r).read())
# Backend lives in a separate folder: <parent>/trackA_backend/backend (override with TRACKA_BACKEND_DIR).
BACKEND_DIR = os.environ.get("TRACKA_BACKEND_DIR") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "trackA_backend", "backend")
patients = json.load(open(os.path.join(BACKEND_DIR, "tests", "fixtures", "patients_303.json"))); found = {}
for i, p in enumerate(patients):
    resp = post({"request_id": f"row{i}", "patient": p})
    if resp["consistency"]["vessels_exceeding_cad"] and "exceeds" not in found: found["exceeds"] = (i, p, resp)
    if len(found) == 1: break
i, p, resp = found["exceeds"]; json.dump({"request": {"request_id": f"row{i}", "patient": p}, "response": resp}, open("tests/fixtures/response_vessel_exceeds_cad.json", "w"), indent=1)
json.dump(json.loads(urllib.request.urlopen(B + "/meta").read()), open("tests/fixtures/meta.json", "w"), indent=1)
print("captured: vessel-exceeds-CAD row", i, resp["consistency"]["vessels_exceeding_cad"], {t: resp["predictions"][t]["probability"] for t in resp["predictions"]})
