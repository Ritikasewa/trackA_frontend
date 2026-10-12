/** Static wording for the SHAP Analysis page. Model explainability only: no diagnosis, no treatment/medication advice, no causal claims. */
export const SHAP_TITLE = "SHAP Analysis";
export const SHAP_SUBTITLE = "Why did the model produce this estimate?";
export const SHAP_STATEMENT = "These values show how individual inputs influenced this model's estimate for this patient. They describe the model's attribution, not causes of disease or treatment recommendations.";
export const SHAP_UNITS = "Contribution to model estimate is shown in log-odds units. For each model, the reference plus all contributions equals this patient's model estimate on the log-odds scale; a positive contribution moves the model estimate up, a negative one moves it down.";
export const SHAP_REFERENCE_NOTE = "The reference is defined separately for each model (see the definition under the reference estimate) and is not a clinical baseline risk. The logistic models use the training-data mean as their reference; the LCX XGBoost model uses its TreeSHAP expected output, which is a different definition.";
export const TOP_TITLE = "Factors influencing this model estimate";
export const TOP_SUB = "The 10 inputs with the largest contribution to this model estimate (by absolute value).";
export const POSITIVE_TITLE = "Positive contributions";
export const POSITIVE_SUB = "move this model estimate up";
export const NEGATIVE_TITLE = "Negative contributions";
export const NEGATIVE_SUB = "move this model estimate down";
export const SECTION_TITLE = "Contribution by section";
export const SECTION_SUB = "The contributions of all inputs in each form section, added together.";
export const TABLE_FOOTNOTE = "The table lists the 50 inputs plus one derived BMI row (computed from weight and height, not entered separately). “Typical training value” is the training median (numbers) or most common value (categories), shown for context only; contributions are measured from each model's own reference, so a value equal to the typical value can still have a small non-zero contribution. Weight, height and BMI overlap, so their individual contributions can offset each other.";
export const weakExplainWarning = (target: string): string =>
  `This explanation describes the ${target} model's attribution. These vessel-specific models have limited predictive strength in this dataset, so individual feature contributions should be interpreted cautiously.`;
export const signed = (x: number): string => { const a = Math.abs(x); const t = a < 0.01 ? a.toFixed(3) : a.toFixed(2); return `${x < 0 ? "−" : "+"}${t}`; };
/** Section names on the SHAP page: the form's six sections, but the page never calls inputs "risk factors". */
export const SECTION_LABELS: Record<string, string> = { demographics: "Demographics", history_risk_factors: "Medical history / risk", exam_symptoms: "Examination / Symptoms", ecg: "ECG", labs: "Laboratory", echo: "Echocardiography" };
