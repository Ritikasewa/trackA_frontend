import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/components/viewer/HeartViewer", () => ({ HeartViewer: () => <div data-testid="viewer-stub" /> }));   // WebGL is covered by scene tests + the browser E2E
import { AppShell } from "../../src/components/layout/AppShell";
import { resetStore } from "../../src/state/store";
import { EXAMPLES, EXCEEDS, GOLDEN, META, jsonResponse, stubFetch, withRequestId } from "../helpers";
beforeEach(() => resetStore()); afterEach(() => vi.unstubAllGlobals());
const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
async function setup(resp: any = GOLDEN.median_cad_row, example = "median_cad_row") {
  const stub = stubFetch((b) => jsonResponse(withRequestId(resp, b))); const user = userEvent.setup(); render(<AppShell />);
  await waitFor(() => expect(stub.calls.some((c) => c.url.endsWith("/meta"))).toBe(true));
  return { ...stub, user, load: async () => user.selectOptions(screen.getByLabelText("Load an example"), example), assess: async () => user.click(screen.getByRole("button", { name: "Assess" })) };
}
describe("layout and safety text", () => {
  it("shows the disclaimer prominently before any assessment, and the 6 sections with 50 fields", async () => {
    await setup(); const b = screen.getByTestId("disclaimer-banner"); expect(b).toHaveTextContent("DECISION SUPPORT / EDUCATIONAL USE ONLY"); expect(b).toHaveTextContent(/not a substitute for formal diagnostic imaging/i);
    for (const t of ["Demographics", "History / Risk factors", "Examination / Symptoms", "ECG", "Laboratory", "Echocardiography"]) expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.getByTestId("completeness")).toHaveTextContent("0/50"); expect(document.querySelectorAll("[data-field]")).toHaveLength(50);
  });
  it("loads limitations and performance from /meta before any assessment", async () => {
    await setup(); await waitFor(() => expect(screen.getByTestId("limitations-panel")).toHaveTextContent("Single-centre referral cohort")); expect(screen.getByTestId("limitations-panel")).toHaveTextContent("schematic illustration");
    expect(screen.getByTestId("performance-panel")).toHaveTextContent(META.performance.LCX.cv_roc_auc.toFixed(3));
  });
  it("makes no claim of uncertainty intervals", async () => { const s = await setup(); await s.load(); await s.assess(); await screen.findByTestId("input-checks-panel"); expect(screen.getByTestId("input-checks-panel")).toHaveTextContent(/Uncertainty intervals are not provided/); });
});
describe("form", () => {
  it("empty Assess shows errors and sends nothing", async () => { const s = await setup(); await s.assess(); expect((await screen.findAllByText("Required")).length).toBeGreaterThan(10); expect(s.calls.filter((c) => c.url.endsWith("/assess"))).toHaveLength(0); });
  it("Fill typical values is explicit and marks fields as default", async () => { const s = await setup(); await s.user.click(screen.getByRole("button", { name: "Fill typical values" })); expect(screen.getByTestId("completeness")).toHaveTextContent("50/50"); expect(screen.getAllByText("default").length).toBe(50); });
  it("rwma_region/function_class show only numeric codes (no meaning attached)", async () => {
    await setup(); const sel = document.querySelector("#f-rwma_region") as HTMLSelectElement; expect([...sel.options].map((o) => o.textContent)).toEqual(["Select code…", "0", "1", "2", "3", "4"]);
  });
});
describe("assessment display", () => {
  it("shows the four returned probabilities exactly; CAD is a separate overall card", async () => {
    const s = await setup(); await s.load(); await s.assess(); const r = GOLDEN.median_cad_row.predictions;
    await waitFor(() => expect(screen.getByTestId("prob-CAD")).toHaveTextContent(pct(r.CAD.probability)));
    for (const t of ["LAD", "LCX", "RCA"]) expect(screen.getByTestId(`prob-${t}`)).toHaveTextContent(pct(r[t].probability)); expect(screen.getByTestId("card-CAD")).toHaveTextContent("Overall CAD – model-estimated probability");
    expect(screen.getByTestId("card-CAD")).toHaveTextContent(/reported separately from the three vessel estimates/); expect(screen.getByTestId("disclaimer-inline")).toHaveTextContent(/not a substitute for formal diagnostic imaging/i);
    expect(s.calls.find((c) => c.url.endsWith("/assess"))!.body.patient).toEqual(EXAMPLES.median_cad_row!.patient);
  });
  it("clicking LCX shows probability, model type, definition, performance and the weak-signal warning; CAD does not get the warning", async () => {
    const s = await setup(); await s.load(); await s.assess(); await screen.findByTestId("prob-LCX"); await s.user.click(screen.getByTestId("card-LCX")); const d = screen.getByTestId("detail-panel");
    expect(within(d).getByTestId("detail-prob")).toHaveTextContent(pct(GOLDEN.median_cad_row.predictions.LCX.probability)); expect(within(d).getByTestId("detail-definition")).toHaveTextContent(/narrowing of 50% or more/); expect(within(d).queryByTestId("detail-model")).toBeNull();
    expect(within(d).getByTestId("weak-signal")).toHaveTextContent(GOLDEN.median_cad_row.model_performance.LCX.note); expect(within(d).queryByTestId("detail-performance")).toBeNull(); expect(d).toHaveTextContent(/no information about where along it a narrowing might be/);
    await s.user.click(screen.getByTestId("card-RCA")); expect(screen.getByTestId("weak-signal")).toBeInTheDocument(); await s.user.click(screen.getByTestId("card-LAD")); expect(screen.queryByTestId("weak-signal")).toBeNull();
    await s.user.click(screen.getByTestId("card-CAD")); expect(screen.queryByTestId("weak-signal")).toBeNull();
  });
  it("vessel above CAD: shows the warning, flags the card, and leaves every value unchanged", async () => {
    const s = await setup(EXCEEDS.response, "median_cad_row"); await s.load(); await s.assess(); const w = await screen.findByTestId("consistency-warning"); const r = EXCEEDS.response.predictions;
    expect(w).toHaveTextContent("LCX"); expect(w).toHaveTextContent(/have not been adjusted/); expect(w).toHaveTextContent(/display heuristic, not a clinical or statistical threshold/); expect(screen.getByTestId("flag-LCX")).toBeInTheDocument(); expect(screen.queryByTestId("flag-LAD")).toBeNull();
    for (const t of ["CAD", "LAD", "LCX", "RCA"]) expect(screen.getByTestId(`prob-${t}`)).toHaveTextContent(pct(r[t].probability));
    expect(r.LCX.probability).toBeGreaterThan(r.CAD.probability);                       // the vessel > CAD ordering is displayed as returned
  });
  it("no consistency warning when nothing is flagged", async () => { const s = await setup(); await s.load(); await s.assess(); await screen.findByTestId("prob-CAD"); expect(screen.queryByTestId("consistency-warning")).toBeNull(); });
  it("out-of-range / sparse inputs: data-support warnings, labelled as NOT prediction uncertainty", async () => {
    const s = await setup(GOLDEN.out_of_range_example, "out_of_range_example"); await s.load(); await s.assess(); const p = await screen.findByTestId("input-checks-panel");
    expect(within(p).getByTestId("extrapolation-warning")).toHaveTextContent(/outside the range seen in the training patients/); expect(within(p).getByTestId("range-flags")).toHaveTextContent(/Triglycerides/); expect(within(p).getByTestId("sparse-flags")).toHaveTextContent(/Congestive heart failure/);
    expect(p).toHaveTextContent(/not a measure of how certain/); expect(within(p).getByTestId("bmi")).toHaveTextContent(String(GOLDEN.out_of_range_example.input_checks.derived.bmi));
  });
  it("editing after an assessment shows the prominent stale banner and keeps results visible", async () => {
    const s = await setup(); await s.load(); await s.assess(); await screen.findByTestId("prob-CAD"); expect(screen.queryByTestId("stale-banner")).toBeNull();
    const age = document.querySelector("#f-age") as HTMLInputElement; await s.user.clear(age); await s.user.type(age, "77"); const b = await screen.findByTestId("stale-banner");
    expect(b).toHaveTextContent("Inputs changed since this assessment"); expect(screen.getByTestId("prob-CAD")).toHaveTextContent(pct(GOLDEN.median_cad_row.predictions.CAD.probability));
  });
});
describe("failure states", () => {
  it("server 422 highlights fields", async () => {
    stubFetch(() => jsonResponse({ errors: [{ field: "patient.tg", code: "invalid_value", message: "Server says no" }] }, 422)); const user = userEvent.setup(); render(<AppShell />);
    await user.selectOptions(screen.getByLabelText("Load an example"), "median_cad_row"); await user.click(screen.getByRole("button", { name: "Assess" })); expect(await screen.findByText("Server says no")).toBeInTheDocument(); expect(screen.getByTestId("fatal-error")).toBeInTheDocument(); expect(screen.getByTestId("prob-CAD")).toHaveTextContent("—");
  });
  it("network failure and incompatible response show an error and NO probabilities", async () => {
    vi.stubGlobal("fetch", vi.fn(async (u: string) => { if (String(u).endsWith("/meta")) return jsonResponse(META); throw new TypeError("down"); })); let user = userEvent.setup(); const v = render(<AppShell />);
    await user.selectOptions(screen.getByLabelText("Load an example"), "median_cad_row"); await user.click(screen.getByRole("button", { name: "Assess" })); expect(await screen.findByTestId("fatal-error")).toHaveTextContent(/Connection problem/); v.unmount(); resetStore();
    stubFetch(() => jsonResponse({ ...GOLDEN.median_cad_row, contract_version: "9.9.9" })); user = userEvent.setup(); render(<AppShell />);
    await user.selectOptions(screen.getByLabelText("Load an example"), "median_cad_row"); await user.click(screen.getByRole("button", { name: "Assess" })); expect(await screen.findByTestId("fatal-error")).toHaveTextContent(/Incompatible response/); expect(screen.getByTestId("prob-CAD")).toHaveTextContent("—");
  });
  it("still shows the bundled disclaimer and population note when /meta is unreachable", async () => {
    stubFetch(() => jsonResponse({}), () => jsonResponse({}, 500)); render(<AppShell />); expect(screen.getByTestId("disclaimer-banner")).toHaveTextContent(/not a substitute for formal diagnostic imaging/i); await waitFor(() => expect(screen.getByTestId("limitations-panel")).toHaveTextContent(/could not be loaded/)); expect(screen.getByTestId("limitations-panel")).toHaveTextContent(/referred for angiography/);
  });
});
