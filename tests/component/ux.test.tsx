import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../src/components/viewer/HeartViewer", () => ({ HeartViewer: () => <div data-testid="viewer-stub" /> }));
import { AppShell } from "../../src/components/layout/AppShell";
import { SchematicNotice } from "../../src/components/viewer/ViewOverlays";
import { FORM_EMERGENCY_NOTE, PLAIN_DEFINITION, SAFETY_POINTS, SCHEMATIC_NOTICE, URGENT_CARE } from "../../src/content/safety";
import { resetStore } from "../../src/state/store";
import { GOLDEN, jsonResponse, stubFetch, withRequestId } from "../helpers";
beforeEach(() => resetStore()); afterEach(() => vi.unstubAllGlobals());
const TECH = /ROC-AUC|Brier|calibration|\bECE\b|logistic regression|XGBoost|cross-validat/i;      // the population note (contract text) legitimately mentions the cohort prevalence
async function assessed() {
  stubFetch((b) => jsonResponse(withRequestId(GOLDEN.median_cad_row, b))); const user = userEvent.setup(); render(<AppShell />);
  await user.selectOptions(screen.getByLabelText("Load an example"), "median_cad_row"); await user.click(screen.getByRole("button", { name: "Assess" })); await screen.findByTestId("limited-chip" as never).catch(() => null); await waitFor(() => expect(screen.getByTestId("prob-CAD")).toHaveTextContent("%")); return user;
}
const resultsWithoutTechnical = (): string => { const pane = document.querySelector(".pane.results")!.cloneNode(true) as HTMLElement; pane.querySelector("[data-testid=technical-model-details]")?.remove(); return pane.textContent ?? ""; };
describe("patient-facing results hide technical metrics", () => {
  it("no ROC-AUC / Brier / calibration / ECE / prevalence / model names outside Technical model details (before and after selecting vessels)", async () => {
    const user = await assessed(); expect(resultsWithoutTechnical()).not.toMatch(TECH);
    for (const t of ["CAD", "LAD", "LCX", "RCA"]) { await user.click(screen.getByTestId(`card-${t}`)); expect(resultsWithoutTechnical(), t).not.toMatch(TECH); }
  });
  it("Technical model details is collapsed by default and still holds the validation information", async () => {
    await assessed(); const d = screen.getByTestId("technical-model-details") as HTMLDetailsElement; expect(d.open).toBe(false);
    const pp = within(d).getByTestId("performance-panel"); expect(pp).toHaveTextContent(/ROC-AUC/); expect(pp).toHaveTextContent(/Brier/); expect(pp).toHaveTextContent(/Logistic regression/); expect(pp).toHaveTextContent(/XGBoost/); expect(pp).toHaveTextContent(String(GOLDEN.median_cad_row.model_performance.LCX.cv_roc_auc.toFixed(3)));
    expect(within(d).getByTestId("limitations-panel")).toBeInTheDocument(); expect(within(d).getByTestId("technical-details")).toHaveTextContent(GOLDEN.median_cad_row.assessment_id);
  });
});
describe("Safety & next steps", () => {
  it("is always present, even before an assessment, with the urgent-care callout", () => {
    stubFetch(() => jsonResponse({})); render(<AppShell />); const s = screen.getByTestId("safety-section"); expect(within(s).getByRole("heading", { name: "Safety & next steps" })).toBeInTheDocument(); expect(within(s).getByTestId("urgent-care")).toHaveTextContent(/severe or persistent chest pain, difficulty breathing, fainting/);
  });
  it("contains each required statement", async () => {
    await assessed(); const t = screen.getByTestId("safety-section").textContent!;
    expect(t).toMatch(/estimates from a machine-learning model/); expect(t).toMatch(/not a diagnosis/); expect(t).toMatch(/start, stop, or change any medication or treatment/); expect(t).toMatch(/qualified healthcare professional/); expect(t).toMatch(/symptoms or cardiovascular risk factors/);
    expect(t).toMatch(/seek urgent medical care/); expect(t).toMatch(/not a statement that you are safe/); expect(t).toMatch(/not a substitute for formal diagnostic imaging/);
  });
  it("copy contains no treatment, medication, dosage or reassurance claims", () => {
    const all = [URGENT_CARE, FORM_EMERGENCY_NOTE, ...SAFETY_POINTS, ...Object.values(PLAIN_DEFINITION)].join(" ").replace("gives no personal treatment, medication, or dosage advice", "");   // explicit statement that NO such advice is given
    expect(all).not.toMatch(/\b\d+\s?(mg|mcg|ml)\b|\bdos(e|age)s?\b|prescrib|statin|aspirin|beta[- ]?blocker|metoprolol|should take|nothing to worry|no risk|nothing wrong|you are healthy|you will not/i);
    expect(all.match(/you are safe/gi)?.length ?? 0).toBe(1);          // only inside the explicit negation "not a statement that you are safe"
    expect(SAFETY_POINTS.find((p) => /you are safe/.test(p))).toMatch(/not a statement that you are safe/);
  });
  it("the form carries a short not-for-emergencies note", () => { stubFetch(() => jsonResponse({})); render(<AppShell />); expect(screen.getByTestId("form-emergency-note")).toHaveTextContent(/not for emergencies/i); });
});
describe("disclaimer banner and schematic notice", () => {
  it("compact banner is always visible, shows the contract text, and expands to the full disclaimer", async () => {
    stubFetch(() => jsonResponse({})); const user = userEvent.setup(); render(<AppShell />); const b = screen.getByTestId("disclaimer-banner");
    expect(b).toHaveTextContent("DECISION SUPPORT / EDUCATIONAL USE ONLY"); expect(b).toHaveTextContent(/not a substitute for formal diagnostic imaging/i); expect(screen.queryByTestId("disclaimer-full")).toBeNull();
    await user.click(within(b).getByRole("button", { name: "Full disclaimer" })); expect(screen.getByTestId("disclaimer-full")).toHaveTextContent(/statistical research model/); expect(within(b).queryByRole("button", { name: /dismiss|close/i })).toBeNull();
  });
  it("3D notice uses the required wording exactly", () => {
    render(<SchematicNotice />); expect(screen.getByTestId("schematic-notice").textContent).toBe("Schematic vessel-level model probabilities — not a patient-specific anatomical scan. Highlighting does not indicate the location or size of an actual blockage."); expect(SCHEMATIC_NOTICE).toBe(screen.getByTestId("schematic-notice").textContent);
  });
  it("'How to read these results' explains schematic heart and unknown location/size", async () => {
    await assessed(); const a = screen.getByTestId("about-results"); expect(a).toHaveTextContent(/not a scan or a patient-specific reconstruction/); expect(a).toHaveTextContent(/does not know the physical location or size of a narrowing/); expect(a).toHaveTextContent(/referred for angiography/);
  });
});
describe("weak-discrimination warnings are kept", () => {
  it("LCX and RCA cards show a Limited-reliability chip and the full API warning when selected; CAD and LAD do not", async () => {
    const user = await assessed(); expect(within(screen.getByTestId("card-LCX")).getByTestId("limited-chip")).toBeInTheDocument(); expect(within(screen.getByTestId("card-RCA")).getByTestId("limited-chip")).toBeInTheDocument();
    expect(within(screen.getByTestId("card-LAD")).queryByTestId("limited-chip")).toBeNull(); expect(within(screen.getByTestId("card-CAD")).queryByTestId("limited-chip")).toBeNull();
    for (const t of ["LCX", "RCA"] as const) { await user.click(screen.getByTestId(`card-${t}`)); expect(screen.getByTestId("weak-signal")).toHaveTextContent(GOLDEN.median_cad_row.model_performance[t].note); }
    await user.click(screen.getByTestId("card-LAD")); expect(screen.getByTestId("reliability-note")).toHaveTextContent(GOLDEN.median_cad_row.model_performance.LAD.note);
  });
});
