import type { AssessResponse } from "../contract/types.gen";
// The generated schema types are intentionally loose for nested blocks; these narrow them to the fields the backend actually returns (contract v1.0.0).
export type TargetId = "CAD" | "LAD" | "LCX" | "RCA";
export type VesselId = "LAD" | "LCX" | "RCA";
export interface TargetPerformance {
  model?: string; cv_roc_auc: number; cv_roc_auc_ci95?: [number, number]; cv_brier: number; cv_brier_ci95?: [number, number]; no_skill_brier: number; calibration_slope: number;
  ece_5bin?: number; prevalence?: number; auc_within_cad_positive?: number | null; discrimination_tier: "high" | "moderate" | "limited"; note: string; evaluation?: string;
}
export interface RangeFlag { field: string; value: number; level: "outside_observed_range" | "outside_central_98pct"; observed_min: number; observed_max: number }
export interface SparseFlag { field: string; value: boolean | string | number; training_count: number }
export type Assessment = Omit<AssessResponse, "model_performance" | "input_checks" | "disclaimer"> & {
  disclaimer: { short: string; text: string; required_display: true };
  model_performance: Record<TargetId, TargetPerformance>;
  input_checks: { derived: { bmi: number }; out_of_observed_range: RangeFlag[]; sparse_categories: SparseFlag[]; extrapolation_flag: boolean };
};
export interface Meta {
  contract_version: string; model_version: string; disclaimer: { short: string; text: string; required_display: boolean }; population_note: string;
  targets: { id: TargetId; label: string; definition: string; model_type: string; hyperparameters: Record<string, unknown>; calibration: string }[];
  performance: Record<TargetId, TargetPerformance>; limitations: string[]; consistency_warning: { margin: number; description: string };
  input_policy: { required_patient_fields: number; imputation: string; range_checks: string }; training: { n: number; class_counts: Record<string, number>; source: string };
}
export interface FieldError { field: string; code: string; message: string }
/** POST /explain (additive; see backend EXPLAIN_API.md). Contributions are in log-odds units and describe the model's attribution only. */
export interface ExplainRow {
  field: string; label: string; group: string; derived: boolean; unit: string | null; patient_value: number | boolean | string; display_value: string;
  reference_value: number | boolean | string; reference_display: string; reference_kind: "median" | "most_common"; contribution: number; direction: "positive" | "negative" | "neutral";
}
export interface ExplainSection { group: string; label: string; contribution: number }
export interface TargetExplanation {
  target: TargetId; label: string; model_type: string; method: "exact_linear_logodds" | "treeshap";
  reference: { log_odds: number; probability: number; definition: string };
  estimate: { log_odds: number; probability: number; probability_rounded: number; reconstructed_probability: number };
  contributions: ExplainRow[]; sections: ExplainSection[];
}
export interface Explanation {
  explain_version: string; contract_version: string; model_version: string; request_id: string | null; assessment_id: string;
  targets: Record<TargetId, TargetExplanation>; notes: string[]; disclaimer: { short: string; text: string; required_display: boolean };
}
