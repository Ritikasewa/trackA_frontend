import { useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { VesselId } from "../../api/types";
import { HEART_BODY, NEUTRAL_STEM, NEUTRAL_VESSEL, probabilityToColor } from "../../domain/colorScale";
import { VESSEL_IDS, VESSELS } from "../../domain/vessels";
import type { SceneProps } from "./CoronaryScene";
export const HEART_MODEL_URL = `${import.meta.env.BASE_URL}models/heart_anatomy.glb`;
const CONTEXT: Record<string, { color: string; roughness: number }> = {
  wall_ventricles: { color: HEART_BODY, roughness: 0.45 }, wall_atria: { color: "#9a2b39", roughness: 0.5 }, great_vessels: { color: "#c4545f", roughness: 0.5 },
};
/** Copy of a geometry pushed outward along its vertex normals: used for the outline/halo and the (invisible) click target of the thin vessels. */
function grown(src: THREE.BufferGeometry, by: number): THREE.BufferGeometry {
  const g = src.clone(); const p = g.getAttribute("position") as THREE.BufferAttribute; const n = g.getAttribute("normal") as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * by, p.getY(i) + n.getY(i) * by, p.getZ(i) + n.getZ(i) * by);
  p.needsUpdate = true; return g;
}
function ModelVessel({ id, geometry, color, selected, onSelect }: { id: VesselId; geometry: THREE.BufferGeometry; color: string; selected: boolean; onSelect: (id: VesselId) => void }) {
  const [hover, setHover] = useState(false); const outline = useMemo(() => grown(geometry, 0.035), [geometry]); const hit = useMemo(() => grown(geometry, 0.12), [geometry]);
  return (
    <group name={VESSELS[id].sceneNodeName} userData={{ targetId: id }}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
      <mesh name={`${id}_tube`} geometry={geometry}><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      {!(selected || hover) && <mesh name={`${id}_halo`} geometry={outline}><meshBasicMaterial color="#ffffff" side={THREE.BackSide} toneMapped={false} /></mesh>}
      {(selected || hover) && <mesh name={`${id}_outline`} geometry={outline}><meshBasicMaterial color={selected ? "#111827" : "#6b7280"} side={THREE.BackSide} toneMapped={false} /></mesh>}
      <mesh name={`${id}_hit`} geometry={hit}><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
    </group>
  );
}
function Loaded({ probabilities, selected, onSelect, onReady }: SceneProps & { onReady: () => void }) {
  const { scene } = useGLTF(HEART_MODEL_URL); useEffect(onReady, [onReady]);
  const geo = (name: string): THREE.BufferGeometry | null => { const m = scene.getObjectByName(name) as THREE.Mesh | undefined; if (!m?.isMesh) return null; if (!m.geometry.getAttribute("normal")) m.geometry.computeVertexNormals(); return m.geometry; };
  const stem = geo("left_main_stem");
  return (
    <group name="coronary_scene">
      <group name="anatomical_heart" userData={{ role: "context" }}>
        {Object.entries(CONTEXT).map(([name, m]) => { const g = geo(name); return g ? <mesh key={name} name={name} geometry={g}><meshPhysicalMaterial color={m.color} roughness={m.roughness} metalness={0} clearcoat={0.4} clearcoatRoughness={0.35} side={THREE.DoubleSide} /></mesh> : null; })}
      </group>
      {stem && <mesh name="left_main_stem" geometry={stem}><meshBasicMaterial color={NEUTRAL_STEM} toneMapped={false} /></mesh>}
      {VESSEL_IDS.map((id) => { const g = geo(`vessel_${id}`); return g ? <ModelVessel key={id} id={id} geometry={g} color={probabilities ? probabilityToColor(probabilities[id]) : NEUTRAL_VESSEL} selected={selected === id} onSelect={onSelect} /> : null; })}
    </group>
  );
}
class ModelBoundary extends Component<{ fallback: ReactNode; onFail: () => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onFail(); }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
/** CT-derived anatomical heart. While the model loads, or if it cannot be loaded, the procedural schematic scene is shown instead (same vessels, same colors). */
export function AnatomicalScene(props: SceneProps & { fallback: ReactNode; onState: (s: "model" | "schematic") => void }) {
  const { fallback, onState, ...scene } = props;
  return (
    <ModelBoundary fallback={fallback} onFail={() => onState("schematic")}>
      <Suspense fallback={fallback}><Loaded {...scene} onReady={() => onState("model")} /></Suspense>
    </ModelBoundary>
  );
}
