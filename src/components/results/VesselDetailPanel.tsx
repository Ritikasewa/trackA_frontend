import { PLAIN_DEFINITION } from "../../content/safety";
import { formatPercent } from "../../domain/probability";
import { VESSELS, isVessel } from "../../domain/vessels";
import { useStore } from "../../state/store";
export function VesselDetailPanel() {
  const a = useStore((s) => s.assessment); const sel = useStore((s) => s.selected); const meta = useStore((s) => s.meta);
  if (!sel) return <section className="panel detail" data-testid="detail-empty"><h3>Selected artery</h3><p className="hint">Click a coronary artery in the 3D view, or one of the estimates above, to read what it means. Technical model information is in “Technical model details” below.</p></section>;
  const perf = a?.model_performance[sel] ?? meta?.performance[sel]; const pred = a?.predictions[sel]; const cadWarn = !!a && isVessel(sel) && a.consistency.vessels_exceeding_cad.includes(sel);
  return (
    <section className="panel detail" data-testid="detail-panel" aria-live="polite">
      <h3>{sel === "CAD" ? "Overall CAD" : `${sel} – ${VESSELS[sel].fullName}`}</h3>
      {pred ? <div className="detail-p"><span className="big" data-testid="detail-prob">{formatPercent(pred.probability)}</span><span className="raw">model-estimated probability – not a diagnosis</span></div> : <p className="hint">No assessment yet – press Assess.</p>}
      <p data-testid="detail-definition">{PLAIN_DEFINITION[sel]}</p>
      {isVessel(sel) && <p className="hint">{VESSELS[sel].supplies} The estimate is for the whole artery: the model has no information about where along it a narrowing might be, or how large it is.</p>}
      {perf?.discrimination_tier === "limited" && <div className="banner warn" role="note" data-testid="weak-signal"><strong>Weak-signal warning.</strong> {perf.note}</div>}
      {perf?.discrimination_tier === "moderate" && <p className="hint" data-testid="reliability-note"><strong>Note:</strong> {perf.note}</p>}
      {cadWarn && <div className="banner warn" role="note"><strong>Above overall CAD.</strong> This artery's estimate is higher than the overall CAD estimate by more than the display margin. Values are shown unadjusted.</div>}
    </section>
  );
}
