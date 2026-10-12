// GENERATED from src/contract/*.schema.json by scripts/gen-types.mjs - do not edit.
/* eslint-disable */
export interface AssessRequest {
  request_id?: string;
  patient: {
    /**
     * Age (years)
     */
    age: number;
    /**
     * Sex
     */
    sex: "male" | "female";
    /**
     * Weight (kg)
     */
    weight_kg: number;
    /**
     * Height (cm)
     */
    height_cm: number;
    /**
     * Diabetes mellitus
     */
    diabetes: boolean;
    /**
     * Hypertension (history)
     */
    hypertension: boolean;
    /**
     * Current smoker
     */
    current_smoker: boolean;
    /**
     * Ex-smoker
     */
    ex_smoker: boolean;
    /**
     * Family history of CAD
     */
    family_history: boolean;
    /**
     * Dyslipidemia (history)
     */
    dyslipidemia: boolean;
    /**
     * Chronic renal failure
     */
    chronic_renal_failure: boolean;
    /**
     * Cerebrovascular accident
     */
    cerebrovascular_accident: boolean;
    /**
     * Airway disease
     */
    airway_disease: boolean;
    /**
     * Thyroid disease
     */
    thyroid_disease: boolean;
    /**
     * Congestive heart failure
     */
    congestive_heart_failure: boolean;
    /**
     * Blood pressure (single value) (mmHg)
     */
    bp_mmhg: number;
    /**
     * Pulse rate (bpm)
     */
    pulse_rate_bpm: number;
    /**
     * Edema
     */
    edema: boolean;
    /**
     * Weak peripheral pulse
     */
    weak_peripheral_pulse: boolean;
    /**
     * Lung rales
     */
    lung_rales: boolean;
    /**
     * Systolic murmur
     */
    systolic_murmur: boolean;
    /**
     * Diastolic murmur
     */
    diastolic_murmur: boolean;
    /**
     * Chest pain type
     */
    chest_pain_type: "typical" | "atypical" | "nonanginal" | "none";
    /**
     * Dyspnea
     */
    dyspnea: boolean;
    /**
     * Function Class (integer code as recorded)
     */
    function_class: 0 | 1 | 2 | 3;
    /**
     * Low-threshold angina
     */
    low_threshold_angina: boolean;
    /**
     * Q wave
     */
    q_wave: boolean;
    /**
     * ST elevation
     */
    st_elevation: boolean;
    /**
     * ST depression
     */
    st_depression: boolean;
    /**
     * T-wave inversion
     */
    t_inversion: boolean;
    /**
     * Left ventricular hypertrophy
     */
    lvh: boolean;
    /**
     * Poor R-wave progression
     */
    poor_r_progression: boolean;
    /**
     * Bundle branch block
     */
    bundle_branch_block: "none" | "lbbb" | "rbbb";
    /**
     * Fasting blood sugar (mg/dL)
     */
    fbs: number;
    /**
     * Creatinine (mg/dL)
     */
    creatinine: number;
    /**
     * Triglycerides (mg/dL)
     */
    tg: number;
    /**
     * LDL cholesterol (mg/dL)
     */
    ldl: number;
    /**
     * HDL cholesterol (mg/dL)
     */
    hdl: number;
    /**
     * Blood urea nitrogen (mg/dL)
     */
    bun: number;
    /**
     * Erythrocyte sedimentation rate (mm/h)
     */
    esr: number;
    /**
     * Hemoglobin (g/dL)
     */
    hemoglobin: number;
    /**
     * Potassium (mEq/L)
     */
    potassium: number;
    /**
     * Sodium (mEq/L)
     */
    sodium: number;
    /**
     * White blood cell count (cells/uL)
     */
    wbc: number;
    /**
     * Lymphocytes (%)
     */
    lymphocyte_pct: number;
    /**
     * Neutrophils (%)
     */
    neutrophil_pct: number;
    /**
     * Platelet count (x10^3/uL)
     */
    platelets: number;
    /**
     * Ejection fraction (TTE) (%)
     */
    ef_tte_pct: number;
    /**
     * Region with RWMA (integer code as recorded)
     */
    rwma_region: 0 | 1 | 2 | 3 | 4;
    /**
     * Valvular heart disease
     */
    valvular_heart_disease: "none" | "mild" | "moderate" | "severe";
  };
}

export interface AssessResponse {
  contract_version: "1.0.0";
  model_version: string;
  request_id?: string | null;
  assessment_id: string;
  predictions: {
    CAD: {
      target: "CAD";
      label: string;
      probability: number;
      model_type: "logistic_regression" | "xgboost";
      definition: string;
    };
    LAD: {
      target: "LAD";
      label: string;
      probability: number;
      model_type: "logistic_regression" | "xgboost";
      definition: string;
    };
    LCX: {
      target: "LCX";
      label: string;
      probability: number;
      model_type: "logistic_regression" | "xgboost";
      definition: string;
    };
    RCA: {
      target: "RCA";
      label: string;
      probability: number;
      model_type: "logistic_regression" | "xgboost";
      definition: string;
    };
  };
  model_performance: {
    CAD: {};
    LAD: {};
    LCX: {};
    RCA: {};
  };
  consistency: {
    /**
     * Warning only. Predicted probabilities are never modified, clamped or normalized.
     */
    vessels_exceeding_cad: ("LAD" | "LCX" | "RCA")[];
    /**
     * Display heuristic for the warning below; NOT a clinical or statistical threshold.
     */
    margin: number;
    probabilities_modified: false;
    note: string;
  };
  /**
   * Data-support information about the entered values relative to the training data. These flags are NOT a measure of prediction uncertainty.
   */
  input_checks: {
    derived: {};
    out_of_observed_range: {}[];
    sparse_categories: {}[];
    extrapolation_flag: boolean;
  };
  /**
   * Reserved. Bootstrap/CV variability intervals will be added in a minor version (additive).
   */
  uncertainty: null;
  /**
   * Reserved. Nearest-neighbour distance support check (additive).
   */
  data_support: null;
  population_note: string;
  disclaimer: {
    required_display: true;
  };
}

export interface ApiErrorBody {
  errors: {
    code:
      | "missing_field"
      | "unknown_field"
      | "forbidden_target_field"
      | "derived_field_not_accepted"
      | "invalid_type"
      | "invalid_enum"
      | "not_finite"
      | "invalid_value";
  }[];
}

