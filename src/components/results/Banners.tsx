import { selectIsStale, useStore } from "../../state/store";
export function StaleBanner() {
  const stale = useStore(selectIsStale); if (!stale) return null;
  return <div className="banner stale" role="status" data-testid="stale-banner"><strong>Inputs changed since this assessment.</strong> The probabilities and colors below still reflect the previous inputs. Press Assess to update them.</div>;
}
export function FatalError() {
  const f = useStore((s) => s.fatal); if (!f) return null;
  return <div className="banner error" role="alert" data-testid="fatal-error"><strong>{f.kind === "incompatible" ? "Incompatible response." : f.kind === "network" ? "Connection problem." : "Request failed."}</strong> {f.message}</div>;
}
