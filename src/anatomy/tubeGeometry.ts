import * as THREE from "three";
/** Tube with linearly tapering radius (r0 at the start, r1 at the end). */
export function taperedTube(curve: THREE.Curve<THREE.Vector3>, tubular: number, radial: number, r0: number, r1: number): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubular, false); const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular; const P = curve.getPointAt(t); const N = frames.normals[i]!, B = frames.binormals[i]!; const r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * Math.PI * 2; const n = N.clone().multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a)); pos.push(P.x + r * n.x, P.y + r * n.y, P.z + r * n.z); nor.push(n.x, n.y, n.z); }
  }
  for (let i = 0; i < tubular; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = (i + 1) * (radial + 1) + j; idx.push(a, a + 1, b, b, a + 1, b + 1); /* outward-facing winding: BackSide outlines must render BEHIND the colored tube */ }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
