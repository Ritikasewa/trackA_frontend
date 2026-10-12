import { type FieldDef, UNVERIFIED_UNIT, validateField } from "../../domain/patient";
import { useStore } from "../../state/store";
import { BoolField, EnumField, IntCodeField, NumberField } from "./fields/Widgets";
export function FieldRenderer({ def }: { def: FieldDef }) {
  const value = useStore((s) => s.draft[def.api] ?? ""); const defaulted = useStore((s) => !!s.defaulted[def.api]);
  const showErrors = useStore((s) => s.showErrors); const serverErr = useStore((s) => s.serverErrors[def.api]); const setField = useStore((s) => s.setField);
  const err = serverErr ?? (showErrors ? validateField(def, value) : null); const id = `f-${def.api}`; const errId = `${id}-err`; const describedBy = err ? errId : undefined;
  const Widget = def.kind === "bool" ? BoolField : def.kind === "number" ? NumberField : def.kind === "enum" ? EnumField : IntCodeField;
  const unverified = def.unit_status === UNVERIFIED_UNIT;
  const hint = def.kind === "number" && def.observed ? `Training data range: ${def.observed.min}–${def.observed.max}` : null;
  return (
    <div className={`field ${err ? "has-error" : ""}`} data-field={def.api}>
      <label id={`lbl-${def.api}`} htmlFor={def.kind === "bool" ? undefined : id} className="field-label">
        {def.label}{unverified && <sup title="Unit inferred from value ranges; not verified against dataset documentation">†</sup>}
        {defaulted && <span className="tag" title="Population-typical value filled in by you; not entered by the user">default</span>}
      </label>
      <Widget def={def} id={id} value={value} onChange={(v) => setField(def.api, v)} invalid={!!err} describedBy={describedBy} />
      {hint && <div className="hint">{hint}</div>}
      {def.description && <div className="hint">{def.description}</div>}
      {err && <div className="field-error" id={errId} role="alert">{err}</div>}
    </div>
  );
}
