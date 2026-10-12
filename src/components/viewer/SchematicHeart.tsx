import { useMemo } from "react";
import * as THREE from "three";
import { CONTEXT_PARTS, buildVentricleGeometry } from "../../anatomy/heartGeometry";
import { HEART_BODY } from "../../domain/colorScale";
/** Neutral, non-selectable context anatomy. It is NOT colored by any prediction (the contract has no prediction for the heart muscle). */
export function SchematicHeart() {
  const ventricles = useMemo(() => buildVentricleGeometry(), []);
  return (
    <group name="schematic_heart" userData={{ role: "context" }}>
      <mesh name="ventricles" geometry={ventricles}><meshPhysicalMaterial color={HEART_BODY} roughness={0.42} metalness={0} clearcoat={0.55} clearcoatRoughness={0.28} /></mesh>
      {CONTEXT_PARTS.map((p) => (
        <mesh key={p.name} name={p.name} position={[...p.pos]} scale={[...p.scale]} rotation={[0, 0, ("rotZ" in p ? p.rotZ : 0) ?? 0]}>
          {p.kind === "sphere" ? <sphereGeometry args={[1, 36, 24]} /> : <cylinderGeometry args={[1, 1, 1, 36]} />}
          <meshPhysicalMaterial color={p.name.includes("atri") ? "#9a2b39" : "#c4545f"} roughness={0.5} metalness={0} clearcoat={0.35} clearcoatRoughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
export const _THREE = THREE;
