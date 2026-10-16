import { test, expect } from "@playwright/test";
import * as THREE from "three";
import { createVoxelGeometry } from "../components/spatial/voxel-geometry";
import { createCityCatRig } from "../components/spatial/city-cat-rig";

test("voxel surfaces omit interior cube faces and preserve crisp cubic normals", () => {
  const geometry = createVoxelGeometry([0, 0, 0, 2, 2, 2], 1, () => 0xc9bdd7);
  try {
    expect(geometry.userData.voxelCount).toBe(8);
    expect(geometry.userData.exposedFaces).toBe(24);
    expect(geometry.index!.count).toBe(144);
    const normals = geometry.getAttribute("normal");
    for (let i = 0; i < normals.count; i++)
      expect(
        Math.abs(normals.getX(i)) + Math.abs(normals.getY(i)) + Math.abs(normals.getZ(i)),
      ).toBe(1);
  } finally {
    geometry.dispose();
  }
});

test("Milo uses dense colored voxels with a bounded number of articulated meshes", () => {
  const model = createCityCatRig({ value: 1 });
  try {
    model.updateTail(0, 0);
    expect(model.voxelCount).toBeGreaterThan(15000);
    let meshes = 0,
      faces = 0;
    model.rig.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      meshes++;
      const geometry = object.geometry;
      if (object instanceof THREE.InstancedMesh) return;
      expect(geometry.getAttribute("color")).toBeTruthy();
      const normals = geometry.getAttribute("normal");
      for (let i = 0; i < normals.count; i += 37)
        expect(
          [normals.getX(i), normals.getY(i), normals.getZ(i)].every(
            (value) => value === 0 || Math.abs(value) === 1,
          ),
        ).toBe(true);
      faces += geometry.index!.count / 6;
    });
    expect(meshes).toBeLessThan(40);
    expect(faces).toBeLessThan(50000);
    model.updateTail(1, 1);
    expect(model.voxelCount).toBeGreaterThan(15000);
  } finally {
    model.dispose();
  }
});
