import * as THREE from "three";
import { createVoxelGeometry } from "./voxel-geometry";

export function createCityCatRig(morph: { value: number }) {
  const rig = new THREE.Group(),
    body = new THREE.Group(),
    head = new THREE.Group();
  rig.add(body, head);
  const cell =
    typeof window !== "undefined" && window.matchMedia("(max-width:760px)").matches ? 0.16 : 0.12;
  const geometries = new Set<THREE.BufferGeometry>();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.86,
    metalness: 0,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uMiloMorph = morph;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uMiloMorph;")
      .replace(
        "#include <alphatest_fragment>",
        "#include <alphatest_fragment>\nvec2 cell=floor(gl_FragCoord.xy/2.);float pixel=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);if(pixel>uMiloMorph)discard;",
      );
  };
  material.customProgramCacheKey = () => "milo-dense-voxel-v3";
  function coat(base: string) {
    const palette = Array.from({ length: 16 }, (_, i) =>
      new THREE.Color(base).multiplyScalar(0.78 + i * 0.017).getHex(),
    );
    return (x: number, y: number, z: number) => {
      const stripe =
        Math.max(0, Math.sin(x * 3.9 + Math.sin(y * 1.8 + z * 1.5) * 0.75) - 0.45) / 0.55;
      const noise =
        (((Math.floor(x / cell) * 13 + Math.floor(y / cell) * 37 + Math.floor(z / cell) * 19) % 7) +
          7) %
        7;
      return palette[Math.max(0, Math.min(15, Math.round(11 - stripe * 7 + noise * 0.32)))];
    };
  }
  function mesh(
    parent: THREE.Group,
    bounds: [number, number, number, number, number, number],
    sample: (x: number, y: number, z: number) => number | null,
    step = cell,
  ) {
    const geometry = createVoxelGeometry(bounds, step, sample);
    geometries.add(geometry);
    const part = new THREE.Mesh(geometry, material);
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }
  function oval(
    parent: THREE.Group,
    r: [number, number, number],
    at: [number, number, number],
    color: string,
    fur = true,
    step = cell,
  ) {
    const shade = fur ? coat(color) : () => new THREE.Color(color).getHex();
    const hex = new THREE.Color(color).getHex();
    const part = mesh(
      parent,
      [-r[0], -r[1], -r[2], r[0], r[1], r[2]],
      (x, y, z) =>
        (x * x) / (r[0] * r[0]) + (y * y) / (r[1] * r[1]) + (z * z) / (r[2] * r[2]) <= 1
          ? fur
            ? shade(x + at[0], y + at[1], z + at[2])
            : hex
          : null,
      step,
    );
    part.position.set(...at);
    return part;
  }
  const bodyCoat = coat("#bcb0ce"),
    belly = coat("#dfd5e7");
  mesh(body, [-3.5, 1.7, -1.55, 2.6, 4.85, 1.55], (x, y, z) => {
    const main = ((x + 0.45) / 3) ** 2 + ((y - 3.2) / 1.6) ** 2 + (z / 1.48) ** 2;
    const under = ((x + 0.4) / 2.55) ** 2 + ((y - 2.85) / 1.1) ** 2 + (z / 1.36) ** 2;
    return Math.min(main, under) <= 1 ? (y < 2.85 ? belly(x, y, z) : bodyCoat(x, y, z)) : null;
  });
  const neck = oval(rig, [1.33, 1.8, 1.24], [1.35, 3.65, 0], "#c9bdd7");
  const legs: THREE.Group[] = [];
  for (const x of [-1.9, 1.65])
    for (const z of [-0.83, 0.83]) {
      const hip = new THREE.Group();
      hip.position.set(x, 2.75, z);
      rig.add(hip);
      legs.push(hip);
      const shade = coat("#bfb2ce");
      mesh(hip, [-0.76, -2.76, -0.7, 0.91, 0.67, 0.7], (px, py, pz) => {
        const shoulder = (px / 0.7) ** 2 + ((py + 0.22) / 0.85) ** 2 + (pz / 0.68) ** 2;
        const limb =
          (px / 0.47) ** 2 +
          ((py - Math.max(-1.9, Math.min(-0.4, py))) / 0.47) ** 2 +
          (pz / 0.47) ** 2;
        const paw = ((px - 0.2) / 0.7) ** 2 + ((py + 2.38) / 0.35) ** 2 + (pz / 0.57) ** 2;
        return Math.min(shoulder, limb, paw) <= 1
          ? py < -2.12
            ? 0xeee6f0
            : shade(px + x, py + 2.75, pz + z)
          : null;
      });
    }
  head.position.set(2.25, 4.5, 0);
  oval(head, [1.54, 1.42, 1.47], [0, 0.15, 0], "#cfc2dc");
  oval(head, [0.55, 0.87, 1.1], [1.04, -0.1, 0], "#ece4f0", false, cell * 0.7);
  for (const z of [-0.88, 0.88]) {
    const ear = mesh(
      head,
      [-0.25, 0, -0.65, 0.3, 1.42, 0.65],
      (x, y, pz) => {
        const width = 0.63 * (1 - y / 1.42),
          center = (0.15 * y) / 1.42;
        if (y < 0 || y > 1.42 || Math.abs(pz - center) > width) return null;
        return x > 0.12 && y > 0.2 && y < 1.13 && Math.abs(pz - center) < width * 0.65
          ? 0xcd9db9
          : 0xb4a1c4;
      },
      cell * 0.7,
    );
    ear.position.set(-0.05, 1.08, z);
  }
  const eyes: THREE.Group[] = [],
    closedEyes: THREE.Mesh[] = [];
  function line(parent: THREE.Group, points: THREE.Vector3[], radius: number, color: string) {
    const curve = new THREE.CatmullRomCurve3(points),
      samples = curve.getPoints(30);
    const box = new THREE.Box3().setFromPoints(samples).expandByScalar(radius + 0.025);
    return mesh(
      parent,
      [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z],
      (x, y, z) =>
        samples.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 + (p.z - z) ** 2 < radius * radius)
          ? new THREE.Color(color).getHex()
          : null,
      Math.max(0.045, radius * 1.25),
    );
  }
  for (const z of [-0.68, 0.68]) {
    const eye = new THREE.Group();
    eye.position.set(1.29, 0.37, z);
    head.add(eye);
    eyes.push(eye);
    oval(eye, [0.15, 0.41, 0.39], [0, 0, 0], "#4d3b59", false, 0.065);
    oval(eye, [0.17, 0.31, 0.27], [0.06, 0, 0], "#a9c491", false, 0.055);
    oval(eye, [0.18, 0.29, 0.09], [0.09, 0, 0], "#302b39", false, 0.055);
    oval(eye, [0.19, 0.09, 0.085], [0.12, 0.16, 0.1], "#ffffff", false, 0.055);
    const closed = line(
      head,
      [
        new THREE.Vector3(1.42, 0.37, z - 0.3),
        new THREE.Vector3(1.47, 0.25, z),
        new THREE.Vector3(1.42, 0.37, z + 0.3),
      ],
      0.045,
      "#66516f",
    );
    closed.visible = false;
    closedEyes.push(closed);
    oval(head, [0.42, 0.35, 0.48], [1.35, -0.42, z * 0.56], "#f4edf5", false, 0.075);
    for (const y of [-0.26, -0.49])
      line(
        head,
        [
          new THREE.Vector3(1.4, y, z * 1.2),
          new THREE.Vector3(1.48, y + 0.06, z * 2),
          new THREE.Vector3(1.35, y + 0.11, z * 2.75),
        ],
        0.035,
        "#dfd1e8",
      );
  }
  oval(head, [0.15, 0.13, 0.23], [1.66, -0.18, 0], "#ba8ba9", false, 0.055);
  const jaw = new THREE.Group();
  jaw.position.set(0.65, -0.35, 0);
  head.add(jaw);
  oval(jaw, [0.65, 0.18, 0.52], [0.63, -0.32, 0], "#e8ddeb", false, 0.075);
  const mouth = new THREE.Object3D();
  mouth.position.set(1.6, -0.5, 0);
  head.add(mouth);
  const collar = mesh(
    rig,
    [-0.18, -1.37, -1.37, 0.18, 1.37, 1.37],
    (x, y, z) => ((Math.hypot(y, z) - 1.2) ** 2 + x * x < 0.14 ** 2 ? 0x8e78b0 : null),
    0.085,
  );
  collar.position.set(1.62, 3.72, 0);
  const tag = oval(rig, [0.14, 0.24, 0.19], [1.75, 3.35, 1.28], "#d5bdf2", false, 0.07);
  const tailGeometry = new THREE.BoxGeometry(cell * 0.95, cell * 0.95, cell * 0.95);
  geometries.add(tailGeometry);
  const tailMaterial = material.clone();
  tailMaterial.onBeforeCompile = material.onBeforeCompile;
  tailMaterial.customProgramCacheKey = material.customProgramCacheKey;
  // Instance colors supply the same palette without the static meshes' color attribute.
  tailMaterial.vertexColors = false;
  const tail = new THREE.InstancedMesh(tailGeometry, tailMaterial, 4000);
  tail.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  tail.frustumCulled = false;
  tail.receiveShadow = true;
  rig.add(tail);
  const tailCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 5 }, () => new THREE.Vector3()),
  );
  const center = new THREE.Vector3(),
    tangent = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    binormal = new THREE.Vector3(),
    matrix = new THREE.Matrix4(),
    color = new THREE.Color();
  const shadeTail = coat("#b7a8c9");
  function updateTail(time: number, curled: number) {
    const awake = [
        [-2.8, 3.2, 0],
        [-3.55, 3.7, 0.1],
        [-3.9, 4.65, 0.2],
        [-3.95, 5.65, 0.08],
        [-3.55, 6.2, -0.05],
      ],
      asleep = [
        [-2.7, 1.7, 0],
        [-2.5, 1.05, 1.4],
        [-0.7, 0.85, 2.05],
        [1.3, 0.85, 2],
        [2.35, 1.15, 0.85],
      ];
    tailCurve.points.forEach((p, i) =>
      p.set(
        THREE.MathUtils.lerp(awake[i][0], asleep[i][0], curled),
        THREE.MathUtils.lerp(
          awake[i][1] + body.position.y + Math.sin(time * 1.8 - i * 0.45) * 0.12,
          asleep[i][1],
          curled,
        ),
        THREE.MathUtils.lerp(
          awake[i][2] + Math.sin(time * 1.35 - i * 0.6) * 0.22,
          asleep[i][2],
          curled,
        ),
      ),
    );
    const used = new Set<string>();
    let count = 0;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      tailCurve.getPoint(t, center);
      tailCurve.getTangent(t, tangent);
      if (!i) normal.set(0, 0, 1);
      normal.addScaledVector(tangent, -normal.dot(tangent));
      if (normal.lengthSq() < 0.00001) normal.set(0, 1, 0).addScaledVector(tangent, -tangent.y);
      normal.normalize();
      binormal.crossVectors(tangent, normal).normalize();
      const radius = 0.34 * (1 - 0.55 * t * t),
        steps = Math.ceil(radius / cell);
      for (let a = -steps; a <= steps; a++)
        for (let b = -steps; b <= steps; b++) {
          if ((a * a + b * b) * cell * cell > radius * radius) continue;
          const x = Math.round((center.x + (normal.x * a + binormal.x * b) * cell) / cell),
            y = Math.round((center.y + (normal.y * a + binormal.y * b) * cell) / cell),
            z = Math.round((center.z + (normal.z * a + binormal.z * b) * cell) / cell),
            key = `${x}/${y}/${z}`;
          if (used.has(key) || count >= 4000) continue;
          used.add(key);
          matrix.makeTranslation(x * cell, y * cell, z * cell);
          tail.setMatrixAt(count, matrix);
          tail.setColorAt(count, color.setHex(shadeTail(x * cell, y * cell, z * cell)));
          count++;
        }
    }
    tail.count = count;
    tail.instanceMatrix.needsUpdate = true;
    if (tail.instanceColor) tail.instanceColor.needsUpdate = true;
  }
  return {
    rig,
    body,
    head,
    neck,
    legs,
    eyes,
    closedEyes,
    jaw,
    mouth,
    collar,
    tag,
    updateTail,
    get voxelCount() {
      return [...geometries].reduce((sum, g) => sum + (g.userData.voxelCount ?? 0), 0) + tail.count;
    },
    dispose() {
      tail.dispose();
      geometries.forEach((g) => g.dispose());
      material.dispose();
      tailMaterial.dispose();
      rig.clear();
    },
  };
}
