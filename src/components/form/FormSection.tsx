import { GROUP_TITLES, fieldsInGroup, validateField } from "../../domain/patient";
import { useStore } from "../../state/store";
import { FieldRenderer } from "./FieldRenderer";
export function FormSection({ group }: { group: string }) {
  const fields = fieldsInGroup(group); const draft = useStore((s) => s.draft); const open = useStore((s) => !!s.openSections[group]); const toggle = useStore((s) => s.toggleSection);
  const done = fields.filter((f) => validateField(f, draft[f.api] ?? "") === null).length;
  return (
    <details className="section" open={open} onToggle={(e) => toggle(group, (e.currentTarget as HTMLDetailsElement).open)} data-section={group}>
      <summary><span>{GROUP_TITLES[group]}</span><span className={`count ${done === fields.length ? "ok" : ""}`}>{done}/{fields.length}{done === fields.length ? " ✓" : ""}</span></summary>
      <div className="fields">{fields.map((f) => <FieldRenderer key={f.api} def={f} />)}</div>
    </details>
  );
}
