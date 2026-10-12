"""Builds public/models/heart_anatomy.glb and src/anatomy/heartAnatomy.json from the BodyParts3D heart (BP51782, FMA67135 'Anatomical structure').
Usage: python scripts/build_heart_model.py <extracted BP51782 folder> [out_dir] [json_path]
Source: BodyParts3D, (c) The Database Center for Life Science, licensed under CC Attribution-Share Alike 2.1 Japan.
The coronary arteries are the model's own NAMED parts (FMA ids below); nothing is guessed from geometry. Display only: not patient-specific."""
import sys, os, re, glob, json, collections, numpy as np, trimesh
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else "public/models"; jpath = sys.argv[3] if len(sys.argv) > 3 else "src/anatomy/heartAnatomy.json"
SCALE = 0.022                                  # source mm -> scene units
HEART_CENTER = np.array([0.12, 0.2, 0.0]); VESSEL_GROW_MM = 0.7; TARGET_FACES = {"wall_ventricles": 40000, "wall_atria": 26000, "great_vessels": 8000}
# FMA ids per output mesh
GROUPS = {
  "vessel_LAD": [74912, 3860, 3888, 3890, 3893],                      # trunk + branches of the anterior interventricular (descending) branch
  "vessel_LCX": [74923, 3902, 3914, 79742],                            # circumflex trunk, left marginal, posterior ventricular + posterior interventricular branches (as named in FMA)
  "vessel_RCA": [3802, 3807, 3815, 3818, 3823, 3829, 3837, 3851],      # right coronary trunk + branches
  "left_main_stem": [4685],                                            # stem of the left coronary artery (no model estimate for it)
  "wall_ventricles": [84850, 9345, 49207, 49208],
  "wall_atria": [49285, 49286, 49292, 9306, 9542, 9562, 49299, 9547, 84094, 84095, 7108],
  "great_vessels": [15098, 23733, 15086],
}
parts = collections.defaultdict(list)
for f in sorted(glob.glob(os.path.join(src, "*.obj"))):
    m = re.match(r"MM\d+_BP\d+_FMA(\d+)_", os.path.basename(f)); parts[int(m.group(1))].append(trimesh.load(f, force="mesh", process=False))
def build(name):
    m = trimesh.util.concatenate([x for f in GROUPS[name] for x in parts.get(f, [])]); assert len(m.faces), name
    m.merge_vertices(digits_vertex=1) if False else m.merge_vertices()
    if name in TARGET_FACES and len(m.faces) > TARGET_FACES[name]: m = m.simplify_quadric_decimation(face_count=TARGET_FACES[name])
    return m
meshes = {k: build(k) for k in GROUPS}
# source frame: +x = patient's left, +z = up, -y = anterior  ->  scene frame: +x left, +y up, +z anterior
R = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]], float)
ctx = np.vstack([meshes[k].vertices for k in ("wall_ventricles", "wall_atria", "great_vessels")]) @ R.T; centre = (ctx.min(axis=0) + ctx.max(axis=0)) / 2
scene = trimesh.Scene(); anchors = {}
for k, m in meshes.items():
    m = m.copy()
    if k.startswith(("vessel_", "left_main")): m.vertices = m.vertices + m.vertex_normals * VESSEL_GROW_MM        # arteries are thin: thicken slightly so they stay readable and clickable
    m.vertices = (m.vertices @ R.T - centre) * SCALE + HEART_CENTER
    m.faces = m.faces[:, ::-1] if np.linalg.det(R) < 0 else m.faces
    m.fix_normals(); m.vertex_normals                                      # smooth vertex normals are exported
    scene.add_geometry(m, node_name=k, geom_name=k)
    if k.startswith("vessel_"): anchors[k[7:]] = [float(x) for x in m.vertices[np.argmax(m.vertices[:, 2])]]   # front-most vertex: the label stays on the visible side in the front view
    print(f"{k:16s} faces={len(m.faces):6d}")
os.makedirs(out, exist_ok=True); scene.export(os.path.join(out, "heart_anatomy.glb"))
json.dump({"scale": SCALE, "labelAnchors": anchors, "source": "BodyParts3D BP51782 (FMA67135), (c) DBCLS, CC BY-SA 2.1 Japan"}, open(jpath, "w"), indent=1); print("anchors", anchors)
