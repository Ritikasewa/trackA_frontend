import { SCHEMATIC_NOTICE } from "../../content/safety";
import { LEGEND_GRADIENT, NEUTRAL_VESSEL } from "../../domain/colorScale";
import { useView, type ViewPreset } from "./viewStore";
export function SchematicNotice() {
  return <div className="schematic-notice" data-testid="schematic-notice" role="note">{SCHEMATIC_NOTICE}</div>;
}
export function ModelCredit() {
  const model = useView((s) => s.model);
  if (model !== "anatomical") return null;
  return <div className="model-credit" data-testid="model-credit">3D anatomy: BodyParts3D, © DBCLS, CC BY-SA 2.1 Japan. Arteries are the model’s named anatomical parts, not patient-specific.</div>;
}
export function ColorLegend() {
  return (
    <div className="legend" data-testid="color-legend" aria-label="Color scale: predicted probability, fixed 0 to 100 percent">
      <div className="legend-title">Predicted probability (fixed 0–100% scale)</div>
      <div className="legend-bar" style={{ background: LEGEND_GRADIENT }} />
      <div className="legend-ticks"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
      <div className="legend-neutral"><span className="swatch" style={{ background: NEUTRAL_VESSEL }} /> no assessment yet · heart &amp; left main stem are not colored</div>
      <ModelCredit />
    </div>
  );
}
const VIEWS: [ViewPreset, string][] = [["front", "Front"], ["patientLeft", "Patient's left"], ["patientRight", "Patient's right"], ["back", "Back"]];
export function ViewControls() {
  const set = useView((s) => s.set); const cur = useView((s) => s.preset); const model = useView((s) => s.model); const setModel = useView((s) => s.setModel);
  return <div className="view-controls" role="group" aria-label="View presets">{VIEWS.map(([k, t]) => <button key={k} type="button" className={`btn mini ${cur === k ? "on" : ""}`} onClick={() => set(k)}>{t}</button>)}<button type="button" className="btn mini" onClick={() => set("front")}>Reset</button><span className="vc-sep" aria-hidden="true" />{(["anatomical", "schematic"] as const).map((m) => <button key={m} type="button" className={`btn mini ${model === m ? "on" : ""}`} aria-pressed={model === m} data-testid={`model-${m}`} onClick={() => setModel(m)}>{m === "anatomical" ? "Anatomical heart" : "Schematic heart"}</button>)}</div>;
}
