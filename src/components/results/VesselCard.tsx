import type { VesselId } from "../../api/types";
import { NEUTRAL_VESSEL, probabilityToColor } from "../../domain/colorScale";
import { formatPercent } from "../../domain/probability";
import { VESSELS } from "../../domain/vessels";
import { useStore } from "../../state/store";
import { LimitedChip } from "./shared";
export function VesselCard({ id }: { id: VesselId }) {
  const a = useStore((s) => s.assessment); const selected = useStore((s) => s.selected === id); const select = useStore((s) => s.select);
  const p = a?.predictions[id].probability; const flagged = !!a?.consistency.vessels_exceeding_cad.includes(id);
  return (
    <button type="button" className={`card vessel ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => select(id)} data-testid={`card-${id}`}>
      <div className="card-title"><span className="swatch" style={{ background: p === undefined ? NEUTRAL_VESSEL : probabilityToColor(p) }} aria-hidden />{id} – model estimate</div>
      <div className="big" data-testid={`prob-${id}`}>{p === undefined ? "—" : formatPercent(p)}</div>
      <div className="meter" aria-hidden><i style={{ width: p === undefined ? "0%" : `${p * 100}%`, background: p === undefined ? NEUTRAL_VESSEL : probabilityToColor(p) }} /></div>
      <div className="sub">{VESSELS[id].fullName}</div>
      <div className="chips"><LimitedChip perf={a?.model_performance[id]} />{flagged && <span className="chip warn" data-testid={`flag-${id}`}>⚠ Above overall CAD</span>}</div>
    </button>
  );
}
