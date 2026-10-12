import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseExplanation } from "../../src/api/guards";
import { parseAssessment } from "../../src/api/guards";
import { IncompatibleResponseError } from "../../src/domain/probability";
import { resetStore, useStore } from "../../src/state/store";
import { EXAMPLES, EXPLAIN, jsonResponse, stubFetch } from "../helpers";
const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
const fx = (n = "median_cad_row") => ({ a: parseAssessment(clone(EXPLAIN[n]!.assessment)), e: clone(EXPLAIN[n]!.explanation) });
describe("parseExplanation (fail closed)", () => {
  it("accepts the real backend explanations unchanged, for every target", () => {
    for (const n of Object.keys(EXPLAIN)) { const { a, e } = fx(n); expect(parseExplanation(e, a)).toEqual(EXPLAIN[n]!.explanation); for (const t of ["CAD", "LAD", "LCX", "RCA"] as const) expect(e.targets[t].contributions).toHaveLength(51); }
  });
  const rejects: [string, (e: any, a: any) => void][] = [
    ["a different assessment_id", (e) => { e.assessment_id = "0".repeat(64); }],
    ["a different request_id", (e) => { e.request_id = "someone-else"; }],
    ["a different model version", (e) => { e.model_version = "v9"; }],
    ["an unsupported explain_version", (e) => { e.explain_version = "2.0.0"; }],
    ["a probability that disagrees with /assess (rounded)", (e) => { e.targets.LAD.estimate.probability_rounded = 0.1234; }],
    ["a probability that disagrees with /assess (unrounded)", (e) => { e.targets.CAD.estimate.probability += 0.01; }],
    ["contributions that do not add up (CAD)", (e) => { e.targets.CAD.contributions[0].contribution += 0.05; }],
    ["contributions that do not add up (LCX)", (e) => { e.targets.LCX.contributions[3].contribution -= 0.05; }],
    ["a reference that breaks additivity (RCA)", (e) => { e.targets.RCA.reference.log_odds += 0.01; }],
    ["a missing target", (e) => { delete e.targets.LCX; }],
    ["50 rows instead of 51", (e) => { e.targets.CAD.contributions.pop(); }],
    ["a duplicate row", (e) => { e.targets.CAD.contributions[1].field = e.targets.CAD.contributions[0].field; }],
    ["two derived rows", (e) => { e.targets.CAD.contributions.find((r: any) => r.field === "age").derived = true; }],
    ["a direction that disagrees with the sign", (e) => { e.targets.CAD.contributions[0].direction = e.targets.CAD.contributions[0].direction === "positive" ? "negative" : "positive"; }],
    ["a non-finite contribution", (e) => { e.targets.LAD.contributions[0].contribution = Infinity; }],
    ["sections that do not add up", (e) => { e.targets.CAD.sections[0].contribution += 0.1; }],
    ["a wrong model type", (e) => { e.targets.LCX.model_type = "logistic_regression"; }],
    ["a missing reference definition", (e) => { e.targets.CAD.reference.definition = ""; }],
    ["not an object", (e, a) => { throw new IncompatibleResponseError("x"); }],
  ];
  for (const [name, mutate] of rejects) it(`rejects ${name}`, () => { const { a, e } = fx(); try { mutate(e, a); } catch { /* the 'not an object' case */ } const input = name === "not an object" ? "nope" : e; expect(() => parseExplanation(input, a)).toThrow(IncompatibleResponseError); });
});
describe("store: explanation loading", () => {
  beforeEach(() => resetStore()); afterEach(() => vi.unstubAllGlobals());
  const seed = (n = "median_cad_row") => { const { a } = fx(n); useStore.setState({ assessment: a, assessedPatient: clone(EXPLAIN[n]!.request.patient) }); };
  it("sends the SAME patient payload and request_id that produced the assessment, once, and stores the validated explanation", async () => {
    const stub = stubFetch(() => jsonResponse({}), undefined, () => jsonResponse(EXPLAIN.median_cad_row.explanation)); seed();
    await useStore.getState().loadExplanation(); const calls = stub.calls.filter((c) => c.url.endsWith("/explain")); expect(calls).toHaveLength(1);
    expect(calls[0]!.body).toEqual({ request_id: EXPLAIN.median_cad_row.request.request_id, patient: EXPLAIN.median_cad_row.request.patient }); expect(useStore.getState().explainStatus).toBe("success");
    await useStore.getState().loadExplanation(); expect(stub.calls.filter((c) => c.url.endsWith("/explain"))).toHaveLength(1);   // cached for this assessment
  });
  it("network failure, HTTP 500, 422 and an incompatible reply all end in an error with NO explanation", async () => {
    for (const reply of [() => { throw new TypeError("net"); }, () => jsonResponse({ detail: "x" }, 500), () => jsonResponse({ errors: [{ field: "patient.age", code: "invalid_type", message: "bad" }] }, 422), () => jsonResponse({ ...clone(EXPLAIN.median_cad_row.explanation), assessment_id: "f".repeat(64) })]) {
      resetStore(); seed(); stubFetch(() => jsonResponse({}), undefined, reply as any); await useStore.getState().loadExplanation();
      const s = useStore.getState(); expect(s.explainStatus).toBe("error"); expect(s.explanation).toBeNull(); expect(s.explainError).toBeTruthy();
    }
  });
  it("does nothing without an assessment (no request is made)", async () => { const stub = stubFetch(() => jsonResponse({})); await useStore.getState().loadExplanation(); expect(stub.calls).toHaveLength(0); expect(useStore.getState().explainStatus).toBe("idle"); });
  it("a late reply for an OLD assessment is discarded (stale guard)", async () => {
    let release!: () => void; const gate = new Promise<void>((r) => { release = r; });
    stubFetch(() => jsonResponse({}), undefined, async () => { await gate; return jsonResponse(EXPLAIN.median_cad_row.explanation); }); seed("median_cad_row");
    const pending = useStore.getState().loadExplanation(); seed("lowest_cad_row"); useStore.setState({ explainSeq: useStore.getState().explainSeq + 1 }); release(); await pending;
    expect(useStore.getState().explanation).toBeNull();
  });
  it("a new assessment (submit) clears the previous explanation", async () => {
    seed(); useStore.setState({ explanation: clone(EXPLAIN.median_cad_row.explanation), explainStatus: "success" }); const ex = EXAMPLES.median_cad_row;
    stubFetch((b) => jsonResponse({ ...EXPLAIN.median_cad_row.assessment, request_id: b.request_id })); useStore.getState().loadExample(ex!.patient); await useStore.getState().submit();
    expect(useStore.getState().explanation).toBeNull(); expect(useStore.getState().explainStatus).toBe("idle"); expect(useStore.getState().assessedPatient).toBeTruthy();
  });
});
