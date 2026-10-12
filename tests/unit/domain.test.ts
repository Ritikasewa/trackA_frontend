import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import requestSchema from "../../src/contract/assess_request.schema.json";
import responseSchema from "../../src/contract/assess_response.schema.json";
import { LEGEND_STOPS, NEUTRAL_VESSEL, probabilityToColor } from "../../src/domain/colorScale";
import { FIELDS, GROUPS, GROUP_TITLES, buildPayload, completeness, draftFromPatient, emptyDraft, fieldsInGroup, typicalDraft, validateField } from "../../src/domain/patient";
import { IncompatibleResponseError, assertProbability, formatPercent, formatRaw } from "../../src/domain/probability";
import { TARGET_IDS, VESSELS, VESSEL_IDS, targetForSceneNode } from "../../src/domain/vessels";
import { EXAMPLES } from "../helpers";
describe("color scale (viridis, fixed 0..1)", () => {
  it("matches viridis end points and is fixed-domain", () => { expect(probabilityToColor(0)).toBe("#440154"); expect(probabilityToColor(1)).toBe("#fde725"); expect(probabilityToColor(0.5)).toBe(probabilityToColor(0.5)); expect(LEGEND_STOPS).toHaveLength(5); });
  it("never clamps: out-of-range input throws", () => { for (const bad of [-0.0001, 1.0001, NaN, Infinity]) expect(() => probabilityToColor(bad)).toThrow(IncompatibleResponseError); });
  it("distinct probabilities give distinct colors; neutral is not a viridis stop", () => { expect(new Set([0.1, 0.3, 0.5, 0.7, 0.9].map(probabilityToColor)).size).toBe(5); expect(LEGEND_STOPS.map((s) => s.color)).not.toContain(NEUTRAL_VESSEL); });
});
describe("probability helpers", () => {
  it("assertProbability returns the exact value (no rounding/clamping)", () => { expect(assertProbability(0.123456789, "x")).toBe(0.123456789); expect(assertProbability(0, "x")).toBe(0); expect(assertProbability(1, "x")).toBe(1); });
  it("rejects invalid probabilities", () => { for (const bad of [1.0000001, -1e-9, NaN, "0.5", null, undefined]) expect(() => assertProbability(bad, "x")).toThrow(IncompatibleResponseError); });
  it("formats", () => { expect(formatPercent(0.8911)).toBe("89.1%"); expect(formatRaw(0.8911)).toBe("0.8911"); });
});
describe("vessel registry (API id <-> 3D node)", () => {
  it("covers exactly the vessel targets of the response schema", () => {
    const ids = (responseSchema.properties.predictions.required as string[]); expect([...ids].sort()).toEqual([...TARGET_IDS].sort()); expect(ids.filter((i) => i !== "CAD").sort()).toEqual([...VESSEL_IDS].sort());
  });
  it("scene node names are unique, derived from ids, and round-trip", () => {
    const names = VESSEL_IDS.map((v) => VESSELS[v].sceneNodeName); expect(new Set(names).size).toBe(3); expect(names).toEqual(["vessel_LAD", "vessel_LCX", "vessel_RCA"]);
    for (const v of VESSEL_IDS) expect(targetForSceneNode(VESSELS[v].sceneNodeName)).toBe(v); expect(targetForSceneNode("vessel_CAD")).toBeNull(); expect(targetForSceneNode("heart")).toBeNull();
  });
});
describe("patient form model", () => {
  it("has exactly the 50 contract fields, in the 6 required groups", () => {
    expect(FIELDS).toHaveLength(50); expect(new Set(FIELDS.map((f) => f.api))).toEqual(new Set(requestSchema.properties.patient.required)); expect(GROUPS.map((g) => GROUP_TITLES[g])).toEqual(["Demographics", "History / Risk factors", "Examination / Symptoms", "ECG", "Laboratory", "Echocardiography"]);
    expect(GROUPS.map((g) => fieldsInGroup(g).length)).toEqual([4, 11, 11, 7, 14, 3]);
  });
  it("never exposes target or derived fields", () => { const names = FIELDS.map((f) => f.api.toLowerCase()); for (const bad of ["lad", "lcx", "rca", "cath", "cad", "bmi", "obesity"]) expect(names).not.toContain(bad); });
  it("starts empty: nothing is pre-filled or imputed", () => { const d = emptyDraft(); expect(Object.values(d).every((v) => v === "")).toBe(true); expect(completeness(d)).toBe(0); expect(() => buildPayload(d)).toThrow(); });
  it("buildPayload(draftFromPatient(example)) reproduces every example request exactly", () => { for (const [k, ex] of Object.entries(EXAMPLES)) expect(buildPayload(draftFromPatient(ex.patient)), k).toEqual(ex.patient); });
  it("payloads validate against the approved request schema (examples + typical fill)", () => {
    const v = new Ajv2020({ strict: false }).compile(requestSchema); for (const ex of Object.values(EXAMPLES)) expect(v({ patient: buildPayload(draftFromPatient(ex.patient)) })).toBe(true);
    expect(completeness(typicalDraft())).toBe(50); expect(v({ patient: buildPayload(typicalDraft()) })).toBe(true);
  });
  it("client validation mirrors server rules", () => {
    const f = (a: string) => FIELDS.find((x) => x.api === a)!;
    expect(validateField(f("age"), "")).toBe("Required"); expect(validateField(f("age"), "abc")).toBe("Enter a number"); expect(validateField(f("age"), "-1")).toBe("Must be 0 or greater"); expect(validateField(f("age"), "58.5")).toBeNull();
    expect(validateField(f("weight_kg"), "0")).toBe("Must be greater than 0"); expect(validateField(f("height_cm"), "0")).toBe("Must be greater than 0");
    expect(validateField(f("sex"), "male")).toBeNull(); expect(validateField(f("sex"), "M")).not.toBeNull(); expect(validateField(f("diabetes"), "true")).toBeNull(); expect(validateField(f("diabetes"), "1")).not.toBeNull();
    expect(validateField(f("rwma_region"), "4")).toBeNull(); expect(validateField(f("rwma_region"), "5")).not.toBeNull(); expect(validateField(f("function_class"), "2.5")).not.toBeNull();
  });
  it("rwma_region and function_class are plain integer codes with no assigned meaning", () => {
    for (const a of ["rwma_region", "function_class"]) { const f = FIELDS.find((x) => x.api === a)!; expect(f.kind).toBe("int_enum"); expect(f.description).toMatch(/not documented/); expect(f.description).not.toMatch(/ordinal|= none/i); }
  });
});
