import { interpolateViridis } from "d3-scale-chromatic";
import { assertProbability } from "./probability";
/** Fixed 0..1 viridis domain. Never rescaled to the data, so colors are comparable across patients. */
export const NEUTRAL_VESSEL = "#8a8f98"; export const NEUTRAL_STEM = "#9aa0a8"; export const HEART_BODY = "#b3303f";
const toHex = (c: string): string => {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();                       // d3-scale-chromatic returns "#rrggbb" for viridis
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(c); if (!m) throw new Error(`unexpected color ${c}`);
  return "#" + [1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, "0")).join("");
};
export function probabilityToColor(p: number): string { return toHex(interpolateViridis(assertProbability(p, "color scale input"))); }
export const LEGEND_STOPS = [0, 0.25, 0.5, 0.75, 1].map((p) => ({ p, color: probabilityToColor(p) }));
export const LEGEND_GRADIENT = `linear-gradient(to right, ${Array.from({ length: 11 }, (_, i) => `${probabilityToColor(i / 10)} ${i * 10}%`).join(", ")})`;
