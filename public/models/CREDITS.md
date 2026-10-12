# 3D heart model credits

`heart_anatomy.glb` is derived from **BodyParts3D** (BP51782, FMA67135 "Anatomical structure"; https://lifesciencedb.jp/bp3d/):
BodyParts3D, (c) The Database Center for Life Science, licensed under the Creative Commons Attribution-Share Alike 2.1 Japan license (https://creativecommons.org/licenses/by-sa/2.1/jp/).

Because the licence is Share-Alike, this derived model file (`heart_anatomy.glb`) is distributed under the same CC BY-SA 2.1 Japan licence. The application code is a separate work.

Changes made here (see `scripts/build_heart_model.py`): selected the ventricular walls, atrial walls and auricles, aorta and pulmonary trunk; selected the coronary-artery parts by their FMA ids and grouped them as LAD (anterior interventricular trunk and its branches), LCX (circumflex trunk, left marginal and posterior branches), RCA (right coronary trunk and branches) and left main stem; welded and simplified the meshes; rotated to the viewer's axes; rescaled and re-centred.
The arteries are the model's own named anatomical parts. The display is schematic and not patient-specific.
