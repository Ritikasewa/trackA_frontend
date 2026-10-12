import features from "../contract/features.json";
export type Kind = "bool" | "number" | "enum" | "int_enum";
export interface FieldDef {
  api: string; kind: Kind; group: string; label: string; unit: string | null; unit_status: string | null; description: string | null;
  enum?: string[]; allowed?: number[]; observed?: { min: number; max: number; p01: number; p99: number; median: number }; default_for_form: number | string | boolean;
}
export const FIELDS = features.fields as unknown as FieldDef[];
export const GROUP_TITLES: Record<string, string> = { demographics: "Demographics", history_risk_factors: "History / Risk factors", exam_symptoms: "Examination / Symptoms", ecg: "ECG", labs: "Laboratory", echo: "Echocardiography" };
export const GROUPS: string[] = features.groups;
export const fieldsInGroup = (g: string): FieldDef[] => FIELDS.filter((f) => f.group === g);
export const FIELD_BY_API: Record<string, FieldDef> = Object.fromEntries(FIELDS.map((f) => [f.api, f]));
export const UNVERIFIED_UNIT = "inferred_from_value_range_unverified";
export type Draft = Record<string, string>;            // every control stores a string; "" = not answered
export const emptyDraft = (): Draft => Object.fromEntries(FIELDS.map((f) => [f.api, ""]));
export function enumLabel(v: string): string { const s: Record<string, string> = { lbbb: "LBBB", rbbb: "RBBB", nonanginal: "Non-anginal" }; return s[v] ?? v.charAt(0).toUpperCase() + v.slice(1); }
/** Client-side check mirroring the server rules (non-negative numbers; weight/height > 0; strict enums). Returns an error message or null. */
export function validateField(f: FieldDef, raw: string): string | null {
  if (raw === "") return "Required";
  if (f.kind === "bool") return raw === "true" || raw === "false" ? null : "Choose Yes or No";
  if (f.kind === "enum") return f.enum!.includes(raw) ? null : "Choose a value";
  if (f.kind === "int_enum") { const n = Number(raw); return Number.isInteger(n) && f.allowed!.includes(n) ? null : `Choose one of ${f.allowed!.join(", ")}`; }
  if (!/^-?\d+(\.\d+)?$/.test(raw.trim())) return "Enter a number";
  const n = Number(raw); if (!Number.isFinite(n)) return "Enter a finite number";
  if (f.api === "weight_kg" || f.api === "height_cm") return n > 0 ? null : "Must be greater than 0";
  return n >= 0 ? null : "Must be 0 or greater";
}
export const fieldErrors = (d: Draft): Record<string, string> => { const out: Record<string, string> = {}; for (const f of FIELDS) { const e = validateField(f, d[f.api] ?? ""); if (e) out[f.api] = e; } return out; };
export const completeness = (d: Draft): number => FIELDS.filter((f) => validateField(f, d[f.api] ?? "") === null).length;
/** Builds EXACTLY the 50 contract fields with JSON types (boolean/number/integer/string). Throws if any field is invalid. No defaults, no derived values (BMI is server-side). */
export function buildPayload(d: Draft): Record<string, boolean | number | string> {
  const out: Record<string, boolean | number | string> = {};
  for (const f of FIELDS) {
    const raw = d[f.api] ?? ""; const err = validateField(f, raw); if (err) throw new Error(`${f.api}: ${err}`);
    out[f.api] = f.kind === "bool" ? raw === "true" : f.kind === "enum" ? raw : Number(raw);
  }
  return out;
}
export const draftFromPatient = (p: Record<string, unknown>): Draft => Object.fromEntries(FIELDS.map((f) => [f.api, String(p[f.api])]));
export const typicalDraft = (): Draft => Object.fromEntries(FIELDS.map((f) => [f.api, String(f.default_for_form)]));
export const draftKey = (d: Draft): string => FIELDS.map((f) => d[f.api] ?? "").join("\u0001");
export const fieldLabel = (api: string): string => FIELD_BY_API[api.replace(/ \(derived\)$/, "")]?.label ?? api;
