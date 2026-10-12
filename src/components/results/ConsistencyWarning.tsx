import { formatPercent } from "../../domain/probability";
import { useStore } from "../../state/store";
export function ConsistencyWarning() {
  const a = useStore((s) => s.assessment); if (!a || a.consistency.vessels_exceeding_cad.length === 0) return null; const cad = a.predictions.CAD.probability;
  return (
    <div className="banner warn" role="alert" data-testid="consistency-warning">
      <strong>Consistency warning.</strong>{" "}
      {a.consistency.vessels_exceeding_cad.map((v) => `${v} (${formatPercent(a.predictions[v].probability)})`).join(", ")} {a.consistency.vessels_exceeding_cad.length > 1 ? "are" : "is"} higher than the overall CAD probability ({formatPercent(cad)}) by more than the display margin of {a.consistency.margin.toFixed(2)}.
      The four targets are modeled independently, so this can happen. All values are shown exactly as returned and have not been adjusted. The {a.consistency.margin.toFixed(2)} margin is a display heuristic, not a clinical or statistical threshold.
    </div>
  );
}
