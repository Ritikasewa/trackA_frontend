import type { TargetPerformance } from "../../api/types";
/** Technical views only (Technical model details). */
export function TierChip({ perf }: { perf?: TargetPerformance }) {
  if (!perf) return null; const t = perf.discrimination_tier; const text = t === "high" ? "High discrimination" : t === "moderate" ? "Moderate discrimination" : "Limited discrimination";
  return <span className={`chip tier-${t}`} title={`Cross-validated ROC-AUC ${perf.cv_roc_auc.toFixed(3)}`}>{t === "limited" ? "⚠ " : ""}{text}</span>;
}
/** Patient-facing: shown only when the API marks the target's discrimination as limited (data-driven, never hard-coded to LCX/RCA). */
export function LimitedChip({ perf }: { perf?: TargetPerformance }) {
  if (perf?.discrimination_tier !== "limited") return null;
  return <span className="chip tier-limited" data-testid="limited-chip">⚠ Limited reliability</span>;
}
export const modelText = (m: string): string => (m === "logistic_regression" ? "Logistic regression" : m === "xgboost" ? "XGBoost (gradient-boosted trees)" : m);
