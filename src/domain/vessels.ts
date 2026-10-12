import type { TargetId, VesselId } from "../api/types";
/** THE single mapping registry: API target id <-> 3D scene node <-> display strings. Everything else looks vessels up by id from here (never by array position or name parsing). */
export const VESSEL_IDS: readonly VesselId[] = ["LAD", "LCX", "RCA"] as const;
export const TARGET_IDS: readonly TargetId[] = ["CAD", "LAD", "LCX", "RCA"] as const;
export interface VesselInfo { id: VesselId; sceneNodeName: string; fullName: string; supplies: string }
// 'supplies' wording is taken from the Track A problem statement primer.
export const VESSELS: Record<VesselId, VesselInfo> = {
  LAD: { id: "LAD", sceneNodeName: "vessel_LAD", fullName: "Left anterior descending artery", supplies: "Supplies blood to the front of the heart." },
  LCX: { id: "LCX", sceneNodeName: "vessel_LCX", fullName: "Left circumflex artery", supplies: "Supplies blood to the side and back of the heart." },
  RCA: { id: "RCA", sceneNodeName: "vessel_RCA", fullName: "Right coronary artery", supplies: "Supplies blood to the right side and bottom of the heart." },
};
export const targetForSceneNode = (name: string): VesselId | null => VESSEL_IDS.find((v) => VESSELS[v].sceneNodeName === name) ?? null;
export const isVessel = (t: TargetId): t is VesselId => t !== "CAD";
export const MODEL_LABEL: Record<string, string> = { logistic_regression: "Logistic regression", xgboost: "XGBoost (gradient-boosted trees)" };
