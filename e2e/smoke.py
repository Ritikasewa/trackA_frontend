"""Optional E2E smoke test (real backend + real browser/WebGL). Usage: python e2e/smoke.py [base_url]  (needs vite on :5173 and uvicorn on :8000).
Checks: labels/cards show the API values; the RENDERED PIXELS of each vessel have the expected viridis color; clicking the vessel in the canvas selects the right target."""
import sys, io, json
import numpy as np
from PIL import Image
from matplotlib import colormaps
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5173"; OUT = "e2e/shots"; ok = True
def check(name, cond, detail=""):
    global ok; ok &= bool(cond); print(("PASS " if cond else "FAIL ") + name + (f"  [{detail}]" if detail else ""), flush=True)
def hexrgb(p): r, g, b, _ = colormaps["viridis"](p); return np.array([round(r * 255), round(g * 255), round(b * 255)])
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]); pg = b.new_page(viewport={"width": 1500, "height": 950})
    logs = []; pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}")); pg.on("pageerror", lambda e: logs.append(f"PAGEERROR: {e}"))
    resp = {}
    pg.on("response", lambda r: resp.update(assess=r.json()) if r.url.endswith("/api/assess") and r.status == 200 else None)
    pg.goto(BASE); pg.wait_for_selector("[data-testid=viewer] canvas"); pg.wait_for_timeout(1200); pg.screenshot(path=f"{OUT}/01_initial.png")
    check("disclaimer visible before assessment", "DECISION SUPPORT" in pg.inner_text("[data-testid=disclaimer-banner]"))
    pg.select_option("#example-select", "median_cad_row"); pg.click("button.assess"); pg.wait_for_function("document.querySelector('[data-testid=prob-CAD]').textContent.includes('%')"); pg.wait_for_timeout(1500); pg.screenshot(path=f"{OUT}/02_assessed_front.png")
    P = {t: resp["assess"]["predictions"][t]["probability"] for t in ("CAD", "LAD", "LCX", "RCA")}
    check("cards show API values", [pg.inner_text(f"[data-testid=prob-{t}]") for t in P] == [f"{v*100:.1f}%" for v in P.values()], str(P))
    check("3D labels (text, even when hidden because the artery faces away) show API values", all((pg.text_content(f"[data-testid=vessel-label-{v}]") or "").replace("\n", " ").strip().endswith(f"{P[v]*100:.1f}%") for v in ("LAD", "LCX", "RCA")))
    viewer = pg.locator("[data-testid=viewer]"); labels = {v: pg.locator(f"[data-testid=vessel-label-{v}]").bounding_box() for v in ("LAD", "LCX", "RCA")}
    vb = viewer.bounding_box(); img = np.array(Image.open(io.BytesIO(viewer.screenshot())).convert("RGB")).astype(int)
    def covered(x, y): return any(l and l["x"] - vb["x"] - 4 <= x <= l["x"] - vb["x"] + l["width"] + 4 and l["y"] - vb["y"] - 4 <= y <= l["y"] - vb["y"] + l["height"] + 4 for l in labels.values())
    for v in ("LAD", "LCX", "RCA"):
        if v in ("LCX", "RCA"):   # anatomical heart: the LCX runs behind the heart, so it is checked from the patient's left; the others from the front
            pg.click('button:has-text("Patient\'s left")' if v == "LCX" else 'button:has-text("Front")'); pg.wait_for_timeout(1200)
            labels = {k: pg.locator(f"[data-testid=vessel-label-{k}]").bounding_box() for k in ("LAD", "LCX", "RCA")}; vb = viewer.bounding_box(); img = np.array(Image.open(io.BytesIO(viewer.screenshot())).convert("RGB")).astype(int)
        exp = hexrgb(P[v]); m = (np.abs(img - exp).max(axis=2) <= 3); ys, xs = np.nonzero(m); check(f"rendered pixels of {v} have viridis({P[v]:.3f}) = rgb{tuple(exp)}", m.sum() > 150, f"{int(m.sum())} matching pixels")
        pts = [(x, y) for x, y in zip(xs, ys) if not covered(x, y)]
        if pts:
            x, y = (int(c) for c in pts[len(pts) // 2]); pg.mouse.click(vb["x"] + x, vb["y"] + y); pg.wait_for_timeout(500); title = pg.inner_text("[data-testid=detail-panel] h3")
            check(f"clicking the {v} mesh in the canvas selects {v}", title.startswith(v), title)
            img2 = np.array(Image.open(io.BytesIO(viewer.screenshot())).convert("RGB")).astype(int); n2 = int((np.abs(img2 - exp).max(axis=2) <= 3).sum())
            check(f"{v} keeps its probability color while selected (outline does not cover it)", n2 > 150, f"{n2} matching pixels while selected")
    pg.screenshot(path=f"{OUT}/04_selected.png")
    pg.mouse.click(vb["x"] + 30, vb["y"] + vb["height"] / 2); pg.wait_for_timeout(400); check("clicking empty canvas clears selection", pg.locator("[data-testid=detail-empty]").count() == 1)
    for name, label in (("patientLeft", "Patient's left"), ("back", "Back"), ("patientRight", "Patient's right")):
        pg.click(f"button:has-text(\"{label}\")"); pg.wait_for_timeout(900); viewer.screenshot(path=f"{OUT}/03_{name}.png")
    bad = [l for l in logs if l.startswith(("error", "PAGEERROR"))]; check("no console errors / page errors", not bad, str(bad[:3]))
    b.close()
print("\nE2E OK" if ok else "\nE2E FAILED"); sys.exit(0 if ok else 1)
