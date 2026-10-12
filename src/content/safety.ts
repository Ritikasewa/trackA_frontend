/** Patient-facing safety copy. Static UI text only: it contains no model output, no thresholds and no treatment advice.
 *  Every statement is limited to what the approved disclaimer / model card / frontend plan already supports. */
export const SAFETY_TITLE = "Safety & next steps";
export const URGENT_CARE =
  "If you are currently experiencing severe or persistent chest pain, difficulty breathing, fainting, or other concerning symptoms, seek urgent medical care now (contact your local emergency services) rather than relying on this tool.";
export const SAFETY_POINTS: string[] = [
  "These results are estimates from a machine-learning model. They are not a diagnosis.",
  "Do not use these results to start, stop, or change any medication or treatment.",
  "Discuss these results with a qualified healthcare professional, particularly if you have symptoms or cardiovascular risk factors.",
  "A low model estimate is not a statement that you are safe or free of heart disease, and a high estimate does not confirm it.",
  "This tool does not replace formal diagnostic imaging or evaluation by a clinician, and it gives no personal treatment, medication, or dosage advice.",
  "The model has no information about where along an artery a narrowing might be, or how large it is.",
];
export const SCHEMATIC_NOTICE =
  "Schematic vessel-level model probabilities — not a patient-specific anatomical scan. Highlighting does not indicate the location or size of an actual blockage.";
export const FORM_EMERGENCY_NOTE = "This tool is not for emergencies. If you have severe or persistent chest pain, difficulty breathing, or fainting, seek urgent medical care.";
export const PLAIN_DEFINITION: Record<"CAD" | "LAD" | "LCX" | "RCA", string> = {
  CAD: "The model's estimated probability that coronary artery disease is present, using the training dataset's overall CAD label.",
  LAD: "The model's estimated probability that this artery has a narrowing of 50% or more (the training dataset's whole-vessel label).",
  LCX: "The model's estimated probability that this artery has a narrowing of 50% or more (the training dataset's whole-vessel label).",
  RCA: "The model's estimated probability that this artery has a narrowing of 50% or more (the training dataset's whole-vessel label).",
};
