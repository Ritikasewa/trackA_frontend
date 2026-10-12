import { parseAssessment, parseErrors, parseExplanation, parseMeta } from "./guards";
import type { Assessment, Explanation, FieldError, Meta } from "./types";
const BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";
export class ApiValidationError extends Error { constructor(public errors: FieldError[]) { super("The server rejected the input"); this.name = "ApiValidationError"; } }
export class ApiHttpError extends Error { constructor(public status: number) { super(`Server returned HTTP ${status}`); this.name = "ApiHttpError"; } }
export class ApiNetworkError extends Error { constructor() { super("Could not reach the assessment server"); this.name = "ApiNetworkError"; } }
async function call(path: string, init?: RequestInit): Promise<Response> { try { return await fetch(`${BASE}${path}`, init); } catch { throw new ApiNetworkError(); } }
async function json(res: Response): Promise<unknown> { try { return await res.json(); } catch { throw new ApiHttpError(res.status); } }
export async function assess(patient: Record<string, unknown>, requestId: string): Promise<Assessment> {
  const res = await call("/assess", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ request_id: requestId, patient }) });
  if (res.status === 200) return parseAssessment(await json(res));
  if (res.status === 422) { const errs = parseErrors(await json(res)); if (errs) throw new ApiValidationError(errs); }
  throw new ApiHttpError(res.status);
}
export async function getMeta(): Promise<Meta> { const res = await call("/meta"); if (res.status !== 200) throw new ApiHttpError(res.status); return parseMeta(await json(res)); }
/** POST /explain with the SAME patient payload and request id that produced `assessment`. The result is accepted only if it matches that assessment (see parseExplanation). */
export async function explain(patient: Record<string, unknown>, assessment: Assessment): Promise<Explanation> {
  const res = await call("/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ request_id: assessment.request_id, patient }) });
  if (res.status === 200) return parseExplanation(await json(res), assessment);
  if (res.status === 422) { const errs = parseErrors(await json(res)); if (errs) throw new ApiValidationError(errs); }
  throw new ApiHttpError(res.status);
}
