import { useSyncExternalStore } from "react";
/** Minimal hash router (no dependency, works on any static host, Back button works): "#/explain" is the one SHAP Analysis page for all four targets. */
export type Route = "results" | "explain";
const read = (): Route => (typeof window !== "undefined" && /^#\/?explain/.test(window.location.hash) ? "explain" : "results");
const subscribe = (cb: () => void): (() => void) => { window.addEventListener("hashchange", cb); return () => window.removeEventListener("hashchange", cb); };
export const useRoute = (): Route => useSyncExternalStore(subscribe, read, () => "results" as Route);
export const navigate = (r: Route): void => { window.location.hash = r === "explain" ? "#/explain" : "#/"; };
