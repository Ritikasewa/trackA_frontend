import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/components/viewer/HeartViewer", () => ({ HeartViewer: () => <div data-testid="viewer-stub" /> }));   // WebGL is covered by scene tests + the browser E2E
import { AppShell } from "../../src/components/layout/AppShell";
import { resetStore } from "../../src/state/store";
import { EXPLAIN, jsonResponse, stubFetch } from "../helpers";
const EX = EXPLAIN.median_cad_row; const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o)); const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
beforeEach(() => { resetStore(); window.location.hash = ""; }); afterEach(() => vi.unstubAllGlobals());
const echo = (b: any, e: any = EX.explanation): Response => jsonResponse({ ...clone(e), request_id: b?.request_id ?? null });   // the real backend echoes the request_id
async function setup(explainImpl: (b: any) => Response | Promise<Response> = (b) => echo(b)) {
  const stub = stubFetch((b) => jsonResponse({ ...EX.assessment, request_id: b.request_id }), undefined, explainImpl); const user = userEvent.setup(); render(<AppShell />);
  await waitFor(() => expect(stub.calls.some((c) => c.url.endsWith("/meta"))).toBe(true));
  const assess = async () => { await user.selectOptions(screen.getByLabelText("Load an example"), "median_cad_row"); await user.click(screen.getByRole("button", { name: "Assess" })); await screen.findByTestId("prob-CAD"); };
  const openShap = async () => { await user.click(screen.getByTestId("view-shap")); await screen.findByTestId("shap-page"); };
  return { ...stub, user, assess, openShap, explainCalls: () => stub.calls.filter((c) => c.url.endsWith("/explain")) };
}
describe("button on the Results page", () => {
  it("is disabled before an assessment and enabled after; the page shows NO SHAP panel itself", async () => {
    const s = await setup(); expect(screen.getByTestId("view-shap")).toBeDisabled(); expect(screen.getByTestId("view-shap")).toHaveTextContent("View SHAP Analysis"); await s.assess(); expect(screen.getByTestId("view-shap")).toBeEnabled();
    expect(screen.queryByTestId("shap-top10")).toBeNull(); expect(screen.queryByTestId("shap-table")).toBeNull(); expect(s.explainCalls()).toHaveLength(0);       // nothing is fetched until the page is opened
  });
});
describe("SHAP Analysis page", () => {
  it("opens ONE page at #/explain, defaults to CAD, shows probability and reference, and Back returns to the results", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); expect(window.location.hash).toBe("#/explain");
    expect(screen.getByRole("heading", { name: "SHAP Analysis" })).toBeInTheDocument(); expect(screen.getByText("Why did the model produce this estimate?")).toBeInTheDocument();
    expect(screen.getByTestId("shap-target-CAD")).toHaveAttribute("aria-pressed", "true"); await screen.findByTestId("shap-top10");
    expect(screen.getByTestId("shap-prob")).toHaveTextContent(pct(EX.assessment.predictions.CAD.probability)); expect(screen.getByTestId("shap-ref")).toHaveTextContent(pct(EX.explanation.targets.CAD.reference.probability));
    expect(screen.getByTestId("shap-estimate")).toHaveTextContent("Model-estimated probability"); expect(screen.getByTestId("shap-reference")).toHaveTextContent("Reference model estimate");
    expect(screen.queryByTestId("viewer-stub")).toBeNull();                                  // the 3D heart is not duplicated here
    await s.user.click(screen.getByTestId("shap-back")); await waitFor(() => expect(screen.queryByTestId("shap-page")).toBeNull()); expect(screen.getByTestId("prob-CAD")).toBeInTheDocument();
  });
  it("sends the assessed patient and request id to /explain", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); await screen.findByTestId("shap-top10"); expect(s.explainCalls()).toHaveLength(1);
    expect(s.explainCalls()[0]!.body.request_id).toBe(s.calls.find((c) => c.url.endsWith("/assess"))!.body.request_id); expect(s.explainCalls()[0]!.body.patient).toEqual(EX.request.patient);
  });
  it("carries the selected vessel from Results to the SHAP page (LAD), and CAD when nothing is selected", async () => {
    const s = await setup(); await s.assess(); await s.user.click(screen.getByTestId("card-LAD")); await s.openShap(); expect(screen.getByTestId("shap-target-LAD")).toHaveAttribute("aria-pressed", "true"); expect(screen.getByTestId("shap-target-CAD")).toHaveAttribute("aria-pressed", "false");
    await screen.findByTestId("shap-top10"); expect(screen.getByTestId("shap-prob")).toHaveTextContent(pct(EX.assessment.predictions.LAD.probability));
  });
  it("switches target on the same page with no refetch, updating probability, reference, top factors, sections and the all-inputs table", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); await screen.findByTestId("shap-top10");
    for (const id of ["LAD", "LCX", "RCA", "CAD"] as const) {
      await s.user.click(screen.getByTestId(`shap-target-${id}`)); const t = EX.explanation.targets[id];
      expect(screen.getByTestId("shap-prob")).toHaveTextContent(pct(EX.assessment.predictions[id].probability)); expect(screen.getByTestId("shap-ref")).toHaveTextContent(pct(t.reference.probability)); expect(screen.getByTestId("shap-ref-def")).toHaveTextContent(t.reference.definition.slice(0, 40));
      expect(screen.getByTestId(`shap-row-${t.contributions[0].field}`)).toBeInTheDocument();
      for (const sec of t.sections) expect(screen.getByTestId(`shap-section-${sec.group}`)).toBeInTheDocument();
    }
    expect(s.explainCalls()).toHaveLength(1);
    await s.user.click(screen.getByTestId("shap-target-LCX")); expect(screen.getByTestId("shap-ref-def")).toHaveTextContent(/TreeSHAP/); await s.user.click(screen.getByTestId("shap-target-LAD")); expect(screen.getByTestId("shap-ref-def")).toHaveTextContent(/training-data mean/);   // different baseline definitions are not hidden
  });
  it("shows at most the TOP 10 factors, split into positive and negative, with signed values matching the API", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); const chart = await screen.findByTestId("shap-top10");
    for (const id of ["CAD", "LAD", "LCX", "RCA"] as const) {
      await s.user.click(screen.getByTestId(`shap-target-${id}`)); const top = EX.explanation.targets[id].contributions.slice(0, 10); const rows = within(chart).getAllByTestId(/^shap-row-/); expect(rows.length).toBe(top.filter((r: any) => r.direction !== "neutral").length); expect(rows.length).toBeLessThanOrEqual(10);
      const pos = within(screen.getByTestId("shap-group-positive")).queryAllByTestId(/^shap-row-/), neg = within(screen.getByTestId("shap-group-negative")).queryAllByTestId(/^shap-row-/);
      expect(pos.length).toBe(top.filter((r: any) => r.direction === "positive").length); expect(neg.length).toBe(top.filter((r: any) => r.direction === "negative").length);
      for (const r of pos) expect(r.querySelector(".shap-num")!.textContent).toMatch(/^\+/); for (const r of neg) expect(r.querySelector(".shap-num")!.textContent).toMatch(/^−/);
    }
    expect(within(chart).getByText("Positive contributions")).toBeInTheDocument(); expect(within(chart).getByText("Negative contributions")).toBeInTheDocument(); expect(chart).toHaveTextContent("Factors influencing this model estimate");
  });
  it("lists the 6 form sections, and the all-inputs table is collapsed by default, then shows 50 inputs + the derived BMI row", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); await screen.findByTestId("shap-sections");
    for (const g of ["Demographics", "Medical history / risk", "Examination / Symptoms", "ECG", "Laboratory", "Echocardiography"]) expect(within(screen.getByTestId("shap-sections")).getByText(g)).toBeInTheDocument();
    expect(screen.queryByTestId("shap-table")).toBeNull(); const toggle = screen.getByTestId("shap-toggle-all"); expect(toggle).toHaveTextContent("Show all 50 inputs"); expect(toggle).toHaveAttribute("aria-expanded", "false");
    await s.user.click(toggle); const table = screen.getByTestId("shap-table"); expect(toggle).toHaveTextContent("Hide all 50 inputs");
    for (const h of ["Field", "Patient value", "Typical training value", "Contribution", "Direction"]) expect(within(table).getByText(h)).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 51); const bmi = screen.getByTestId("shap-trow-bmi"); expect(bmi).toHaveTextContent("BMI (derived from weight and height)"); expect(table.querySelectorAll("tr.derived")).toHaveLength(1);
    expect(table).not.toHaveTextContent(/BBB_|Typical Chest Pain|Atypical\b.*Nonanginal/); expect(within(table).getByText("Chest pain type")).toBeInTheDocument(); expect(within(table).getByText("Bundle branch block")).toBeInTheDocument();
    await s.user.click(toggle); expect(screen.queryByTestId("shap-table")).toBeNull();
  });
  it("keeps the limited-reliability warning for LCX and RCA only", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); await screen.findByTestId("shap-top10"); expect(screen.queryByTestId("shap-weak")).toBeNull();
    for (const id of ["LAD", "CAD"]) { await s.user.click(screen.getByTestId(`shap-target-${id}`)); expect(screen.queryByTestId("shap-weak")).toBeNull(); }
    for (const id of ["LCX", "RCA"]) { await s.user.click(screen.getByTestId(`shap-target-${id}`)); expect(screen.getByTestId("shap-weak")).toHaveTextContent(`This explanation describes the ${id} model's attribution. These vessel-specific models have limited predictive strength in this dataset, so individual feature contributions should be interpreted cautiously.`); }
  });
  it("states the required wording and keeps the safety messages", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); await screen.findByTestId("shap-top10");
    expect(screen.getByTestId("shap-statement")).toHaveTextContent("These values show how individual inputs influenced this model's estimate for this patient. They describe the model's attribution, not causes of disease or treatment recommendations.");
    expect(screen.getByTestId("disclaimer-banner")).toHaveTextContent(/not a substitute for formal diagnostic imaging/i); expect(screen.getByTestId("urgent-care")).toHaveTextContent(/severe or persistent chest pain, difficulty breathing, fainting/);
    expect(screen.getByTestId("safety-section")).toBeInTheDocument(); expect(screen.getByTestId("shap-notes")).toHaveTextContent(/log-odds/);
  });
  it("uses safe wording: no risk-factor/causal/treatment/reassurance language and no 'share of total'", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); await screen.findByTestId("shap-top10"); await s.user.click(screen.getByTestId("shap-toggle-all"));
    for (const id of ["CAD", "LAD", "LCX", "RCA"]) { await s.user.click(screen.getByTestId(`shap-target-${id}`));
      const page = screen.getByTestId("shap-page").cloneNode(true) as HTMLElement; page.querySelector("#safety-next-steps")?.remove();               // the shared safety section is scanned by ux.test.tsx
      let text = page.textContent ?? ""; text = text.replace("not causes of disease or treatment recommendations", "");
      const m = text.match(/risk factors?|\bcaus(e|es|ed|ing)\b|increases your|\bsafe\b|\bunsafe\b|\bmg\b(?!\/)|\bdos(e|age)\b|prescrib\w*|medicat\w*|statin|aspirin|you should|share of total/i); expect(m?.[0] ?? null, `unexpected wording on the ${id} page`).toBeNull();
    }
  });
  it("uses blue/orange for contribution direction and never the probability (viridis) colours", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); await screen.findByTestId("shap-top10");
    expect(screen.getByTestId("shap-group-positive").className).toContain("positive"); expect(screen.getByTestId("shap-group-negative").className).toContain("negative");
    expect(screen.getByTestId("shap-page").querySelectorAll("[style*='background']")).toHaveLength(0);                       // no inline probability colours anywhere on the page
    expect(document.querySelector(".legend")).toBeNull();
  });
});
describe("states and errors (nothing partial is ever shown)", () => {
  it("shows a loading state, then the result", async () => {
    let release!: () => void; const gate = new Promise<void>((r) => { release = r; }); const s = await setup(async (b) => { await gate; return echo(b); }); await s.assess(); await s.openShap();
    expect(await screen.findByTestId("shap-loading")).toBeInTheDocument(); expect(screen.queryByTestId("shap-top10")).toBeNull(); release(); await screen.findByTestId("shap-top10"); expect(screen.queryByTestId("shap-loading")).toBeNull();
  });
  it("network failure, server error, validation error and an incompatible reply show an error with no data, and Try again recovers", async () => {
    const replies: (() => Response)[] = [() => { throw new TypeError("net"); }, () => jsonResponse({}, 500), () => jsonResponse({ errors: [{ field: "patient.age", code: "invalid_type", message: "bad" }] }, 422), () => jsonResponse({ ...clone(EX.explanation), assessment_id: "a".repeat(64) })];
    for (const bad of replies) {
      resetStore(); window.location.hash = ""; document.body.innerHTML = ""; let ok = false; const s = await setup((b) => (ok ? echo(b) : bad())); await s.assess(); await s.openShap();
      const err = await screen.findByTestId("shap-error"); expect(err).toHaveTextContent("could not be shown"); for (const id of ["shap-top10", "shap-sections", "shap-all-inputs", "shap-statement"]) expect(screen.queryByTestId(id)).toBeNull(); expect(screen.getByTestId("shap-ref")).toHaveTextContent("—");
      ok = true; await s.user.click(screen.getByTestId("shap-retry")); await screen.findByTestId("shap-top10"); expect(screen.queryByTestId("shap-error")).toBeNull();
    }
  });
  it("an explanation that does not add up is rejected, not displayed", async () => {
    const bad = clone(EX.explanation); bad.targets.CAD.contributions[0].contribution += 0.2; const s = await setup((b) => echo(b, bad)); await s.assess(); await s.openShap();
    expect(await screen.findByTestId("shap-error")).toHaveTextContent(/do not add up|could not be shown/); expect(screen.queryByTestId("shap-top10")).toBeNull();
  });
  it("without an assessment (e.g. page reload on #/explain) it explains that there is nothing to show and makes no request", async () => {
    window.location.hash = "#/explain"; const stub = stubFetch(() => jsonResponse({})); render(<AppShell />); expect(await screen.findByTestId("shap-empty")).toHaveTextContent("No assessment to explain yet"); expect(stub.calls.filter((c) => c.url.endsWith("/explain"))).toHaveLength(0);
    await userEvent.setup().click(screen.getByTestId("shap-back")); await waitFor(() => expect(screen.queryByTestId("shap-page")).toBeNull());
  });
  it("editing inputs after the assessment shows a stale notice on the SHAP page (the explanation is still for the assessed patient)", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); await screen.findByTestId("shap-top10"); await s.user.click(screen.getByTestId("shap-back")); await waitFor(() => expect(screen.queryByTestId("shap-page")).toBeNull());
    const age = document.querySelector("#f-age") as HTMLInputElement; await s.user.clear(age); await s.user.type(age, "77"); await s.openShap(); expect(screen.getByTestId("shap-stale")).toHaveTextContent(/Inputs changed since this assessment/);
    await screen.findByTestId("shap-top10"); expect(s.explainCalls()).toHaveLength(1); expect(s.explainCalls()[0]!.body.patient.age).toBe(EX.request.patient.age);
  });
  it("re-assessing invalidates the previous explanation and fetches a new one", async () => {
    const s = await setup(); await s.assess(); await s.openShap(); await screen.findByTestId("shap-top10"); await s.user.click(screen.getByTestId("shap-back")); await waitFor(() => expect(screen.queryByTestId("shap-page")).toBeNull());
    await s.user.click(screen.getByRole("button", { name: "Assess" })); await screen.findByTestId("prob-CAD"); await s.openShap(); await screen.findByTestId("shap-top10"); expect(s.explainCalls()).toHaveLength(2);
  });
});
