import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiHttpError, ApiNetworkError, ApiValidationError, assess, getMeta } from "../../src/api/client";
import { parseAssessment } from "../../src/api/guards";
import { IncompatibleResponseError } from "../../src/domain/probability";
import { EXAMPLES, EXCEEDS, GOLDEN, META, jsonResponse, stubFetch, withRequestId } from "../helpers";
afterEach(() => vi.unstubAllGlobals());
describe("response guard (fails closed)", () => {
  it("accepts every real backend response unchanged", () => { for (const [k, r] of Object.entries({ ...GOLDEN, exceeds: EXCEEDS.response })) expect(parseAssessment(JSON.parse(JSON.stringify(r))), k).toEqual(r); });
  const mut = (f: (r: any) => void) => { const r = JSON.parse(JSON.stringify(GOLDEN.median_cad_row)); f(r); return r; };
  it.each([
    ["probability above 1", (r: any) => { r.predictions.LCX.probability = 1.2; }], ["negative probability", (r: any) => { r.predictions.RCA.probability = -0.1; }], ["string probability", (r: any) => { r.predictions.CAD.probability = "0.5"; }],
    ["wrong contract version", (r: any) => { r.contract_version = "2.0.0"; }], ["missing target", (r: any) => { delete r.predictions.LCX; }], ["missing disclaimer", (r: any) => { delete r.disclaimer; }], ["missing consistency", (r: any) => { delete r.consistency; }],
    ["probabilities_modified true", (r: any) => { r.consistency.probabilities_modified = true; }], ["non-null uncertainty", (r: any) => { r.uncertainty = { low: 0.1 }; }], ["incomplete model_performance", (r: any) => { delete r.model_performance.LAD.cv_roc_auc; }],
  ])("rejects: %s", (_n, f) => { expect(() => parseAssessment(mut(f))).toThrow(IncompatibleResponseError); });
});
describe("client", () => {
  const patient = EXAMPLES.median_cad_row!.patient;
  it("POSTs request_id + exactly the 50 patient fields to /api/assess and returns the response untouched", async () => {
    const { calls } = stubFetch((b) => jsonResponse(withRequestId(GOLDEN.median_cad_row, b))); const out = await assess(patient, "abc");
    expect(calls[0]!.url).toBe("/api/assess"); expect(calls[0]!.body.request_id).toBe("abc"); expect(Object.keys(calls[0]!.body.patient)).toHaveLength(50); expect(calls[0]!.body.patient).toEqual(patient);
    expect(out.predictions).toEqual(GOLDEN.median_cad_row.predictions);
  });
  it("maps 422 to field errors", async () => {
    stubFetch(() => jsonResponse({ errors: [{ field: "patient.age", code: "invalid_value", message: "Must be non-negative" }] }, 422));
    await expect(assess(patient, "x")).rejects.toSatisfy((e: unknown) => e instanceof ApiValidationError && e.errors[0]!.field === "patient.age");
  });
  it("maps other HTTP errors, network failures and non-JSON", async () => {
    stubFetch(() => jsonResponse({}, 500)); await expect(assess(patient, "x")).rejects.toBeInstanceOf(ApiHttpError);
    stubFetch(() => new Response("<html>", { status: 200 })); await expect(assess(patient, "x")).rejects.toBeInstanceOf(ApiHttpError);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("failed"); })); await expect(assess(patient, "x")).rejects.toBeInstanceOf(ApiNetworkError);
  });
  it("rejects a contract-violating 200", async () => { stubFetch(() => jsonResponse({ ...GOLDEN.median_cad_row, contract_version: "9.9.9" })); await expect(assess(patient, "x")).rejects.toBeInstanceOf(IncompatibleResponseError); });
  it("getMeta returns the model card unchanged and rejects incomplete meta", async () => {
    stubFetch(() => jsonResponse({})); expect(await getMeta()).toEqual(META);
    stubFetch(() => jsonResponse({}), () => jsonResponse({ contract_version: "1.0.0" })); await expect(getMeta()).rejects.toBeInstanceOf(IncompatibleResponseError);
  });
});
