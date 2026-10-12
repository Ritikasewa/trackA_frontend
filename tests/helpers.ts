import golden from "./fixtures/golden_responses.json";
import exceeds from "./fixtures/response_vessel_exceeds_cad.json";
import meta from "./fixtures/meta.json";
import examples from "../src/demo/examplePatients.json";
export const GOLDEN = golden as Record<string, any>; export const EXCEEDS = exceeds as { request: { patient: Record<string, unknown> }; response: any }; export const META = meta as any;
export const EXAMPLES = examples as Record<string, { request_id: string; patient: Record<string, unknown> }>;
export const jsonResponse = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
/** fetch stub: routes /meta and /assess; `assessImpl` decides the /assess reply. */
export function stubFetch(assessImpl: (body: any) => Response | Promise<Response>, metaImpl: () => Response = () => jsonResponse(META), explainImpl: (body: any) => Response | Promise<Response> = () => jsonResponse({}, 404)) {
  const calls: { url: string; body?: any }[] = [];
  const fn = vi.fn(async (url: string, init?: RequestInit) => { const body = init?.body ? JSON.parse(String(init.body)) : undefined; calls.push({ url: String(url), body });
    if (String(url).endsWith("/meta")) return metaImpl(); if (String(url).endsWith("/assess")) return assessImpl(body); if (String(url).endsWith("/explain")) return explainImpl(body); return jsonResponse({}, 404); });
  vi.stubGlobal("fetch", fn); return { fn, calls };
}
export const withRequestId = (resp: any, body: any) => ({ ...resp, request_id: body?.request_id ?? null });

/** REAL /assess + /explain responses captured from the live backend (scripts/capture_explain_fixture.py): same patient, same request_id. */
import explainFixtures from "./fixtures/explain_responses.json";
type ExplainFx = { request: { request_id: string; patient: Record<string, unknown> }; assessment: any; explanation: any };
export const EXPLAIN = explainFixtures as unknown as { median_cad_row: ExplainFx; lowest_cad_row: ExplainFx } & Record<string, ExplainFx>;
