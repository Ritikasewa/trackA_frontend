import { FIELD_BY_API, enumLabel, fieldLabel } from "../../domain/patient";
import { useStore } from "../../state/store";
const unitOf = (api: string): string => FIELD_BY_API[api.replace(/ \(derived\)$/, "")]?.unit ?? (api.startsWith("bmi") ? "kg/m²" : "");
const sparseValue = (v: boolean | string | number): string => (v === true ? "Yes" : v === false ? "No" : typeof v === "string" ? enumLabel(v) : String(v));
export function InputChecksPanel() {
  const a = useStore((s) => s.assessment); if (!a) return null; const c = a.input_checks; const none = c.out_of_observed_range.length === 0 && c.sparse_categories.length === 0;
  return (
    <details className="panel" open={!none || c.extrapolation_flag} data-testid="input-checks-panel">
      <summary>Data-support notes about your entries <span className="hint">(not a measure of how certain the estimate is)</span></summary>
      <p>BMI (calculated by the server from weight and height): <strong data-testid="bmi">{c.derived.bmi}</strong> kg/m²</p>
      {c.extrapolation_flag && <div className="banner warn" role="alert" data-testid="extrapolation-warning"><strong>Outside the training data.</strong> At least one value lies outside the range seen in the training patients. The model has no data for patients like this, so its output for this input is not well supported.</div>}
      {c.out_of_observed_range.length > 0 && <><h4>Values outside the training range</h4><ul data-testid="range-flags">{c.out_of_observed_range.map((r) => <li key={r.field}><strong>{fieldLabel(r.field)}</strong>: {r.value} {unitOf(r.field)} – {r.level === "outside_observed_range" ? "outside the observed training range" : "outside the central 98% of training values"} (observed {r.observed_min}–{r.observed_max})</li>)}</ul></>}
      {c.sparse_categories.length > 0 && <><h4>Rarely observed categories</h4><ul data-testid="sparse-flags">{c.sparse_categories.map((r) => <li key={r.field}><strong>{fieldLabel(r.field)}</strong> = {sparseValue(r.value)} occurs in only {r.training_count} of 303 training patients; the model's handling of this input is poorly supported.</li>)}</ul></>}
      {none && !c.extrapolation_flag && <p className="hint">No values outside the training range and no rarely observed categories were flagged.</p>}
      <p className="hint">Uncertainty intervals are not provided in this version. These checks compare your inputs with the training data only; they are not a measure of how certain the prediction is.</p>
    </details>
  );
}
