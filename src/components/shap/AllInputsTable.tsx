import { useState } from "react";
import type { ExplainRow } from "../../api/types";
import { TABLE_FOOTNOTE, signed } from "../../content/shapCopy";
/** Collapsed by default. 50 inputs + one clearly-labelled derived BMI row, sorted by |contribution|. */
export function AllInputsTable({ rows }: { rows: ExplainRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="panel" data-testid="shap-all-inputs">
      <button type="button" className="btn" aria-expanded={open} aria-controls="shap-all-table" onClick={() => setOpen((o) => !o)} data-testid="shap-toggle-all">{open ? "Hide all 50 inputs" : "Show all 50 inputs"}</button>
      {open && (
        <div id="shap-all-table">
          <div className="table-wrap">
            <table className="shap-table" data-testid="shap-table">
              <thead><tr><th>Field</th><th>Patient value</th><th>Typical training value</th><th>Contribution</th><th>Direction</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.field} data-testid={`shap-trow-${r.field}`} className={r.derived ? "derived" : ""}>
                    <td>{r.label}</td><td>{r.display_value}{r.unit && !["Yes", "No"].includes(r.display_value) ? ` ${r.unit}` : ""}</td><td>{r.reference_display}</td>
                    <td className={`shap-num ${r.direction}`}>{signed(r.contribution)}</td>
                    <td>{r.direction === "positive" ? "▲ Positive" : r.direction === "negative" ? "▼ Negative" : "– None"}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
          <p className="hint">{TABLE_FOOTNOTE}</p>
        </div>)}
    </section>
  );
}
