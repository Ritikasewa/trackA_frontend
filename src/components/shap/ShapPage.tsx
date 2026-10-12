import { useEffect } from "react";
import type { TargetId } from "../../api/types";
import { formatPercent } from "../../domain/probability";
import { SHAP_REFERENCE_NOTE, SHAP_STATEMENT, SHAP_SUBTITLE, SHAP_TITLE, SHAP_UNITS, weakExplainWarning } from "../../content/shapCopy";
import { selectIsStale, useStore } from "../../state/store";
import { SafetyNextSteps } from "../results/SafetyNextSteps";
import { AllInputsTable } from "./AllInputsTable";
import { ContributionChart } from "./ContributionChart";
import { SectionSummary } from "./SectionSummary";
const TARGETS: TargetId[] = ["CAD", "LAD", "LCX", "RCA"];
/** ONE reusable page for all four targets; the target is switched with the selector, no separate pages. */
export function ShapPage({ onBack }: { onBack: () => void }) {
  const assessment = useStore((s) => s.assessment); const explanation = useStore((s) => s.explanation); const status = useStore((s) => s.explainStatus); const error = useStore((s) => s.explainError);
  const target = useStore((s) => s.shapTarget); const setTarget = useStore((s) => s.setShapTarget); const load = useStore((s) => s.loadExplanation); const stale = useStore(selectIsStale);
  const aid = assessment?.assessment_id;
  useEffect(() => { void load(); }, [aid, load]);
  const perf = assessment?.model_performance[target]; const t = explanation?.targets[target];
  return (
    <div className="shap" data-testid="shap-page">
      <button type="button" className="btn ghost back" onClick={onBack} data-testid="shap-back">← Back to Results</button>
      <div className="shap-head"><h2>{SHAP_TITLE}</h2><p className="shap-sub">{SHAP_SUBTITLE}</p></div>
      {!assessment ? (
        <div className="panel" data-testid="shap-empty"><h3>No assessment to explain yet</h3><p>Go back to the results page, enter the patient data and press Assess. The SHAP analysis explains the most recent assessment.</p></div>
      ) : (<>
        {stale && <div className="banner stale" data-testid="shap-stale" role="status"><strong>Inputs changed since this assessment.</strong> This analysis explains the earlier assessment shown on the results page, not the edited inputs.</div>}
        <div className="shap-selector" role="group" aria-label="Choose which model estimate to explain">
          {TARGETS.map((id) => <button key={id} type="button" className={`seg ${target === id ? "on" : ""}`} aria-pressed={target === id} onClick={() => setTarget(id)} data-testid={`shap-target-${id}`}>{id}</button>)}
        </div>
        <div className="shap-stats">
          <div className="stat" data-testid="shap-estimate"><div className="card-title">Model-estimated probability – {target}</div><div className="big" data-testid="shap-prob">{formatPercent(assessment.predictions[target].probability)}</div><div className="sub">A model estimate, not a diagnosis.</div></div>
          <div className="stat" data-testid="shap-reference"><div className="card-title">Reference model estimate</div><div className="big ref" data-testid="shap-ref">{t ? formatPercent(t.reference.probability) : "—"}</div><div className="sub" data-testid="shap-ref-def">{t ? t.reference.definition : "Loading…"}</div></div>
        </div>
        {perf?.discrimination_tier === "limited" && (
          <div className="banner warn" data-testid="shap-weak" role="note"><strong>Limited reliability.</strong> {weakExplainWarning(target)} <span className="hint">Model note: {perf.note}</span></div>)}
        {status === "loading" && <div className="panel" role="status" data-testid="shap-loading">Calculating the contributions for this assessment…</div>}
        {status === "error" && (
          <div className="banner error" role="alert" data-testid="shap-error"><strong>The explanation could not be shown.</strong> {error}
            <div><button type="button" className="btn" onClick={() => void load()} data-testid="shap-retry">Try again</button></div></div>)}
        {status === "success" && t && (<>
          <p className="shap-statement" data-testid="shap-statement">{SHAP_STATEMENT}</p>
          <ContributionChart rows={t.contributions} />
          <SectionSummary sections={t.sections} />
          <AllInputsTable rows={t.contributions} />
          <section className="panel about" data-testid="shap-notes"><h3>How to read this analysis</h3><ul><li>{SHAP_UNITS}</li><li>{SHAP_REFERENCE_NOTE}</li>{explanation!.notes.slice(1).filter((n) => !n.startsWith("Contributions are in log-odds") && !n.startsWith("The reference is defined")).map((n) => <li key={n}>{n}</li>)}</ul></section>
        </>)}
        <SafetyNextSteps />
      </>)}
    </div>
  );
}
