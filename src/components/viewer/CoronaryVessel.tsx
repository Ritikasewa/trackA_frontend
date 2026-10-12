import { useMemo, useState } from "react";
import * as THREE from "three";
import type { VesselId } from "../../api/types";
import { vesselGeometry } from "../../anatomy/vesselPaths";
import { VESSELS } from "../../domain/vessels";
export interface VesselProps { id: VesselId; color: string; selected: boolean; onSelect: (id: VesselId) => void }
/** One selectable vessel. The scene node name comes from the registry (vessel_LAD / vessel_LCX / vessel_RCA) and userData.targetId carries the API id. ONE uniform color along the whole vessel: no hotspots. */
export function CoronaryVessel({ id, color, selected, onSelect }: VesselProps) {
  const g = useMemo(() => vesselGeometry(id), [id]); const [hover, setHover] = useState(false);
  return (
    <group name={VESSELS[id].sceneNodeName} userData={{ targetId: id }}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
      <mesh name={`${id}_tube`} geometry={g.tube}><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      <mesh name={`${id}_cap_start`} position={g.capStart}><sphereGeometry args={[g.radii[0], 12, 8]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      <mesh name={`${id}_cap_end`} position={g.capEnd}><sphereGeometry args={[g.radii[1], 12, 8]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      {!(selected || hover) && <mesh name={`${id}_halo`} geometry={g.outline}><meshBasicMaterial color="#ffffff" side={THREE.BackSide} toneMapped={false} /></mesh>}
      {(selected || hover) && <mesh name={`${id}_outline`} geometry={g.outline}><meshBasicMaterial color={selected ? "#111827" : "#6b7280"} side={THREE.BackSide} toneMapped={false} /></mesh>}
      <mesh name={`${id}_hit`} geometry={g.hit}><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
    </group>
  );
}
