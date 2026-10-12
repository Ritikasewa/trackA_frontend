import { useStore } from "../../state/store";
export function TechnicalDetails() {
  const a = useStore((s) => s.assessment); if (!a) return null;
  return <section className="tech-block" data-testid="technical-details"><h4>Versions and identifiers</h4><dl className="kv"><dt>Contract version</dt><dd>{a.contract_version}</dd><dt>Model version</dt><dd>{a.model_version}</dd><dt>Request id</dt><dd>{a.request_id ?? "—"}</dd><dt>Assessment id</dt><dd className="mono">{a.assessment_id}</dd></dl></section>;
}
