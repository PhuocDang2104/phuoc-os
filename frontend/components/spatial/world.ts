import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { SPATIAL_CONFIG, type SceneCategory } from "./config";
import type { ScanUniforms, MaterialFactory } from "./materials";
import { updateTraffic, type TrafficActor } from "./traffic";
import { createControlVectors } from "./control-vectors";
import { createSensorFans } from "./sensor-fans";
import { createPointCloud } from "./point-cloud";
import { createSceneObjects } from "./scene-objects";

export const BUILDINGS = [
  [-18, -16, 12, 10, 13, 0],
  [-34, -16, 10, 9, 8, 1],
  [-48, -16, 10, 10, 16, 2],
  [-17, -31, 11, 12, 8, 1],
  [-32, -31, 12, 12, 19, 3],
  [-48, -32, 10, 13, 10, 0],
  [-20, -46, 16, 9, 6, 2],
  [-42, -47, 16, 9, 12, 1],
  [17, -17, 10, 12, 9, 2],
  [32, -16, 12, 10, 17, 0],
  [47, -17, 10, 12, 11, 3],
  [17, -33, 11, 12, 15, 1],
  [32, -33, 12, 12, 7, 2],
  [48, -34, 10, 12, 14, 0],
  [20, -48, 16, 8, 8, 0],
  [43, -49, 17, 8, 5, 1],
  [-17, 17, 10, 12, 11, 3],
  [-32, 17, 12, 12, 15, 1],
  [-48, 17, 10, 12, 8, 0],
  [-17, 34, 10, 12, 7, 0],
  [-32, 34, 12, 12, 17, 2],
  [-48, 34, 11, 12, 11, 1],
  [17, 17, 11, 11, 14, 1],
  [33, 17, 12, 11, 7, 3],
  [48, 17, 10, 11, 16, 0],
  [17, 34, 11, 13, 9, 2],
  [33, 34, 12, 13, 18, 1],
  [49, 34, 10, 13, 12, 3],
] as const;

