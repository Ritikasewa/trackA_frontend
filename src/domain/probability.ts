export class IncompatibleResponseError extends Error { constructor(m: string) { super(m); this.name = "IncompatibleResponseError"; } }
/** Probabilities are displayed exactly as returned. This only VALIDATES (throws); it never clamps, rounds or adjusts. */
export function assertProbability(p: unknown, label: string): number {
  if (typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 1) throw new IncompatibleResponseError(`${label}: probability ${String(p)} is not a number in [0, 1]`);
  return p;
}
export const formatPercent = (p: number): string => `${(p * 100).toFixed(1)}%`;
export const formatRaw = (p: number): string => p.toFixed(4);
export const fmt = (x: number | null | undefined, d = 3): string => (x === null || x === undefined ? "—" : x.toFixed(d));
export const fmtCi = (c?: [number, number], d = 3): string => (c ? `[${c[0].toFixed(d)}, ${c[1].toFixed(d)}]` : "—");
