// @vitest-environment node
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { describe, expect, it, vi } from "vitest";
import { CoronaryScene } from "../../src/components/viewer/CoronaryScene";
import { NEUTRAL_VESSEL, probabilityToColor } from "../../src/domain/colorScale";
import { VESSELS, VESSEL_IDS } from "../../src/domain/vessels";
import { EXCEEDS, GOLDEN } from "../helpers";
const probsOf = (r: any) => ({ LAD: r.predictions.LAD.probability, LCX: r.predictions.LCX.probability, RCA: r.predictions.RCA.probability });
const colorOf = (mesh: any) => `#${mesh.instance.material.color.getHexString()}`;
describe("API -> 3D mapping (predictions.<id> -> vessel_<id>)", () => {
  const cases = { ...GOLDEN, exceeds: EXCEEDS.response } as Record<string, any>;
  for (const [name, resp] of Object.entries(cases)) it(`${name}: each vessel mesh is colored from ITS OWN returned probability`, async () => {
    const r = await ReactThreeTestRenderer.create(<CoronaryScene probabilities={probsOf(resp)} selected={null} onSelect={() => {}} />);
    for (const id of VESSEL_IDS) {
      const nodes = r.scene.findAllByProps({ name: VESSELS[id].sceneNodeName }); expect(nodes, id).toHaveLength(1); expect(nodes[0]!.props.userData.targetId).toBe(id);
      const expected = probabilityToColor(resp.predictions[id].probability); for (const part of ["tube", "cap_start", "cap_end"]) expect(colorOf(r.scene.findByProps({ name: `${id}_${part}` })), `${id} ${part}`).toBe(expected);
    }
    await r.unmount();
  });
  it("there is no CAD vessel: the overall CAD probability does not color anything", async () => {
    const r = await ReactThreeTestRenderer.create(<CoronaryScene probabilities={probsOf(GOLDEN.median_cad_row)} selected={null} onSelect={() => {}} />);
    expect(r.scene.findAllByProps({ name: "vessel_CAD" })).toHaveLength(0); const heart = r.scene.findByProps({ name: "ventricles" }); expect(colorOf(heart)).not.toBe(probabilityToColor(GOLDEN.median_cad_row.predictions.CAD.probability)); await r.unmount();
  });
  it("vessels get three different colors when their probabilities differ (no cross-wiring)", async () => {
    const r = await ReactThreeTestRenderer.create(<CoronaryScene probabilities={{ LAD: 0.9, LCX: 0.1, RCA: 0.5 }} selected={null} onSelect={() => {}} />);
    expect(colorOf(r.scene.findByProps({ name: "LAD_tube" }))).toBe(probabilityToColor(0.9)); expect(colorOf(r.scene.findByProps({ name: "LCX_tube" }))).toBe(probabilityToColor(0.1)); expect(colorOf(r.scene.findByProps({ name: "RCA_tube" }))).toBe(probabilityToColor(0.5)); await r.unmount();
  });
  it("no assessment -> neutral gray vessels (never a 0% color)", async () => {
    const r = await ReactThreeTestRenderer.create(<CoronaryScene probabilities={null} selected={null} onSelect={() => {}} />);
    for (const id of VESSEL_IDS) expect(colorOf(r.scene.findByProps({ name: `${id}_tube` }))).toBe(NEUTRAL_VESSEL); expect(NEUTRAL_VESSEL).not.toBe(probabilityToColor(0)); await r.unmount();
  });
  it("probabilities are used unclamped: 0 and 1 map to the viridis end points; an out-of-range value throws instead of being clamped", async () => {
    const r = await ReactThreeTestRenderer.create(<CoronaryScene probabilities={{ LAD: 0, LCX: 1, RCA: 0.5 }} selected={null} onSelect={() => {}} />);
    expect(colorOf(r.scene.findByProps({ name: "LAD_tube" }))).toBe("#440154"); expect(colorOf(r.scene.findByProps({ name: "LCX_tube" }))).toBe("#fde725"); await r.unmount();
    await expect(ReactThreeTestRenderer.create(<CoronaryScene probabilities={{ LAD: 1.2, LCX: 0.5, RCA: 0.5 }} selected={null} onSelect={() => {}} />)).rejects.toThrow();
  });
  it("one uniform color per vessel: no hotspot meshes exist", async () => {
    const r = await ReactThreeTestRenderer.create(<CoronaryScene probabilities={probsOf(GOLDEN.median_cad_row)} selected={null} onSelect={() => {}} />);
    for (const id of VESSEL_IDS) { const g = r.scene.findByProps({ name: VESSELS[id].sceneNodeName }); const kids = g.allChildren.filter((c: any) => !c.props.name?.endsWith("_hit")); const halo = kids.filter((c: any) => c.props.name === `${id}_halo`); expect(halo).toHaveLength(1); /* neutral white rim for contrast, never data-colored */ expect(String(colorOf(halo[0])).toLowerCase()).toMatch(/ffffff|^1$|white/); const colored = kids.filter((c: any) => c.props.name !== `${id}_halo`).map((c: any) => c.props.name); expect(colored.sort()).toEqual([`${id}_cap_end`, `${id}_cap_start`, `${id}_tube`].sort()); }
    await r.unmount();
  });
});
describe("selection", () => {
  it.each(VESSEL_IDS)("clicking %s calls onSelect with that API id", async (id) => {
    const onSelect = vi.fn(); const r = await ReactThreeTestRenderer.create(<CoronaryScene probabilities={probsOf(GOLDEN.median_cad_row)} selected={null} onSelect={onSelect} />);
    await r.fireEvent(r.scene.findByProps({ name: VESSELS[id].sceneNodeName }), "click"); expect(onSelect).toHaveBeenCalledTimes(1); expect(onSelect).toHaveBeenCalledWith(id); await r.unmount();
  });
  it("only the selected vessel shows an outline, and selecting does not change any vessel color", async () => {
    const r = await ReactThreeTestRenderer.create(<CoronaryScene probabilities={probsOf(GOLDEN.median_cad_row)} selected="LCX" onSelect={() => {}} />);
    expect(r.scene.findAllByProps({ name: "LCX_outline" })).toHaveLength(1); expect(r.scene.findAllByProps({ name: "LAD_outline" })).toHaveLength(0); expect(r.scene.findAllByProps({ name: "RCA_outline" })).toHaveLength(0);
    for (const id of VESSEL_IDS) expect(colorOf(r.scene.findByProps({ name: `${id}_tube` }))).toBe(probabilityToColor(GOLDEN.median_cad_row.predictions[id].probability)); await r.unmount();
  });
  it("the heart body and left main stem are neutral, non-selectable context", async () => {
    const onSelect = vi.fn(); const r = await ReactThreeTestRenderer.create(<CoronaryScene probabilities={probsOf(GOLDEN.median_cad_row)} selected={null} onSelect={onSelect} />);
    expect(r.scene.findByProps({ name: "left_main_stem" }).props.onClick).toBeUndefined(); expect(r.scene.findByProps({ name: "ventricles" }).props.onClick).toBeUndefined(); expect(onSelect).not.toHaveBeenCalled(); await r.unmount();
  });
});
