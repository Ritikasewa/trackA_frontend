import { useState } from "react";
import texts from "../../contract/static_texts.json";
import { useStore } from "../../state/store";
/** Compact, sticky, always visible and not dismissible. The full text expands in place. */
export function DisclaimerBanner({ onSafety }: { onSafety?: () => void }) {
  const d = useStore((s) => s.assessment?.disclaimer ?? s.meta?.disclaimer ?? texts.disclaimer); const [open, setOpen] = useState(false);
  return (
    <header className="disclaimer-banner" role="note" aria-label="Clinical disclaimer" data-testid="disclaimer-banner">
      <div className="d-row">
        <span className="d-badge">⚠ DECISION SUPPORT / EDUCATIONAL USE ONLY</span>
        <span className="d-short">{d.short}</span>
        <span className="d-actions">
          <button type="button" className="d-link" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Hide full disclaimer" : "Full disclaimer"}</button>
          {onSafety && <button type="button" className="d-link" onClick={onSafety}>Safety &amp; next steps</button>}
        </span>
      </div>
      {open && <p className="d-full" data-testid="disclaimer-full">{d.text}</p>}
    </header>
  );
}
