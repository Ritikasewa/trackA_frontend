import { create } from "zustand";
import { ApiHttpError, ApiNetworkError, ApiValidationError, assess, explain, getMeta } from "../api/client";
import { IncompatibleResponseError } from "../domain/probability";
import type { Assessment, Explanation, Meta, TargetId } from "../api/types";
import { type Draft, FIELDS, GROUPS, buildPayload, completeness, draftFromPatient, draftKey, emptyDraft, fieldErrors, typicalDraft } from "../domain/patient";
export type Status = "idle" | "loading" | "success" | "error";
export type ExplainStatus = "idle" | "loading" | "success" | "error";
export interface Fatal { kind: "network" | "incompatible" | "server"; message: string }
const deepFreeze = <T,>(o: T): T => { if (o && typeof o === "object") { Object.values(o as object).forEach(deepFreeze); Object.freeze(o); } return o; };
const newId = (): string => (globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}-${Math.random().toString(16).slice(2)}`);
export interface State {
  draft: Draft; defaulted: Record<string, true>; showErrors: boolean; serverErrors: Record<string, string>;
  status: Status; assessment: Assessment | null; assessedKey: string | null; fatal: Fatal | null; latestRequestId: string | null;
  selected: TargetId | null; meta: Meta | null; metaError: string | null; openSections: Record<string, boolean>;
  assessedPatient: Record<string, unknown> | null; explanation: Explanation | null; explainStatus: ExplainStatus; explainError: string | null; explainSeq: number; shapTarget: TargetId;
  setField: (api: string, v: string) => void; fillTypical: () => void; loadExample: (p: Record<string, unknown>) => void; clearForm: () => void;
  submit: () => Promise<void>; select: (t: TargetId | null) => void; loadMeta: () => Promise<void>; toggleSection: (g: string, open: boolean) => void;
  setShapTarget: (t: TargetId) => void; loadExplanation: () => Promise<void>;
}
const initial = () => ({ draft: emptyDraft(), defaulted: {} as Record<string, true>, showErrors: false, serverErrors: {} as Record<string, string>, status: "idle" as Status, assessment: null as Assessment | null, assessedKey: null as string | null,
  fatal: null as Fatal | null, latestRequestId: null as string | null, selected: null as TargetId | null, meta: null as Meta | null, metaError: null as string | null, openSections: { demographics: true } as Record<string, boolean>,
  assessedPatient: null as Record<string, unknown> | null, explanation: null as Explanation | null, explainStatus: "idle" as ExplainStatus, explainError: null as string | null, explainSeq: 0, shapTarget: "CAD" as TargetId });
export const useStore = create<State>()((set, get) => ({
  ...initial(),
  setField: (api, v) => set((s) => { const defaulted = { ...s.defaulted }; delete defaulted[api]; const se = { ...s.serverErrors }; delete se[api]; return { draft: { ...s.draft, [api]: v }, defaulted, serverErrors: se }; }),
  fillTypical: () => set({ draft: typicalDraft(), defaulted: Object.fromEntries(FIELDS.map((f) => [f.api, true as const])), serverErrors: {}, openSections: Object.fromEntries(GROUPS.map((g) => [g, true])) }),
  loadExample: (p) => set({ draft: draftFromPatient(p), defaulted: {}, serverErrors: {}, showErrors: false }),
  clearForm: () => set({ draft: emptyDraft(), defaulted: {}, showErrors: false, serverErrors: {} }),
  toggleSection: (g, open) => set((s) => ({ openSections: { ...s.openSections, [g]: open } })),
  select: (t) => set({ selected: t }),
  setShapTarget: (t) => set({ shapTarget: t }),
  loadMeta: async () => { try { set({ meta: await getMeta(), metaError: null }); } catch (e) { set({ metaError: e instanceof Error ? e.message : "unavailable" }); } },
  loadExplanation: async () => {
    const { assessment, assessedPatient, explanation } = get(); if (!assessment || !assessedPatient) return;
    if (explanation && explanation.assessment_id === assessment.assessment_id) return;                         // already have the explanation for THIS assessment
    const seq = get().explainSeq + 1; const aid = assessment.assessment_id; set({ explainStatus: "loading", explainError: null, explainSeq: seq });
    const stale = (): boolean => get().explainSeq !== seq || get().assessment?.assessment_id !== aid;           // only the latest request for the current assessment may update the UI
    try { const e = await explain(assessedPatient, assessment); if (stale()) return; set({ explanation: deepFreeze(e), explainStatus: "success" }); }
    catch (err) {
      if (stale()) return;
      const msg = err instanceof ApiValidationError ? "The server could not explain this input." : err instanceof IncompatibleResponseError ? `${err.message}. No explanation is shown.`
        : err instanceof ApiNetworkError ? `${err.message}. Is the backend running?` : err instanceof ApiHttpError ? err.message : "Unexpected error";
      set({ explanation: null, explainStatus: "error", explainError: msg });
    }
  },
  submit: async () => {
    const { draft } = get(); const errs = fieldErrors(draft);
    if (Object.keys(errs).length) { const open: Record<string, boolean> = { ...get().openSections }; for (const f of FIELDS) if (errs[f.api]) open[f.group] = true; set({ showErrors: true, openSections: open }); return; }
    const id = newId(); const key = draftKey(draft); set({ status: "loading", latestRequestId: id, fatal: null, serverErrors: {}, showErrors: false });
    try {
      const payload = buildPayload(draft); const a = await assess(payload, id);
      if (get().latestRequestId !== id) return;                                  // stale-response guard: only the latest request may update the UI
      set({ assessment: deepFreeze(a), assessedKey: key, status: "success", assessedPatient: deepFreeze(structuredClone(payload)), explanation: null, explainStatus: "idle", explainError: null, explainSeq: get().explainSeq + 1 });   // a new assessment invalidates any earlier explanation
    } catch (e) {
      if (get().latestRequestId !== id) return;
      if (e instanceof ApiValidationError) { const m: Record<string, string> = {}; for (const x of e.errors) m[x.field.replace(/^patient\./, "")] = x.message; set({ status: "error", serverErrors: m, fatal: { kind: "server", message: "The server rejected some inputs (see highlighted fields)." } }); }
      else if (e instanceof IncompatibleResponseError) set({ status: "error", fatal: { kind: "incompatible", message: `Incompatible API response – results not shown. ${e.message}` } });
      else if (e instanceof ApiNetworkError) set({ status: "error", fatal: { kind: "network", message: e.message + ". Is the backend running?" } });
      else set({ status: "error", fatal: { kind: "server", message: e instanceof ApiHttpError ? e.message : "Unexpected error" } });
    }
  },
}));
export const resetStore = (): void => useStore.setState({ ...initial() });
export const selectIsStale = (s: State): boolean => s.assessment !== null && s.assessedKey !== draftKey(s.draft);
export const selectCompleteness = (s: State): number => completeness(s.draft);
export interface TargetView { id: TargetId; probability: number; flagged: boolean }
/** Pure view-model builder. Do NOT pass a function that returns a new object to useStore (Zustand v5 would loop); select `assessment` and memoize this instead. */
export function viewsFromAssessment(a: Assessment | null): Record<TargetId, TargetView> | null {
  if (!a) return null; const ex = new Set<string>(a.consistency.vessels_exceeding_cad);
  return Object.fromEntries((["CAD", "LAD", "LCX", "RCA"] as const).map((t) => [t, { id: t, probability: a.predictions[t].probability, flagged: ex.has(t) }])) as Record<TargetId, TargetView>;
}
export const selectViews = (s: State) => viewsFromAssessment(s.assessment);
