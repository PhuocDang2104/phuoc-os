import { test, expect } from "@playwright/test";
import { createCity } from "../components/spatial/world";
import { createScanUniforms, createMaterialFactory } from "../components/spatial/materials";
import { createBuildingPlay } from "../components/spatial/building-play";

test("a struck building stays broken until Milo leaves, then reconstructs without replacing city geometry", () => {
  const uniforms = createScanUniforms(),
    materials = createMaterialFactory(uniforms),
    city = createCity(materials, true, uniforms),
    play = createBuildingPlay(city, uniforms, true);
  const original = city.root.children.filter((node) => node !== play.root);
  try {
    const plan = play.plan({ x: 22, y: 0.4, z: 9.2 });
    expect(plan).toBeTruthy();
    const pose = {
      point: plan!.point,
      heading: plan!.heading,
      action: "swat",
      blend: 1,
      facing: 1,
    };
    expect(play.strike(plan!.id)).toBe(true);
    expect(play.count).toBe(760);
    expect(play.unavailable(plan!.id)).toBe(true);
    play.update(0.6, pose);
    expect(uniforms.uRebuildCoverage.value).toBe(1);
    play.update(0.8, pose);
    expect(uniforms.uRebuildCoverage.value).toBeGreaterThan(0);
    expect(uniforms.uRebuildCoverage.value).toBeLessThan(1);
    play.update(1.2, pose);
    expect(play.state).toBe("rubble");
    expect(uniforms.uRebuildCoverage.value).toBe(0);
    play.update(4, pose);
    expect(play.state).toBe("rubble");
    expect(play.plan(plan!.leave)).toBeNull();
    expect(play.strike(plan!.id)).toBe(false);
    play.update(0.7, { ...pose, point: plan!.leave });
    expect(play.state).toBe("rebuilding");
    play.update(2.5, { ...pose, point: plan!.leave });
    expect(uniforms.uRebuildCoverage.value).toBeGreaterThan(0.1);
    expect(uniforms.uRebuildCoverage.value).toBeLessThan(0.9);
    play.update(3.4, null);
    expect(play.state).toBe("idle");
    expect(play.root.visible).toBe(false);
    expect(uniforms.uRebuildActive.value).toBe(0);
    expect(uniforms.uRebuildCoverage.value).toBe(1);
    expect(play.unavailable(plan!.id)).toBe(false);
    expect(city.root.children.filter((node) => node !== play.root)).toEqual(original);
    expect(play.plan(plan!.leave)).toBeNull();
    play.update(90, null);
    expect(play.strike(plan!.id)).toBe(true);
    play.update(0.2, pose, true);
    expect(play.state).toBe("idle");
    expect(uniforms.uRebuildActive.value).toBe(0);
  } finally {
    play.dispose();
    city.dispose();
    materials.dispose();
  }
});
