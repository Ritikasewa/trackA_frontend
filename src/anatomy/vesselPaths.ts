import * as THREE from "three";
import type { VesselId } from "../api/types";
import { surfacePoint } from "./heartGeometry";
import { taperedTube } from "./tubeGeometry";
/** Schematic coronary paths, defined as (theta, phi) points on the ventricular surface. theta: 0 = patient's left, PI/2 = front, PI = patient's right, 3PI/2 = back. phi: 0 = base (top) .. PI = apex.
 *  These are ILLUSTRATIVE routes (anterior interventricular groove / left AV groove / right AV groove). They carry no patient-specific or lesion-location information. */
const LIFT = 0.05;
const P = (t: number, p: number) => surfacePoint(t, p, LIFT);
const AORTIC_ROOT_LEFT = new THREE.Vector3(0.1, 1.12, 0.12), AORTIC_ROOT_RIGHT = new THREE.Vector3(-0.2, 1.12, 0.1);
const BIFURCATION = P(1.1, 0.8);
export const PATH_POINTS: Record<VesselId, THREE.Vector3[]> = {
  LAD: [BIFURCATION, P(1.15, 1.05), P(1.1, 1.45), P(1.0, 1.9), P(0.85, 2.4), P(0.6, 2.85), P(0.35, 3.02)],
  LCX: [BIFURCATION, P(0.7, 0.86), P(0.3, 0.9), P(-0.15, 0.97), P(-0.65, 1.05), P(-1.1, 1.15), P(-1.45, 1.35)],
  RCA: [AORTIC_ROOT_RIGHT, P(2.35, 0.82), P(2.75, 0.86), P(3.2, 0.95), P(3.7, 1.08), P(4.15, 1.35), P(4.45, 1.8), P(4.6, 2.3)],
};
export const LEFT_MAIN_POINTS = [AORTIC_ROOT_LEFT, AORTIC_ROOT_LEFT.clone().lerp(BIFURCATION, 0.55).add(new THREE.Vector3(0.05, 0.02, 0.1)), BIFURCATION];
const RADII: Record<VesselId, [number, number]> = { LAD: [0.078, 0.038], LCX: [0.064, 0.032], RCA: [0.078, 0.036] };
export interface VesselGeometry { curve: THREE.CatmullRomCurve3; tube: THREE.BufferGeometry; outline: THREE.BufferGeometry; hit: THREE.BufferGeometry; capStart: THREE.Vector3; capEnd: THREE.Vector3; radii: [number, number]; labelAnchor: THREE.Vector3 }
const cache: Partial<Record<VesselId, VesselGeometry>> = {};
export function vesselGeometry(id: VesselId): VesselGeometry {
  const hit = cache[id]; if (hit) return hit; const curve = new THREE.CatmullRomCurve3(PATH_POINTS[id], false, "centripetal"); const [r0, r1] = RADII[id];
  const anchor = curve.getPointAt(id === "LCX" ? 0.55 : id === "RCA" ? 0.5 : 0.5).clone();
  const g: VesselGeometry = { curve, tube: taperedTube(curve, 64, 10, r0, r1), outline: taperedTube(curve, 64, 10, r0 + 0.024, r1 + 0.024), hit: taperedTube(curve, 24, 6, 0.13, 0.1), capStart: curve.getPointAt(0), capEnd: curve.getPointAt(1), radii: [r0, r1], labelAnchor: anchor };
  cache[id] = g; return g;
}
export const leftMainCurve = (): THREE.CatmullRomCurve3 => new THREE.CatmullRomCurve3(LEFT_MAIN_POINTS, false, "centripetal");
