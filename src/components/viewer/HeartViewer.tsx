import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Vector3, type Mesh } from "three";
import type { TargetId, VesselId } from "../../api/types";
import { vesselGeometry } from "../../anatomy/vesselPaths";
import { formatPercent } from "../../domain/probability";
import { VESSEL_IDS } from "../../domain/vessels";
import { type TargetView, useStore, viewsFromAssessment } from "../../state/store";
import { AnatomicalScene, HEART_MODEL_URL } from "./AnatomicalScene";
import { CoronaryScene } from "./CoronaryScene";
import { ColorLegend, SchematicNotice, ViewControls } from "./ViewOverlays";
import { PRESETS, useView } from "./viewStore";
const TARGET = [0.12, 0.35, 0] as const;
function CameraRig() {
  const { camera, controls, invalidate } = useThree(); const nonce = useView((s) => s.nonce);
  useEffect(() => { const [x, y, z] = PRESETS[useView.getState().preset]; camera.position.set(x, y, z); camera.lookAt(...TARGET); const c = controls as unknown as { target: { set: (a: number, b: number, c: number) => void }; update: () => void } | null; c?.target.set(...TARGET); c?.update(); invalidate(); }, [nonce, camera, controls, invalidate]);
  return null;
}
type LabelRefs = { current: Partial<Record<VesselId, HTMLButtonElement | null>> };
/** Projects each vessel's 3D anchor to screen space every rendered frame and positions its DOM label (no drei <Html>: avoids React-19 root-unmount issues and keeps labels real, focusable buttons). */
function LabelProjector({ refs }: { refs: LabelRefs }) {
  const anchors = useMemo(() => Object.fromEntries(VESSEL_IDS.map((id) => [id, vesselGeometry(id).labelAnchor])) as Record<VesselId, Vector3>, []);
  const v = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const id of VESSEL_IDS) { const el = refs.current[id]; if (!el) continue; v.copy(anchors[id]).project(camera);
      el.style.transform = `translate(${(v.x * 0.5 + 0.5) * size.width}px, ${(-v.y * 0.5 + 0.5) * size.height}px) translate(-50%, -50%)`; el.style.visibility = v.z > 1 ? "hidden" : "visible"; }
  });
  return null;
}
/** Anatomical heart: each label sits on the part of ITS artery that currently faces the camera, and is hidden while most of that artery is on the far side of the heart (e.g. the LCX from the front), so a label never points at a different artery. */
const HEART_CENTRE = new Vector3(0.12, 0.2, 0); const MIN_VISIBLE = 0.4;
function ModelLabelProjector({ refs }: { refs: LabelRefs }) {
  const { scene } = useGLTF(HEART_MODEL_URL);
  const samples = useMemo(() => Object.fromEntries(VESSEL_IDS.map((id) => {
    const mesh = scene.getObjectByName(`vessel_${id}`) as Mesh | undefined; const pts: Vector3[] = []; const pos = mesh?.geometry.getAttribute("position");
    if (pos) { const step = Math.max(1, Math.floor(pos.count / 600)); for (let i = 0; i < pos.count; i += step) pts.push(new Vector3().fromBufferAttribute(pos, i)); }
    return [id, pts];
  })) as Record<VesselId, Vector3[]>, [scene]);
  const v = useMemo(() => new Vector3(), []); const dir = useMemo(() => new Vector3(), []); const mean = useMemo(() => new Vector3(), []); const rel = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    dir.copy(camera.position).sub(HEART_CENTRE).normalize();
    for (const id of VESSEL_IDS) {
      const el = refs.current[id]; if (!el) continue; const all = samples[id]; const facing = all.filter((p) => rel.copy(p).sub(HEART_CENTRE).dot(dir) > 0);
      if (all.length === 0 || facing.length / all.length < MIN_VISIBLE) { el.style.visibility = "hidden"; continue; }
      mean.set(0, 0, 0); for (const p of facing) mean.add(p); mean.divideScalar(facing.length);
      let best = facing[0]!; let bd = Infinity; for (const p of facing) { const d = p.distanceToSquared(mean); if (d < bd) { bd = d; best = p; } }
      v.copy(best).project(camera);
      el.style.transform = `translate(${(v.x * 0.5 + 0.5) * size.width}px, ${(-v.y * 0.5 + 0.5) * size.height}px) translate(-50%, -50%)`; el.style.visibility = v.z > 1 ? "hidden" : "visible";
    }
  });
  return null;
}
function LabelLayer({ views, selected, select, refs }: { views: Record<TargetId, TargetView> | null; selected: TargetId | null; select: (t: TargetId) => void; refs: LabelRefs }) {
  return (
    <div className="label-layer">
      {VESSEL_IDS.map((id) => { const v = views?.[id]; return (
        <button key={id} type="button" ref={(el) => { refs.current[id] = el; }} className={`vlabel ${selected === id ? "selected" : ""} ${v?.flagged ? "flagged" : ""}`} data-testid={`vessel-label-${id}`} onClick={() => select(id)}
          aria-label={v ? `${id} ${formatPercent(v.probability)}${v.flagged ? ", above overall CAD" : ""}. Select ${id}` : `${id}, no assessment yet. Select ${id}`}>
          <span className="vl-id">{id}</span> <span className="vl-p">{v ? formatPercent(v.probability) : "—"}</span>{v?.flagged && <span className="vl-w" title="Above overall CAD probability"> ⚠</span>}
        </button>); })}
    </div>
  );
}
export function HeartViewer() {
  const assessment = useStore((s) => s.assessment); const views = useMemo(() => viewsFromAssessment(assessment), [assessment]); const selected = useStore((s) => s.selected); const select = useStore((s) => s.select); const [mode, setMode] = useState<"model" | "schematic">("schematic"); const heartModel = useView((s) => s.model); const refs: LabelRefs = useRef<Partial<Record<VesselId, HTMLButtonElement | null>>>({});
  const probs = useMemo(() => (views ? ({ LAD: views.LAD.probability, LCX: views.LCX.probability, RCA: views.RCA.probability } as Record<VesselId, number>) : null), [views]);
  return (
    <div className="viewer" data-testid="viewer">
      <Canvas flat dpr={[1, 1.5]} frameloop="demand" camera={{ position: [...PRESETS.front], fov: 32 }} onPointerMissed={() => select(null)} gl={{ antialias: true, alpha: true }} aria-label="Interactive 3D model of the heart and the LAD, LCX and RCA coronary arteries">
        <hemisphereLight args={["#ffffff", "#c9a3a8", 0.9]} /><directionalLight position={[3, 4, 5]} intensity={1.7} /><directionalLight position={[-5, 1, 2]} intensity={0.6} color="#ffe9e9" /><directionalLight position={[-3, -2, -4]} intensity={0.5} />
        {heartModel === "anatomical"
          ? <AnatomicalScene probabilities={probs} selected={selected} onSelect={select} onState={setMode} fallback={<CoronaryScene probabilities={probs} selected={selected} onSelect={select} />} />
          : <CoronaryScene probabilities={probs} selected={selected} onSelect={select} />}
        {heartModel === "anatomical" && mode === "model" ? <ModelLabelProjector refs={refs} /> : <LabelProjector refs={refs} />}
        <CameraRig /><OrbitControls makeDefault enablePan={false} target={[...TARGET]} minDistance={4} maxDistance={12} />
      </Canvas>
      <LabelLayer views={views} selected={selected} select={select} refs={refs} /><SchematicNotice /><ColorLegend /><ViewControls />
    </div>
  );
}
