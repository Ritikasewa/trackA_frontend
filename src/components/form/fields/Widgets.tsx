import { type FieldDef, enumLabel } from "../../../domain/patient";
interface P { def: FieldDef; id: string; value: string; onChange: (v: string) => void; invalid: boolean; describedBy?: string }
export function BoolField({ def, value, onChange, invalid, describedBy }: P) {
  return (
    <div className="radios" role="radiogroup" aria-labelledby={`lbl-${def.api}`} aria-invalid={invalid} aria-describedby={describedBy}>
      {[["true", "Yes"], ["false", "No"]].map(([v, t]) => (
        <label key={v} className={`radio ${value === v ? "on" : ""}`}>
          <input type="radio" name={def.api} value={v} checked={value === v} onChange={() => onChange(v!)} aria-label={`${def.label}: ${t}`} />
          <span>{t}</span>
        </label>
      ))}
    </div>
  );
}
export function NumberField({ def, id, value, onChange, invalid, describedBy }: P) {
  return (
    <div className="num">
      <input id={id} type="text" inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} aria-describedby={describedBy} />
      {def.unit && <span className="unit">{def.unit}</span>}
    </div>
  );
}
export function EnumField({ def, id, value, onChange, invalid, describedBy }: P) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} aria-describedby={describedBy}>
      <option value="">Select…</option>
      {def.enum!.map((v) => <option key={v} value={v}>{enumLabel(v)}</option>)}
    </select>
  );
}
/** Integer codes exactly as recorded in the dataset. Only the numbers are shown: no meaning is attached to any code. */
export function IntCodeField({ def, id, value, onChange, invalid, describedBy }: P) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} aria-describedby={describedBy}>
      <option value="">Select code…</option>
      {def.allowed!.map((v) => <option key={v} value={String(v)}>{v}</option>)}
    </select>
  );
}
