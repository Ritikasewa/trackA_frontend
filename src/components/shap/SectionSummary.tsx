import type { ExplainSection } from "../../api/types";
import { SECTION_LABELS, SECTION_SUB, SECTION_TITLE, signed } from "../../content/shapCopy";
/** Net contribution of each form section; bars grow right (blue, positive) or left (orange, negative) from a centre line. */
export function SectionSummary({ sections }: { sections: ExplainSection[] }) {
  const max = Math.max(1e-9, ...sections.map((s) => Math.abs(s.contribution)));
  return (
    <section className="panel" data-testid="shap-sections">
      <h3>{SECTION_TITLE}</h3><p className="hint">{SECTION_SUB}</p>
      <ul className="shap-sections">
        {sections.map((s) => { const w = (Math.abs(s.contribution) / max) * 50; const pos = s.contribution >= 0;
          return (
            <li key={s.group} className="shap-section" data-testid={`shap-section-${s.group}`}>
              <span className="shap-name">{SECTION_LABELS[s.group] ?? s.label}</span>
              <span className="shap-diverge" aria-hidden><i className={pos ? "positive" : "negative"} style={pos ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }} /></span>
              <span className="shap-num">{signed(s.contribution)}</span>
            </li>); })}
      </ul>
    </section>
  );
}
