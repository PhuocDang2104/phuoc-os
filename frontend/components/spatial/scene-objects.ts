import * as THREE from "three";
import type { SceneCategory } from "./config";
import type { MaterialFactory } from "./materials";

export type SceneSubject = {
  id: string;
  category: SceneCategory;
  subtype: string;
  object: THREE.Object3D;
  dimensions: THREE.Vector3;
};

// Semantic bounds come from the same dimensions and placements as the city kit.
export function createSceneObjects(
  buildings: readonly (readonly number[])[],
  materials: MaterialFactory,
) {
  const root = new THREE.Group(),
    subjects: SceneSubject[] = [];
  const positions: number[] = [];
  const edgePairs = [
    [0, 1],
    [0, 2],
    [0, 4],
    [1, 3],
    [1, 5],
    [2, 3],
    [2, 6],
    [3, 7],
    [4, 5],
    [4, 6],
    [5, 7],
    [6, 7],
  ];
  function add(
    id: string,
    category: SceneCategory,
    subtype: string,
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    const object = new THREE.Object3D();
    object.position.set(x, 0.15, z);
    object.updateMatrixWorld();
    subjects.push({ id, category, subtype, object, dimensions: new THREE.Vector3(w, h, d) });
    // Buildings remain navigation surfaces for Milo, without detection overlays.
    if (category === "building") return;
    const corners: THREE.Vector3[] = [];
    for (const cx of [-w / 2, w / 2])
      for (const cy of [0, h])
        for (const cz of [-d / 2, d / 2])
          corners.push(new THREE.Vector3(x + cx, 0.15 + cy, z + cz));
    for (const [a, b] of edgePairs)
      positions.push(...corners[a].toArray(), ...corners[b].toArray());
  }
  for (let tx = -1; tx <= 1; tx++)
    for (let tz = -1; tz <= 1; tz++) {
      const district = `${tx + 1}${tz + 1}`;
      buildings.forEach(([x, z, w, d, h, type], index) =>
        add(
          `BLD_${district}_${String(index + 1).padStart(2, "0")}`,
          "building",
          type === 3 ? "Tower" : h < 9 ? "Low-rise" : "Building",
          x + tx * 132,
          z + tz * 132,
          w + 0.35,
          h + (type === 3 ? 2.7 : 0.8),
          d + 0.35,
        ),
      );
      let tree = 0;
      for (const side of [-1, 1])
        for (let p = 14; p < 61; p += 8.4) {
          add(
            `TREE_${district}_${++tree}`,
            "vegetation",
            "Tree",
            p * side + tx * 132,
            -9.7 + tz * 132,
            3,
            5.8,
            3.2,
          );
          add(
            `TREE_${district}_${++tree}`,
            "vegetation",
            "Tree",
            -9.7 + tx * 132,
            p * side + tz * 132,
            3.2,
            5.8,
            3,
          );
        }
      for (const x of [-8.4, 8.4])
        for (const z of [-8.4, 8.4])
          add(
            `SIG_${district}_${x}/${z}`,
            "infrastructure",
            "Traffic light",
            x + tx * 132,
            z + tz * 132,
            0.65,
            4.8,
            0.65,
          );
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = materials.annotation("#b4ccd8");
  material.opacity = 0.52;
  root.add(new THREE.LineSegments(geometry, material));
  root.name = "Semantic object bounding boxes";
  return {
    root,
    subjects,
    dispose: () => {
      geometry.dispose();
      root.clear();
    },
  };
}
