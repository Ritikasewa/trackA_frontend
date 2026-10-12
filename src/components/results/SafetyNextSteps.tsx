import { SAFETY_POINTS, SAFETY_TITLE, URGENT_CARE } from "../../content/safety";
import texts from "../../contract/static_texts.json";
import { useStore } from "../../state/store";
export function SafetyNextSteps() {
  const d = useStore((s) => s.assessment?.disclaimer ?? s.meta?.disclaimer ?? texts.disclaimer);
  return (
    <section id="safety-next-steps" className="safety" aria-labelledby="safety-h" data-testid="safety-section" tabIndex={-1}>
      <h3 id="safety-h">{SAFETY_TITLE}</h3>
      <div className="urgent" role="alert" data-testid="urgent-care"><strong>Urgent symptoms?</strong> {URGENT_CARE}</div>
      <ul data-testid="safety-points">{SAFETY_POINTS.map((t) => <li key={t}>{t}</li>)}</ul>
      <p className="disclaimer-inline" data-testid="disclaimer-inline"><strong>Model prediction – not a diagnosis.</strong> {d.text}</p>
    </section>
  );
}
