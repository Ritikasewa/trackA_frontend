import texts from "../../contract/static_texts.json";
import { useStore } from "../../state/store";
export function LimitationsPanel() {
  const meta = useStore((s) => s.meta); const err = useStore((s) => s.metaError); const note = useStore((s) => s.assessment?.population_note ?? meta?.population_note ?? texts.population_note);
  return (
    <section className="tech-block" data-testid="limitations-panel">
      <h4>Limitations</h4>
      <p><strong>Population:</strong> {note}</p>
      {meta ? <ul>{meta.limitations.map((l) => <li key={l}>{l}</li>)}</ul> : <p className="hint">{err ? `The full limitations list could not be loaded (${err}). ` : "Loading limitations… "}</p>}
      <p className="hint">The 3D model is a schematic illustration of vessel-level model probabilities. It is not a patient-specific reconstruction, and the data contain vessel-level labels only – no lesion locations.</p>
    </section>
  );
}
