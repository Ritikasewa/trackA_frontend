import examples from "../../demo/examplePatients.json";
import { useStore } from "../../state/store";
const LABELS: Record<string, string> = { lowest_cad_row: "Training record – lowest CAD probability", median_cad_row: "Training record – median CAD probability", highest_cad_row: "Training record – highest CAD probability", out_of_range_example: "Synthetic edit – out-of-range values (TG 1500, weight 150 kg, CHF)" };
export function ExamplePatients() {
  const load = useStore((s) => s.loadExample); const ex = examples as Record<string, { patient: Record<string, unknown> }>;
  return (
    <div className="examples">
      <label htmlFor="example-select">Load an example</label>
      <select id="example-select" defaultValue="" onChange={(e) => { const k = e.target.value; if (k && ex[k]) load(ex[k].patient); e.target.value = ""; }}>
        <option value="">Choose…</option>
        {Object.keys(ex).map((k) => <option key={k} value={k}>{LABELS[k] ?? k}</option>)}
      </select>
      <div className="hint">Examples are in-sample training records (or a synthetic edit). They illustrate the interface and are not evidence of model performance.</div>
    </div>
  );
}
