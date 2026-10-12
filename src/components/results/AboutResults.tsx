import texts from "../../contract/static_texts.json";
import { useStore } from "../../state/store";
export function AboutResults() {
  const note = useStore((s) => s.assessment?.population_note ?? s.meta?.population_note ?? texts.population_note);
  return (
    <section className="panel about" data-testid="about-results">
      <h3>How to read these results</h3>
      <ul>
        <li><strong>Model estimates.</strong> Each percentage is a machine-learning model's estimate. {note}</li>
        <li><strong>Four separate estimates.</strong> Overall CAD and the LAD, LCX and RCA estimates come from separate models, so they can disagree. Nothing is adjusted to make them agree.</li>
        <li><strong>The 3D heart is schematic.</strong> It is not a scan or a patient-specific reconstruction. Each artery has one color showing that artery's estimate on a fixed 0–100% scale, and the model does not know the physical location or size of a narrowing along an artery.</li>
        <li><strong>No uncertainty intervals in this version.</strong> The data-support notes (when shown) compare your entries with the training patients; they are not a measure of how certain an estimate is.</li>
      </ul>
    </section>
  );
}
