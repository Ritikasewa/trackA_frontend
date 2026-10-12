import * as THREE from "three";
/** Procedural, schematic heart. Coordinates: +y up, +z toward the viewer (front view), +x = viewer's right = the PATIENT'S LEFT. */
export const HEART_CENTER = new THREE.Vector3(0.12, 0.05, 0);
export const dirFromAngles = (theta: number, phi: number): THREE.Vector3 => new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
/** Maps a unit direction to a point on the ventricular surface (tapered toward an apex that points down and to the patient's left). */
export function deform(d: THREE.Vector3): THREE.Vector3 {
  let x = d.x * 0.95, y = d.y * 1.25, z = d.z * 0.85; const t = Math.max(0, -d.y);
  const taper = 1 - 0.62 * Math.pow(t, 1.4); x *= taper; z *= taper; x += 0.42 * Math.pow(t, 1.6); if (y > 0) y *= 0.82;
  return new THREE.Vector3(x, y, z);
}
/** Point on the ventricular surface at (theta, phi), optionally lifted along the outward normal. Used for BOTH the heart mesh and the vessel paths so vessels hug the surface. */
export function surfacePoint(theta: number, phi: number, offset = 0): THREE.Vector3 {
  const p = deform(dirFromAngles(theta, phi)); if (offset === 0) return p; const e = 1e-3;
  const dt = deform(dirFromAngles(theta + e, phi)).sub(deform(dirFromAngles(theta - e, phi))); const dp = deform(dirFromAngles(theta, phi + e)).sub(deform(dirFromAngles(theta, phi - e)));
  const n = new THREE.Vector3().crossVectors(dt, dp).normalize(); if (n.dot(p.clone().sub(HEART_CENTER)) < 0) n.negate(); return p.add(n.multiplyScalar(offset));
}
export function buildVentricleGeometry(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 64, 48); const pos = g.getAttribute("position") as THREE.BufferAttribute; const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).normalize(); const p = deform(v); pos.setXYZ(i, p.x, p.y, p.z); }
  g.computeVertexNormals(); return g;
}
/** Context structures (no data attached): atria, great vessels. */
export const CONTEXT_PARTS = [
  { name: "right_atrium", kind: "sphere" as const, pos: [-0.8, 1.2, 0.05] as const, scale: [0.42, 0.4, 0.38] as const },
  { name: "left_atrial_appendage", kind: "sphere" as const, pos: [0.78, 1.12, 0.3] as const, scale: [0.28, 0.3, 0.26] as const },
  { name: "left_atrium", kind: "sphere" as const, pos: [0.2, 1.05, -0.5] as const, scale: [0.6, 0.38, 0.38] as const },
  { name: "aorta", kind: "cyl" as const, pos: [-0.05, 1.65, -0.05] as const, scale: [0.22, 0.95, 0.22] as const, rotZ: 0 as number },
  { name: "pulmonary_trunk", kind: "cyl" as const, pos: [0.3, 1.6, 0.4] as const, scale: [0.2, 0.85, 0.2] as const, rotZ: -0.3 as number },
  { name: "superior_vena_cava", kind: "cyl" as const, pos: [-0.85, 1.75, 0.0] as const, scale: [0.14, 0.8, 0.14] as const, rotZ: 0 as number },
];
