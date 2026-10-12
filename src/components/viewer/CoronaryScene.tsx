import { useMemo } from "react";
import type { TargetId, VesselId } from "../../api/types";
import { leftMainCurve } from "../../anatomy/vesselPaths";
import { taperedTube } from "../../anatomy/tubeGeometry";
import { NEUTRAL_STEM, NEUTRAL_VESSEL, probabilityToColor } from "../../domain/colorScale";
import { VESSEL_IDS } from "../../domain/vessels";
import { CoronaryVessel } from "./CoronaryVessel";
import { SchematicHeart } from "./SchematicHeart";
/** Pure scene (no DOM, no Canvas) so the API->3D mapping can be tested with the R3F test renderer. */
export interface SceneProps { probabilities: Record<VesselId, number> | null; selected: TargetId | null; onSelect: (id: VesselId) => void }
export function CoronaryScene({ probabilities, selected, onSelect }: SceneProps) {
  const stem = useMemo(() => taperedTube(leftMainCurve(), 16, 8, 0.07, 0.062), []);
  return (
    <group name="coronary_scene">
      <SchematicHeart />
      <mesh name="left_main_stem" geometry={stem}><meshBasicMaterial color={NEUTRAL_STEM} toneMapped={false} /></mesh>
      {VESSEL_IDS.map((id) => <CoronaryVessel key={id} id={id} color={probabilities ? probabilityToColor(probabilities[id]) : NEUTRAL_VESSEL} selected={selected === id} onSelect={onSelect} />)}
    </group>
  );
}