function footprint(width: number, depth: number, type: number) {
  const w = width / 2,
    d = depth / 2,
    c = Math.min(width, depth) * 0.16;
  const points =
    type === 1
      ? [
          [-w, -d],
          [w, -d],
          [w, d * 0.25],
          [w * 0.25, d * 0.25],
          [w * 0.25, d],
          [-w, d],
        ]
      : type === 2
        ? [
            [-w + c, -d],
            [w - c, -d],
            [w, -d + c],
            [w, d - c],
            [w - c, d],
            [-w + c, d],
            [-w, d - c],
            [-w, -d + c],
          ]
        : [
            [-w, -d],
            [w, -d],
            [w, d],
            [-w, d],
          ];
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => (index ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  return shape;
}

export function createCity(materials: MaterialFactory, mobile: boolean, uniforms: ScanUniforms) {
  const root = new THREE.Group(),
    annotations = new THREE.Group();
  const structure = new THREE.Group();
  const structureMaterial = materials.annotation("#5095a5");
  structureMaterial.opacity = 0.23;
  annotations.name = "Scene-derived cuboids";
  const geometries = new Set<THREE.BufferGeometry>(),
    occluders: THREE.Mesh[] = [],
    pickMeshes: THREE.Mesh[] = [],
    actors: TrafficActor[] = [];
  const cube = new THREE.BoxGeometry(1, 1, 1);
  geometries.add(cube);
  const laneMaterial = materials.annotation("#79e9f4");
  laneMaterial.opacity = 0.35;
  for (const direction of [-1, 1]) {
    const xLane = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-64, 0.055, -2.15 * direction),
      new THREE.Vector3(64, 0.055, -2.15 * direction),
    ]);
    const zLane = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(2.15 * direction, 0.055, -64),
      new THREE.Vector3(2.15 * direction, 0.055, 64),
    ]);
    geometries.add(xLane);
    geometries.add(zLane);
    structure.add(new THREE.Line(xLane, laneMaterial), new THREE.Line(zLane, laneMaterial));
  }
  const parts: Record<
    string,
    { geometry: THREE.BufferGeometry; material: THREE.Material; matrix: THREE.Matrix4[] }
  > = {};
  const dummy = new THREE.Object3D();
  function box(
    category: SceneCategory,
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    shadow = true,
    parent: THREE.Group = root,
    instance = 0,
  ) {
    const mesh = new THREE.Mesh(cube, materials.surface(category, color, instance));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function repeat(
    key: string,
    geometry: THREE.BufferGeometry,
    category: SceneCategory,
    color: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    ry = 0,
  ) {
    if (!parts[key])
      parts[key] = { geometry, material: materials.surface(category, color), matrix: [] };
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, ry, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    parts[key].matrix.push(dummy.matrix.clone());
  }
  box("ground", "#f3f3ee", 0, -0.38, 0, 2400, 0.5, 2400, false);
  for (let street = -8; street <= 8; street++) {
    if (street === 0) continue;
    box("road", "#e1e3df", street * 66, -0.07, 0, 14, 0.15, 2200, false);
    box("road", "#e1e3df", 0, -0.07, street * 66, 2200, 0.15, 14, false);
  }
  box("road", "#e1e3df", 0, -0.07, 0, 2200, 0.15, 14, false);
  box("road", "#e1e3df", 0, -0.065, 0, 14, 0.16, 2200, false);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      box("sidewalk", "#ebebe6", sx * 35, 0.035, sz * 31, 54, 0.28, 46, false);
      // Fine curb strips and scored sidewalk joints ground the miniature architecture.
      repeat("curbs", cube, "sidewalk", "#f7f7f2", sx * 7.7, 0.2, sz * 31, 0.34, 0.18, 46);
      repeat("curbs", cube, "sidewalk", "#f7f7f2", sx * 35, 0.2, sz * 7.7, 54, 0.18, 0.34);
      for (let p = 12; p < 61; p += 3)
        repeat("paving", cube, "sidewalk", "#dfe1dc", sx * p, 0.182, sz * 8.9, 0.025, 0.008, 2.1);
      for (let p = 13; p < 52; p += 3)
        repeat("paving", cube, "sidewalk", "#dfe1dc", sx * 8.9, 0.182, sz * p, 2.1, 0.008, 0.025);
    }
  for (let p = -65; p <= 65; p += 4.3)
    if (Math.abs(p) > 11) {
      repeat("markings", cube, "marking", "#fbfbf7", p, 0.025, 0, 2, 0.025, 0.12);
      repeat("markings", cube, "marking", "#fbfbf7", 0, 0.028, p, 0.12, 0.025, 2);
    }
  for (const side of [-1, 1])
    for (let stripe = -5; stripe <= 5; stripe++) {
      repeat(
        "markings",
        cube,
        "marking",
        "#fafaf6",
        stripe * 1.15,
        0.035,
        side * 9.2,
        0.65,
        0.035,
        2.1,
      );
      repeat(
        "markings",
        cube,
        "marking",
        "#fafaf6",
        side * 9.2,
        0.035,
        stripe * 1.15,
        2.1,
        0.035,
        0.65,
      );
    }
  for (const side of [-1, 1]) {
    repeat(
      "markings",
      cube,
      "marking",
      "#fcfcf8",
      side * 11.4,
      0.03,
      side * -3.6,
      0.16,
      0.025,
      6.1,
    );
    repeat("markings", cube, "marking", "#fcfcf8", side * 3.6, 0.03, side * 11.4, 6.1, 0.025, 0.16);
  }
  // Lane arrows are small raised markings, sharing the same semantic category as crosswalks.
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(-0.2, -1.3);
  arrowShape.lineTo(0.2, -1.3);
  arrowShape.lineTo(0.2, 0.4);
  arrowShape.lineTo(0.7, 0.4);
  arrowShape.lineTo(0, 1.3);
  arrowShape.lineTo(-0.7, 0.4);
  arrowShape.lineTo(-0.2, 0.4);
  arrowShape.closePath();
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  arrowGeo.rotateX(-Math.PI / 2);
  geometries.add(arrowGeo);
  for (const direction of [-1, 1])
    for (const p of [21, 40, 57]) {
      repeat(
        "arrows",
        arrowGeo,
        "marking",
        "#fcfcf8",
        -p * direction,
        0.04,
        2.15 * direction,
        1,
        1,
        1,
        (direction * Math.PI) / 2,
      );
      repeat(
        "arrows",
        arrowGeo,
        "marking",
        "#fcfcf8",
        -2.15 * direction,
        0.04,
        -p * direction,
        1,
        1,
        1,
        direction === 1 ? 0 : Math.PI,
      );
    }
  BUILDINGS.forEach(([x, z, w, d, h, type], index) => {
    const shape = footprint(w, d, type);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, steps: 1 });
    geometry.rotateX(-Math.PI / 2);
    geometries.add(geometry);
    const building = new THREE.Mesh(
      geometry,
      materials.surface("building", index % 3 === 0 ? "#eeefea" : "#f4f4ef", index + 1),
    );
    building.position.set(x, 0.19, z);
    building.castShadow = true;
    building.receiveShadow = true;
    building.userData.category = "building";
    root.add(building);
    occluders.push(building);
    const outlineGeometry = new THREE.EdgesGeometry(geometry, 30);
    geometries.add(outlineGeometry);
    const outline = new THREE.LineSegments(outlineGeometry, structureMaterial);
    outline.position.copy(building.position);
    structure.add(outline);
    const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false });
    roofGeo.rotateX(-Math.PI / 2);
    geometries.add(roofGeo);
    const roof = new THREE.Mesh(roofGeo, materials.surface("building", "#fafaf6", index + 1));
    roof.position.set(x, h + 0.2, z);
    roof.receiveShadow = true;
    root.add(roof);
    occluders.push(roof);
    if (type === 3) {
      const tier = box("building", "#f8f8f3", x, h + 1.3, z, w * 0.64, 2.25, d * 0.68, true);
      occluders.push(tier);
    }
    if (index % 2 === 0)
      box("building", "#dedfd9", x + w * 0.17, h + 0.53, z - d * 0.17, w * 0.24, 0.6, d * 0.2);
    if (index % 3 === 0)
      box("building", "#ecece5", x - w * 0.2, h + 0.35, z + d * 0.14, w * 0.2, 0.28, d * 0.25);
    const floors = Math.floor(h / 3.2);
    for (let floor = 1; floor <= floors; floor++) {
      repeat(
        "floor-seams",
        cube,
        "building",
        "#dfe1da",
        x,
        floor * 3.05,
        z + d * 0.5 + 0.012,
        w * 0.86,
        0.055,
        0.03,
      );
      if (!mobile)
        for (let column = 0; column < Math.floor(w / 2); column++) {
          repeat(
            "windows",
            cube,
            "building",
            "#daddd6",
            x - w * 0.36 + column * 1.7,
            floor * 3.05 - 1,
            z + d * 0.5 + 0.02,
            0.7,
            0.8,
            0.035,
          );
          repeat(
            "windows",
            cube,
            "building",
            "#e1e3dc",
            x + w * 0.5 + 0.025,
            floor * 3.05 - 1,
            z - d * 0.3 + column * 1.5,
            0.035,
            0.8,
            0.7,
          );
        }
    }
  });
  const trunk = new THREE.CylinderGeometry(0.17, 0.23, 1, 6),
    canopy = new THREE.IcosahedronGeometry(1, 1);
  geometries.add(trunk);
  geometries.add(canopy);
  let treeIndex = 0;
  for (const side of [-1, 1])
    for (let p = 14; p < 61; p += 8.4) {
      const height = 2.2 + (treeIndex % 3) * 0.23;
      repeat("trunks", trunk, "vegetation", "#d1d4ca", p * side, 1.1, -9.7, 1, 1.8, 1);
      repeat(
        "canopies",
        canopy,
        "vegetation",
        "#e8eae0",
        p * side,
        3.2,
        -9.7,
        1.4,
        height,
        1.5,
        treeIndex++ * 0.6,
      );
      repeat("trunks", trunk, "vegetation", "#d1d4ca", -9.7, 1.1, p * side, 1, 1.8, 1);
      repeat(
        "canopies",
        canopy,
        "vegetation",
        "#e8eae0",
        -9.7,
        3.1,
        p * side,
        1.5,
        height,
        1.4,
        treeIndex++ * 0.6,
      );
    }
  for (const x of [-8.4, 8.4])
    for (const z of [-8.4, 8.4]) {
      repeat("poles", cube, "infrastructure", "#c5c9c3", x, 2.4, z, 0.14, 4.5, 0.14);
      repeat("signals", cube, "infrastructure", "#acb3ad", x, 4.2, z, 0.44, 1, 0.35);
      repeat(
        "signals-face",
        cube,
        "infrastructure",
        "#ecefe6",
        x,
        4.25,
        z + 0.19,
        0.19,
        0.6,
        0.035,
      );
    }
  // Extend the same architectural kit into 25 districts with shared geometry.
  // The ground/roads extend well beyond every supported camera framing.
  root.updateMatrixWorld(true);
  const architecture = [...root.children].filter(
    (node): node is THREE.Mesh =>
      node instanceof THREE.Mesh &&
      (node.material as THREE.Material).userData.scanCategory === "building",
  );
  for (const source of architecture) {
    const tiled = new THREE.InstancedMesh(source.geometry, source.material, 25);
    let index = 0;
    for (let tx = -2; tx <= 2; tx++)
      for (let tz = -2; tz <= 2; tz++) {
        const matrix = source.matrix.clone();
        matrix.elements[12] += tx * 132;
        matrix.elements[14] += tz * 132;
        tiled.setMatrixAt(index++, matrix);
      }
    tiled.castShadow = true;
    tiled.receiveShadow = true;
    tiled.name = "District architecture";
    root.remove(source);
    root.add(tiled);
    const occluderIndex = occluders.indexOf(source);
    if (occluderIndex !== -1) occluders[occluderIndex] = tiled;
  }
  // Benches, planters, rooftop equipment and ground detail share instance batches.
  for (const x of [-1, 1])
    for (const z of [-1, 1]) {
      for (let p = 18; p < 58; p += 12) {
        repeat("benches", cube, "infrastructure", "#a7afa8", x * p, 0.6, z * 11.5, 2.7, 0.3, 0.8);
        repeat("planters", cube, "vegetation", "#b7c3b2", x * 11.3, 0.45, z * p, 1.4, 0.7, 2.8);
      }
    }
  for (const [key, part] of Object.entries(parts)) {
    const matrices: THREE.Matrix4[] = [];
    const markings = key === "markings" || key === "arrows";
    for (let tx = -2; tx <= 2; tx++)
      for (let tz = -2; tz <= 2; tz++) {
        for (const original of part.matrix) {
          const matrix = original.clone();
          matrix.elements[12] += tx * (markings ? 66 : 132);
          matrix.elements[14] += tz * (markings ? 66 : 132);
          matrices.push(matrix);
        }
      }
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, matrices.length);
    mesh.name = key;
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.castShadow =
      !key.includes("markings") && !key.includes("paving") && !key.includes("windows");
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  function merged(items: THREE.BufferGeometry[]) {
    const compatible = items.map((item) => (item.index ? item.toNonIndexed() : item));
    const geometry = mergeGeometries(compatible, false)!;
    compatible.forEach((item, index) => {
      if (item !== items[index]) item.dispose();
    });
    items.forEach((item) => item.dispose());
    geometries.add(geometry);
    return geometry;
  }
  function piece(w: number, h: number, d: number, x: number, y: number, z: number) {
    return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  }
  function smoothPiece(w: number, h: number, d: number, x: number, y: number, z: number) {
    return new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.22).translate(x, y, z);
  }
  const vehicleGeos: Record<
    string,
    {
      body: THREE.BufferGeometry;
      glass: THREE.BufferGeometry;
      wheels: THREE.BufferGeometry;
      lights: THREE.BufferGeometry;
      size: THREE.Vector3;
    }
  > = {};
  for (const [type, length, height] of [
    ["car", 4.1, 1.48],
    ["hatchback", 3.6, 1.5],
    ["suv", 4.6, 1.84],
    ["pickup", 5.1, 1.8],
    ["van", 5, 2.05],
    ["bus", 7.6, 2.55],
  ] as const) {
    const width = type === "bus" ? 2.5 : 2;
    const items: THREE.BufferGeometry[] = [
      smoothPiece(width, 0.62, length, 0, 0.57, 0),
      smoothPiece(
        width * 0.87,
        height - 0.65,
        length * (type === "pickup" ? 0.35 : type === "bus" || type === "van" ? 0.8 : 0.57),
        0,
        (height + 0.65) / 2,
        type === "pickup" ? length * 0.14 : -0.14,
      ),
    ];
    if (type === "pickup")
      items.push(smoothPiece(width * 0.92, 0.22, length * 0.35, 0, 0.96, -length * 0.3));
    const wheels: THREE.BufferGeometry[] = [],
      lights: THREE.BufferGeometry[] = [];
    for (const x of [-1, 1])
      for (const z of [-1, 1]) {
        const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 16);
        wheel.rotateZ(Math.PI / 2);
        wheel.translate(x * width * 0.49, 0.36, z * length * 0.32);
        wheels.push(wheel);
        lights.push(piece(0.38, 0.13, 0.045, x * width * 0.31, 0.67, z * (length * 0.5 + 0.012)));
      }
    const glass = smoothPiece(
      width * 0.89,
      height * 0.29,
      length * (type === "pickup" ? 0.26 : type === "bus" || type === "van" ? 0.73 : 0.45),
      0,
      height - 0.38,
      type === "pickup" ? length * 0.14 : -0.15,
    );
    geometries.add(glass);
    vehicleGeos[type] = {
      body: merged(items),
      glass,
      wheels: merged(wheels),
      lights: merged(lights),
      size: new THREE.Vector3(width + 0.22, height + 0.18, length + 0.18),
    };
  }
  const head = new THREE.SphereGeometry(0.2, 7, 5);
  head.translate(0, 1.59, 0);
  const torso = new THREE.CylinderGeometry(0.19, 0.25, 0.78, 6);
  torso.translate(0, 0.98, 0);
  const pedestrianGeo = merged([
    head,
    torso,
    piece(0.17, 0.64, 0.18, -0.14, 0.35, 0),
    piece(0.17, 0.64, 0.18, 0.14, 0.35, 0),
  ]);
  const carLines = materials.annotation("#79edff"),
    pedLines = materials.annotation("#ff72cf");
  for (
    let index = 0;
    index < SPATIAL_CONFIG.world.vehicleCount + SPATIAL_CONFIG.world.pedestrianCount;
    index++
  ) {
    const pedestrian = index >= SPATIAL_CONFIG.world.vehicleCount,
      pedIndex = index - SPATIAL_CONFIG.world.vehicleCount;
    const models = [
      "car",
      "hatchback",
      "suv",
      "car",
      "pickup",
      "hatchback",
      "van",
      "suv",
      "car",
      "bus",
    ];
    const type = pedestrian ? "pedestrian" : models[index % models.length];
    const id = `${pedestrian ? "PED" : "CAR"}_${String(pedestrian ? pedIndex + 1 : index + 1).padStart(3, "0")}`;
    const group = new THREE.Group();
    group.name = id;
    const size = pedestrian ? new THREE.Vector3(0.8, 1.9, 0.75) : vehicleGeos[type].size;
    const body = new THREE.Mesh(
      pedestrian ? pedestrianGeo : vehicleGeos[type].body,
      materials.surface(
        pedestrian ? "pedestrian" : "vehicle",
        pedestrian
          ? ["#daddd5", "#b8c1ca", "#cbbdb2", "#a8b6b0"][pedIndex % 4]
          : ["#f0f0eb", "#bec8cd", "#a5b2ba", "#d2c7b9", "#bbc5b7", "#d5d2d9"][index % 6],
        index + 1,
      ),
    );
    body.castShadow = false;
    body.receiveShadow = true;
    body.userData.actorId = id;
    group.add(body);
    const picks = [body];
    if (!pedestrian) {
      const glass = new THREE.Mesh(
        vehicleGeos[type].glass,
        materials.surface("vehicle", "#657984", index + 1),
      );
      glass.userData.actorId = id;
      group.add(glass);
      picks.push(glass);
      for (const [geometry, color] of [
        [vehicleGeos[type].wheels, "#333b43"],
        [vehicleGeos[type].lights, "#fff7d9"],
      ] as const) {
        const detail = new THREE.Mesh(geometry, materials.surface("vehicle", color, index + 1));
        detail.userData.actorId = id;
        group.add(detail);
      }
    }
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z));
    edges.translate(0, size.y * 0.5, 0);
    geometries.add(edges);
    const cuboid = new THREE.LineSegments(edges, pedestrian ? pedLines : carLines);
    cuboid.renderOrder = 2;
    annotations.add(cuboid);
    root.add(group);
    pickMeshes.push(...picks);
    const perLane = Math.ceil(SPATIAL_CONFIG.world.vehicleCount / 4);
    const sidewalkCount =
      SPATIAL_CONFIG.world.pedestrianCount - Math.min(4, SPATIAL_CONFIG.world.pedestrianCount);
    const lane = pedestrian ? pedIndex % 4 : Math.floor(index / perLane);
    actors.push({
      id,
      category: pedestrian ? "pedestrian" : "vehicle",
      subtype: type,
      object: group,
      box: cuboid,
      pickMeshes: picks,
      dimensions: size,
      axis: lane < 2 ? "x" : "z",
      direction: lane % 2 ? -1 : 1,
      lane,
      distance: pedestrian
        ? pedIndex < sidewalkCount
          ? (pedIndex * 11) % 138
          : (pedIndex - sidewalkCount) * 5
        : (index % perLane) * (128 / perLane) + lane * 3,
      baseSpeed: pedestrian ? 0.72 + (pedIndex % 4) * 0.13 : 5.2 + (index % 4) * 0.55,
      speed: pedestrian ? 1 : 5.2,
      status: "moving",
      signal: "green",
      crossing: pedestrian && pedIndex >= sidewalkCount,
      acceleration: 0,
      steering: 0,
    });
  }
  root.add(annotations);
  root.add(structure);
  structure.visible = false;
  updateTraffic(actors, 0, 0.001);
  const controlVectors = createControlVectors(actors, uniforms);
  root.add(controlVectors.root);
  const sensorFans = createSensorFans(actors, uniforms);
  root.add(sensorFans.root);
  const pointCloud = createPointCloud(root, actors, uniforms, mobile);
  const sceneObjects = createSceneObjects(BUILDINGS, materials);
  annotations.add(sceneObjects.root);
  return {
    root,
    actors,
    occluders,
    pickMeshes,
    annotations,
    structure,
    controlVectors,
    sensorFans,
    pointCloud,
    sceneObjects,
    dispose: () => {
      root.traverse((node) => {
        if (node instanceof THREE.InstancedMesh) node.dispose();
      });
      pointCloud.dispose();
      sceneObjects.dispose();
      sensorFans.dispose();
      controlVectors.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      root.clear();
    },
  };
}
export type CityWorld = ReturnType<typeof createCity>;
