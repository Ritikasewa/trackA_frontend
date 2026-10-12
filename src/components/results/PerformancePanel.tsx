import { Fragment } from "react";
import { fmt, fmtCi } from "../../domain/probability";
import { TARGET_IDS } from "../../domain/vessels";
import { useStore } from "../../state/store";
import { TierChip, modelText } from "./shared";
export function PerformancePanel() {
  const a = useStore((s) => s.assessment); const meta = useStore((s) => s.meta); const perf = a?.model_performance ?? meta?.performance;
  if (!perf) return <section className="tech-block"><h4>Models and performance</h4><p className="hint">Performance information is not available yet (the /meta endpoint could not be reached and no assessment has been made).</p></section>;
  return (
    <section className="tech-block" data-testid="performance-panel">
      <h4>Models and cross-validated performance</h4>
      <div className="table-wrap"><table>
        <thead><tr><th>Target</th><th>Model</th><th>Discrimination</th><th>ROC-AUC [95% CI]</th><th>Brier (no-skill)</th><th>Calib. slope</th><th>AUC within CAD+</th></tr></thead>
        <tbody>{TARGET_IDS.map((t) => { const p = perf[t]; return (
          <tr key={t}><th scope="row">{t}</th><td>{p.model === "XGB" ? "XGBoost" : p.model === "LR" ? "Logistic regression" : modelText(a?.predictions[t].model_type ?? "")}</td><td><TierChip perf={p} /></td><td>{fmt(p.cv_roc_auc)} {fmtCi(p.cv_roc_auc_ci95)}</td><td>{fmt(p.cv_brier, 4)} ({fmt(p.no_skill_brier, 4)})</td><td>{fmt(p.calibration_slope, 2)}</td><td>{p.auc_within_cad_positive == null ? "—" : fmt(p.auc_within_cad_positive)}</td></tr>); })}</tbody>
      </table></div>
      {a && <dl className="kv">{TARGET_IDS.map((t) => <Fragment key={t}><dt>{t} definition</dt><dd>{a.predictions[t].definition}</dd></Fragment>)}</dl>}
      <p className="hint">{perf.CAD.evaluation ?? "5×5 repeated stratified cross-validation; tuning inside training folds."} Confidence intervals are patient-bootstrap intervals on out-of-fold predictions and are optimistic.</p>
    </section>
  );
}
