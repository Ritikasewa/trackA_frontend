import { LimitationsPanel } from "./LimitationsPanel";
import { PerformancePanel } from "./PerformancePanel";
import { TechnicalDetails } from "./TechnicalDetails";
/** Collapsed by default: all model / validation information for judges and researchers. */
export function TechnicalModelDetails() {
  return (
    <details className="panel technical" data-testid="technical-model-details">
      <summary>Technical model details <span className="hint">(for researchers and judges – model types, cross-validated metrics, limitations)</span></summary>
      <PerformancePanel /><LimitationsPanel /><TechnicalDetails />
    </details>
  );
}
