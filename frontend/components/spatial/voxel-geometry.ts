import * as THREE from "three";

type Bounds = [number, number, number, number, number, number];
// Only exposed cube faces are emitted. The resulting mesh has cardinal normals,
// real stepped edges and baked corner occlusion, with one draw call per joint.
export function createVoxelGeometry(
  bounds: Bounds,
  cell: number,
  sample: (x: number, y: number, z: number) => number | null,
) {
  const origin = [
    Math.floor(bounds[0] / cell),
    Math.floor(bounds[1] / cell),
    Math.floor(bounds[2] / cell),
  ];
  const size = [
    Math.ceil(bounds[3] / cell) - origin[0],
    Math.ceil(bounds[4] / cell) - origin[1],
    Math.ceil(bounds[5] / cell) - origin[2],
  ];
  const colors = new Int32Array(size[0] * size[1] * size[2]).fill(-1);
  const index = (x: number, y: number, z: number) => (z * size[1] + y) * size[0] + x;
  const solid = (x: number, y: number, z: number) =>
    x >= 0 &&
    y >= 0 &&
    z >= 0 &&
    x < size[0] &&
    y < size[1] &&
    z < size[2] &&
    colors[index(x, y, z)] !== -1;
  let count = 0;
  for (let z = 0; z < size[2]; z++)
    for (let y = 0; y < size[1]; y++)
      for (let x = 0; x < size[0]; x++) {
        const color = sample(
          (origin[0] + x + 0.5) * cell,
          (origin[1] + y + 0.5) * cell,
          (origin[2] + z + 0.5) * cell,
        );
        if (color !== null) {
          colors[index(x, y, z)] = color;
          count++;
        }
      }
  const positions: number[] = [],
    normals: number[] = [],
    vertexColors: number[] = [],
    indices: number[] = [];
  const palette = new Map<number, THREE.Color>();
  // u × v = outward normal; quads share vertices only within the same face.
  const faces = [
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    [
      [-1, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [0, 0, 1],
      [1, 0, 0],
    ],
    [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
    [
      [0, 0, 1],
      [1, 0, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, -1],
      [0, 1, 0],
      [1, 0, 0],
    ],
  ];
  for (let z = 0; z < size[2]; z++)
    for (let y = 0; y < size[1]; y++)
      for (let x = 0; x < size[0]; x++) {
        const hex = colors[index(x, y, z)];
        if (hex === -1) continue;
        if (!palette.has(hex)) palette.set(hex, new THREE.Color(hex));
        const color = palette.get(hex)!;
        for (const [n, u, v] of faces) {
          if (solid(x + n[0], y + n[1], z + n[2])) continue;
          const start = positions.length / 3;
          for (const [a, b] of [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]) {
            positions.push(
              (origin[0] + x + 0.5 + (n[0] + a * u[0] + b * v[0]) * 0.5) * cell,
              (origin[1] + y + 0.5 + (n[1] + a * u[1] + b * v[1]) * 0.5) * cell,
              (origin[2] + z + 0.5 + (n[2] + a * u[2] + b * v[2]) * 0.5) * cell,
            );
            normals.push(...n);
            const s1 = +solid(x + n[0] + a * u[0], y + n[1] + a * u[1], z + n[2] + a * u[2]),
              s2 = +solid(x + n[0] + b * v[0], y + n[1] + b * v[1], z + n[2] + b * v[2]);
            const corner = +solid(
              x + n[0] + a * u[0] + b * v[0],
              y + n[1] + a * u[1] + b * v[1],
              z + n[2] + a * u[2] + b * v[2],
            );
            const ao = 1 - (s1 && s2 ? 3 : s1 + s2 + corner) * 0.075;
            vertexColors.push(color.r * ao, color.g * ao, color.b * ao);
          }
          indices.push(start, start + 1, start + 2, start + 2, start + 1, start + 3);
        }
      }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(vertexColors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.userData = { voxelCount: count, cellSize: cell, exposedFaces: indices.length / 6 };
  return geometry;
}
