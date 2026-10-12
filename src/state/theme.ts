import { useSyncExternalStore } from "react";
export type Theme = "light" | "dark";
const KEY = "tracka-theme"; const listeners = new Set<() => void>();
function read(): Theme { try { return window.localStorage.getItem(KEY) === "dark" ? "dark" : "light"; } catch { return "light"; } }   // storage may be unavailable (private window): fall back to light
let current: Theme = typeof window === "undefined" ? "light" : read();
export function applyTheme(t: Theme): void { if (typeof document !== "undefined") document.documentElement.dataset.theme = t; }
export function setTheme(t: Theme): void { current = t; applyTheme(t); try { window.localStorage.setItem(KEY, t); } catch { /* ignore */ } listeners.forEach((l) => l()); }
export function useTheme(): Theme { return useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => current, () => "light"); }
applyTheme(current);
