import { FIELDS, GROUPS } from "../../domain/patient";
import { selectCompleteness, useStore } from "../../state/store";
import { FORM_EMERGENCY_NOTE } from "../../content/safety";
import { ExamplePatients } from "./ExamplePatients";
import { FormSection } from "./FormSection";
export function PatientForm() {
  const n = useStore(selectCompleteness); const status = useStore((s) => s.status); const submit = useStore((s) => s.submit); const fill = useStore((s) => s.fillTypical); const clear = useStore((s) => s.clearForm);
  return (
    <form className="patient-form" onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate aria-label="Patient input">
      <h2>Patient input</h2>
      <div className="progress" role="status" aria-live="polite"><div className="bar"><div style={{ width: `${(n / FIELDS.length) * 100}%` }} /></div><span data-testid="completeness">{n}/{FIELDS.length} fields complete</span></div>
      <p className="emergency-note" role="note" data-testid="form-emergency-note">{FORM_EMERGENCY_NOTE}</p>
      <p className="hint">All 50 fields are required. Nothing is imputed or defaulted for you.</p>
      <ExamplePatients />
      <div className="row">
        <button type="button" className="btn secondary" onClick={fill} title="Fills every field with the training-set median/mode. Marked as 'default'.">Fill typical values</button>
        <button type="button" className="btn ghost" onClick={clear}>Clear</button>
      </div>
      {GROUPS.map((g) => <FormSection key={g} group={g} />)}
      <p className="hint">† Unit inferred from value ranges; not verified against the dataset documentation.</p>
      <button type="submit" className="btn primary assess" disabled={status === "loading"}>{status === "loading" ? "Assessing…" : "Assess"}</button>
    </form>
  );
}
