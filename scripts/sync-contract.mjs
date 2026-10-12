// Read-only copy of the approved contract files from the backend artifact bundle, verified against its manifest.json (sha256).
// Never hand-edit src/contract/*, src/demo/examplePatients.json or tests/fixtures/golden_responses.json.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Default layout: <parent>/trackA_frontend/frontend  and  <parent>/trackA_backend/backend  (separate project folders).
// Override with TRACKA_ARTIFACT_DIR=<path to backend/artifacts/v1.0.0> (absolute, or relative to the current directory).
const art = path.resolve(process.env.TRACKA_ARTIFACT_DIR ?? path.join(root, "..", "..", "trackA_backend", "backend", "artifacts", "v1.0.0"));
if (!fs.existsSync(path.join(art, "manifest.json"))) {
  console.error(`Cannot find the backend contract artifacts at:\n  ${art}\nSet TRACKA_ARTIFACT_DIR to your backend/artifacts/v1.0.0 folder, e.g.\n  TRACKA_ARTIFACT_DIR=/mnt/c/Users/Ritika/Desktop/trackA_backend/backend/artifacts/v1.0.0 npm test`);
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(path.join(art, "manifest.json"), "utf8"));
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const copies = [["schema/features.json", "src/contract/features.json"], ["schema/assess_request.schema.json", "src/contract/assess_request.schema.json"],
  ["schema/assess_response.schema.json", "src/contract/assess_response.schema.json"], ["schema/error.schema.json", "src/contract/error.schema.json"],
  ["tests/golden_requests.json", "src/demo/examplePatients.json"], ["tests/golden_responses.json", "tests/fixtures/golden_responses.json"]];
const lock = { contract_version: manifest.contract_version, model_version: manifest.model_version, source: "backend/artifacts/" + manifest.model_version, files: {} };
for (const [from, to] of [...copies, ["model_contract.json", null]]) {
  const src = path.join(art, from), want = manifest.files[from]?.sha256, got = sha(src);
  if (!want || want !== got) { console.error(`INTEGRITY FAILURE: ${from} does not match manifest.json`); process.exit(1); }
  lock.files[from] = got; if (to) { fs.mkdirSync(path.dirname(path.join(root, to)), { recursive: true }); fs.copyFileSync(src, path.join(root, to)); }
}
const mc = JSON.parse(fs.readFileSync(path.join(art, "model_contract.json"), "utf8"));
fs.writeFileSync(path.join(root, "src/contract/static_texts.json"), JSON.stringify({ disclaimer: mc.disclaimer, population_note: mc.population_note, consistency_margin: mc.consistency_margin }, null, 1) + "\n");
fs.writeFileSync(path.join(root, "src/contract/contract.lock.json"), JSON.stringify(lock, null, 1) + "\n");
console.log(`contract synced (${manifest.contract_version}, ${manifest.model_version}); ${Object.keys(lock.files).length} files verified against manifest`);
