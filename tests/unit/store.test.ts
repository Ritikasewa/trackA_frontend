import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FIELDS } from "../../src/domain/patient";
import { resetStore, selectIsStale, useStore, viewsFromAssessment } from "../../src/state/store";
import { EXAMPLES, EXCEEDS, GOLDEN, jsonResponse, stubFetch, withRequestId } from "../helpers";
beforeEach(() => resetStore()); afterEach(() => vi.unstubAllGlobals());
const S = () => useStore.getState(); const load = (k = "median_cad_row") => S().loadExample(EXAMPLES[k]!.patient);
describe("draft handling", () => {
  it("starts empty with no defaults", () => { expect(Object.values(S().draft).every((v) => v === "")).toBe(true); expect(S().defaulted).toEqual({}); });
  it("Fill typical marks all 50 fields as defaulted; editing one clears only its flag", () => {
    S().fillTypical(); expect(Object.keys(S().defaulted)).toHaveLength(50); S().setField("age", "70"); expect(S().defaulted.age).toBeUndefined(); expect(Object.keys(S().defaulted)).toHaveLength(49); expect(S().draft.age).toBe("70");
  });
  it("loading an example is not marked as defaulted", () => { load(); expect(S().defaulted).toEqual({}); expect(FIELDS.every((f) => S().draft[f.api] !== "")).toBe(true); });
});
describe("submit", () => {
  it("incomplete form: no network call, errors shown, incomplete sections opened", async () => {
    const { fn } = stubFetch(() => jsonResponse({})); S().setField("age", "50"); await S().submit();
    expect(fn).not.toHaveBeenCalled(); expect(S().showErrors).toBe(true); expect(S().status).toBe("idle"); expect(S().openSections.labs).toBe(true); expect(S().openSections.ecg).toBe(true);
  });
  it("success stores the response exactly as received (deep-frozen) and never alters probabilities", async () => {
    stubFetch((b) => jsonResponse(withRequestId(GOLDEN.median_cad_row, b))); load(); await S().submit(); const a = S().assessment!;
    expect(S().status).toBe("success"); for (const t of ["CAD", "LAD", "LCX", "RCA"] as const) expect(a.predictions[t].probability).toBe(GOLDEN.median_cad_row.predictions[t].probability);
    expect(Object.isFrozen(a)).toBe(true); expect(Object.isFrozen(a.predictions.CAD)).toBe(true);
    expect(() => { "use strict"; (a.predictions.CAD as any).probability = 0.5; }).toThrow();
  });
  it("results stay but become stale as soon as any input changes", async () => {
    stubFetch((b) => jsonResponse(withRequestId(GOLDEN.median_cad_row, b))); load(); await S().submit(); expect(selectIsStale(S())).toBe(false);
    S().setField("ldl", "999"); expect(selectIsStale(S())).toBe(true); expect(S().assessment).not.toBeNull();
    S().setField("ldl", S().draft.ldl === "999" ? String(EXAMPLES.median_cad_row!.patient.ldl) : "1"); expect(selectIsStale(S())).toBe(false);
  });
  it("only the latest request may update the UI (stale-response guard)", async () => {
    const pending: ((r: Response) => void)[] = []; stubFetch(() => new Promise<Response>((res) => pending.push(res))); load();
    const first = S().submit(); S().setField("age", "61"); const second = S().submit(); expect(pending).toHaveLength(2);
    pending[1]!(jsonResponse(GOLDEN.highest_cad_row)); await second; pending[0]!(jsonResponse(GOLDEN.lowest_cad_row)); await first;
    expect(S().assessment!.predictions.CAD.probability).toBe(GOLDEN.highest_cad_row.predictions.CAD.probability);
  });
  it("422 -> field errors; network error and incompatible response -> fatal banners, no results", async () => {
    stubFetch(() => jsonResponse({ errors: [{ field: "patient.age", code: "invalid_value", message: "bad age" }] }, 422)); load(); await S().submit(); expect(S().serverErrors.age).toBe("bad age"); expect(S().assessment).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("x"); })); await S().submit(); expect(S().fatal?.kind).toBe("network");
    stubFetch(() => jsonResponse({ ...GOLDEN.median_cad_row, contract_version: "9" })); await S().submit(); expect(S().fatal?.kind).toBe("incompatible"); expect(S().assessment).toBeNull();
  });
});
describe("view model", () => {
  it("is built straight from the response (CAD separate; flagged only from consistency.vessels_exceeding_cad)", () => {
    const v = viewsFromAssessment(EXCEEDS.response)!; expect(v.LCX.flagged).toBe(true); expect(v.LAD.flagged).toBe(false); expect(v.CAD.flagged).toBe(false);
    for (const t of ["CAD", "LAD", "LCX", "RCA"] as const) expect(v[t].probability).toBe(EXCEEDS.response.predictions[t].probability); expect(viewsFromAssessment(null)).toBeNull();
  });
});
