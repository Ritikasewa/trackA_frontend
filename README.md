# Track A frontend (React + React Three Fiber) – contract v1.0.0

Decision-support / educational visualization of the backend's `POST /assess` output. **Not a diagnosis; not a substitute for formal diagnostic imaging.**

    npm install
    # terminal 1:  cd <...>/trackA_backend/backend && uvicorn app.main:app --port 8000
    # terminal 2:
    npm run dev            # http://127.0.0.1:5173  (Vite proxies /api/* -> BACKEND_URL, default http://127.0.0.1:8000; backend/CORS untouched)
    npm test               # 80 unit/component/3D-scene tests (syncs + verifies the contract first)
    npm run build          # typecheck + production build
    python e2e/smoke.py    # optional real-browser E2E (needs both servers; Playwright + Chromium)

## What is mapped to what
| API | UI / 3D |
|---|---|
| `predictions.LAD / LCX / RCA` | scene nodes `vessel_LAD / vessel_LCX / vessel_RCA` (registry: `src/domain/vessels.ts`), each ONE uniform viridis color from its own probability (fixed 0–1 domain), plus a "NAME xx.x%" label |
| `predictions.CAD` | "Overall CAD probability" card only – it colors nothing in 3D |
| `consistency.vessels_exceeding_cad` | warning banner + flag on card/label; values are never changed |
| `input_checks`, `model_performance`, `population_note`, `disclaimer` | Input-checks panel (labelled *not* prediction uncertainty), vessel detail + performance panel, limitations, persistent banners |
| `uncertainty`, `data_support` (null in v1) | not rendered |

## Important limitations (also shown in the UI)
- The 3D model is a **schematic illustration of vessel-level model probabilities**. It is not a patient-specific reconstruction. The dataset has vessel-level labels only: the model does **not** know where along a vessel a narrowing is, so there are no hotspots; each vessel has a single color.
- LCX/RCA carry a *limited-discrimination* warning (taken from the API's `model_performance.<id>.note`).
- `rwma_region` and `function_class` are shown as plain integer codes; no meaning is assigned.
- Probabilities are displayed exactly as returned (no clamping, rounding of stored values, or normalization). Out-of-range values make the app fail closed.

## Contract safety
`scripts/sync-contract.mjs` copies the schemas/features/golden files from the backend's `artifacts/v1.0.0` (default `../../trackA_backend/backend/artifacts/v1.0.0`, i.e. a sibling `trackA_backend` project folder; override with `TRACKA_ARTIFACT_DIR`), verifying each against `manifest.json` (sha256). Responses are validated at runtime against the approved JSON Schema; an unsupported `contract_version` or any violation shows an error and no results.
Not implemented (by design, this phase): SHAP, what-if, similar patients, prevention guidance, bootstrap uncertainty.
