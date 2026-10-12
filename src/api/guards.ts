import Ajv2020 from "ajv/dist/2020";
import responseSchema from "../contract/assess_response.schema.json";
import errorSchema from "../contract/error.schema.json";
import { IncompatibleResponseError, assertProbability } from "../domain/probability";
import type { Assessment, Explanation, FieldError, Meta } from "./types";
const ajv = new Ajv2020({ strict: false, allErrors: true });
const vResponse = ajv.compile(responseSchema); const vError = ajv.compile(errorSchema);
export const SUPPORTED_CONTRACT = "1.0.0";
/** Fail closed: anything that does not match the approved response schema (or has an out-of-range probability) is rejected, not rendered. */
export function parseAssessment(raw: unknown): Assessment {
  if (!vResponse(raw)) throw new IncompatibleResponseError("Response does not match the approved contract: " + ajv.errorsText(vResponse.errors, { dataVar: "response" }).slice(0, 300));
  const r = raw as unknown as Assessment; if (r.contract_version !== SUPPORTED_CONTRACT) throw new IncompatibleResponseError(`Unsupported contract_version ${r.contract_version}`);
  for (const t of ["CAD", "LAD", "LCX", "RCA"] as const) assertProbability(r.predictions[t].probability, t);
  for (const t of ["CAD", "LAD", "LCX", "RCA"] as const) { const p = r.model_performance[t] as unknown as Record<string, unknown>; if (typeof p?.cv_roc_auc !== "number" || typeof p.discrimination_tier !== "string") throw new IncompatibleResponseError(`model_performance.${t} is incomplete`); }
  return r;
}
export function parseErrors(raw: unknown): FieldError[] | null { return vError(raw) ? (raw as { errors: FieldError[] }).errors : null; }
export function parseMeta(raw: unknown): Meta {
  const m = raw as Meta; if (!m || typeof m !== "object" || !m.performance || !Array.isArray(m.limitations) || !m.disclaimer?.text) throw new IncompatibleResponseError("/meta response is incomplete");
  if (m.contract_version !== SUPPORTED_CONTRACT) throw new IncompatibleResponseError(`Unsupported /meta contract_version ${m.contract_version}`); return m;
}

const TARGET_IDS = ["CAD", "LAD", "LCX", "RCA"] as const;
const GROUP_IDS = ["demographics", "history_risk_factors", "exam_symptoms", "ecg", "labs", "echo"];
const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
/** Fail closed: an explanation is shown ONLY if it is structurally complete, belongs to THIS assessment, and is arithmetically consistent with the /assess probabilities.
 *  Nothing partial or fabricated is ever returned. Tolerance 1e-6 (XGBoost margins are float32). */
export function parseExplanation(raw: unknown, a: Assessment): Explanation {
  const bad = (m: string): never => { throw new IncompatibleResponseError(`Explanation rejected: ${m}`); };
  if (!raw || typeof raw !== "object") return bad("not an object");
  const e = raw as Explanation;
  if (e.explain_version !== "1.0.0") bad(`unsupported explain_version ${String(e.explain_version)}`);
  if (e.contract_version !== SUPPORTED_CONTRACT || e.contract_version !== a.contract_version || e.model_version !== a.model_version) bad("version mismatch with the assessment");
  if (e.assessment_id !== a.assessment_id || e.request_id !== a.request_id) bad("it does not belong to the displayed assessment");
  if (!Array.isArray(e.notes) || !e.notes.length || !e.disclaimer?.text) bad("notes or disclaimer missing");
  if (!e.targets || typeof e.targets !== "object") return bad("targets missing");
  for (const id of TARGET_IDS) {
    const t = e.targets[id]; if (!t || t.target !== id) return bad(`missing target ${id}`);
    if (t.model_type !== a.predictions[id].model_type) bad(`${id} model type differs from the assessment`);
    if (!isNum(t.reference?.log_odds) || !isNum(t.reference?.probability) || typeof t.reference?.definition !== "string" || !t.reference.definition) bad(`${id} reference incomplete`);
    const es = t.estimate; if (!es || ![es.log_odds, es.probability, es.probability_rounded, es.reconstructed_probability].every(isNum)) return bad(`${id} estimate incomplete`);
    if (es.probability_rounded !== a.predictions[id].probability || Math.abs(es.probability - a.predictions[id].probability) > 5e-5 + 1e-12) bad(`${id} probability disagrees with the assessment`);
    if (!Array.isArray(t.contributions) || t.contributions.length !== 51) return bad(`${id} must have 50 inputs plus the derived BMI row`);
    const seen = new Set<string>(); let sum = 0, derived = 0;
    for (const r of t.contributions) {
      if (!r || typeof r.field !== "string" || typeof r.label !== "string" || typeof r.display_value !== "string" || typeof r.reference_display !== "string" || !isNum(r.contribution) || !GROUP_IDS.includes(r.group)) return bad(`${id} has a malformed row`);
      if (seen.has(r.field)) bad(`${id} has a duplicate row ${r.field}`); seen.add(r.field); sum += r.contribution; if (r.derived) { derived++; if (r.field !== "bmi") bad("derived row must be bmi"); }
      const dir = r.contribution > 1e-12 ? "positive" : r.contribution < -1e-12 ? "negative" : "neutral"; if (r.direction !== dir) bad(`${id} direction disagrees with the sign of ${r.field}`);
    }
    if (derived !== 1) bad(`${id} must have exactly one derived row`);
    const z = t.reference.log_odds + sum;
    if (Math.abs(z - es.log_odds) > 1e-6 || Math.abs(sigmoid(z) - es.probability) > 1e-6) bad(`${id} contributions do not add up to the model estimate`);
    if (!Array.isArray(t.sections) || t.sections.length !== GROUP_IDS.length || t.sections.some((s, i) => s.group !== GROUP_IDS[i] || !isNum(s.contribution) || typeof s.label !== "string")) return bad(`${id} sections malformed`);
    if (Math.abs(t.sections.reduce((acc, s) => acc + s.contribution, 0) - sum) > 1e-6) bad(`${id} sections do not add up`);
  }
  return e;
}
