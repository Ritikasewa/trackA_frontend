import { formatPercent } from "../../domain/probability";
import { useStore } from "../../state/store";
export function OverallCadCard() {
  const a = useStore((s) => s.assessment); const selected = useStore((s) => s.selected === "CAD"); const select = useStore((s) => s.select); const p = a?.predictions.CAD.probability;
  return (
    <button type="button" className={`card cad ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => select("CAD")} data-testid="card-CAD">
      <div className="card-title">Overall CAD – model-estimated probability</div>
      <div className="big" data-testid="prob-CAD">{p === undefined ? "—" : formatPercent(p)}</div>
      <div className="meter ink" aria-hidden><i style={{ width: p === undefined ? "0%" : `${p * 100}%` }} /></div>
      <div className="sub">{a ? "Overall estimate, reported separately from the three vessel estimates. A model estimate, not a diagnosis." : "No assessment yet"}</div>
    </button>
  );
}
