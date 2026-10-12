"""Captures REAL /assess + /explain responses (same patient, same request_id) as test fixtures. Needs the backend on :8000 (or pass a base URL).
Read-only use of the API; never edits backend code. Usage: python scripts/capture_explain_fixture.py [http://127.0.0.1:8000]"""
import json, sys, urllib.request
B = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
EX = json.load(open("src/demo/examplePatients.json"))
def post(p, body): r = urllib.request.Request(B + p, data=json.dumps(body).encode(), headers={"content-type": "application/json"}); return json.loads(urllib.request.urlopen(r).read())
out = {}
for name in ("median_cad_row", "lowest_cad_row"):
    req = {"request_id": EX[name]["request_id"], "patient": EX[name]["patient"]}; out[name] = {"request": req, "assessment": post("/assess", req), "explanation": post("/explain", req)}
json.dump(out, open("tests/fixtures/explain_responses.json", "w"), indent=1); print("captured", list(out))
