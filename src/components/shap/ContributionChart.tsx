import type { ExplainRow } from "../../api/types";
import { NEGATIVE_SUB, NEGATIVE_TITLE, POSITIVE_SUB, POSITIVE_TITLE, TOP_SUB, TOP_TITLE, signed } from "../../content/shapCopy";
function Group({ title, sub, rows, max, kind }: { title: string; sub: string; rows: ExplainRow[]; max: number; kind: "positive" | "negative" }) {
  return (
    <div className={`shap-group ${kind}`} data-testid={`shap-group-${kind}`}>
      <h4><span className="shap-glyph" aria-hidden>{kind === "positive" ? "▲" : "▼"}</span> {title} <span className="shap-group-sub">– {sub}</span></h4>
      {rows.length === 0 ? <p className="hint">None among the top 10.</p> : (
        <ul className="shap-rows">
          {rows.map((r) => (
            <li key={r.field} className="shap-row" data-testid={`shap-row-${r.field}`} aria-label={`${r.label}: ${signed(r.contribution)} ${kind} contribution`}>
              <span className="shap-name">{r.label}<span className="shap-val"> · {r.display_value}{r.unit && r.display_value !== "Yes" && r.display_value !== "No" ? ` ${r.unit}` : ""}</span></span>
              <span className="shap-track" aria-hidden><i style={{ width: `${Math.max(2, (Math.abs(r.contribution) / max) * 100)}%` }} /></span>
              <span className="shap-num">{signed(r.contribution)}</span>
            </li>))}
        </ul>)}
    </div>
  );
}
/** Horizontal bars for the TOP 10 contributors only. Blue = positive contribution, orange = negative; the colours mean nothing about disease or safety and are unrelated to the 3D probability scale. */
export function ContributionChart({ rows }: { rows: ExplainRow[] }) {
  const top = rows.slice(0, 10); const max = Math.max(1e-9, ...top.map((r) => Math.abs(r.contribution)));
  return (
    <section className="panel shap-chart" data-testid="shap-top10">
      <h3>{TOP_TITLE}</h3><p className="hint">{TOP_SUB}</p>
      <Group title={POSITIVE_TITLE} sub={POSITIVE_SUB} rows={top.filter((r) => r.direction === "positive")} max={max} kind="positive" />
      <Group title={NEGATIVE_TITLE} sub={NEGATIVE_SUB} rows={top.filter((r) => r.direction === "negative")} max={max} kind="negative" />
    </section>
  );
}
