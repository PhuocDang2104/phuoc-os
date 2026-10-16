import * as THREE from "three";

// Soft, overlapping volumes and one continuous tapered tail keep the silhouette
// connected as Milo bends. Fur is a small deterministic texture, not an asset fetch.
export function createCityCatRig(morph: { value: number }) {
  const rig = new THREE.Group(),
    body = new THREE.Group(),
    head = new THREE.Group();
  rig.add(body, head);
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Map<string, THREE.MeshStandardMaterial>();
  const fur = new Uint8Array(128 * 128 * 4),
    grain = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      const wave = Math.sin((x / 128) * Math.PI * 16 + Math.sin(y * 0.075) * 1.4);
      const stripe = Math.max(0, wave - 0.58) / 0.42;
      const noise = ((x * 13 + y * 37 + x * y * 3) % 31) / 31;
      const value = Math.round(247 - stripe * 42 + (noise - 0.5) * 7);
      fur[i] = value;
      fur[i + 1] = value;
      fur[i + 2] = Math.min(255, value + stripe * 5);
      fur[i + 3] = 255;
      grain[i] = grain[i + 1] = grain[i + 2] = 120 + Math.round(noise * 30);
      grain[i + 3] = 255;
    }
  const furTexture = new THREE.DataTexture(fur, 128, 128),
    bumpTexture = new THREE.DataTexture(grain, 128, 128);
  furTexture.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [furTexture, bumpTexture]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
  }
  function material(color: string, coat = false) {
    const key = color + coat;
    if (materials.has(key)) return materials.get(key)!;
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: coat ? 0.92 : 0.62,
      metalness: 0,
      map: coat ? furTexture : null,
      bumpMap: coat ? bumpTexture : null,
      bumpScale: 0.027,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMiloMorph = morph;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uMiloMorph;")
        .replace(
          "#include <alphatest_fragment>",
          "#include <alphatest_fragment>\nvec2 cell=floor(gl_FragCoord.xy/2.);float pixel=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);if(pixel>uMiloMorph)discard;",
        );
    };
    mat.customProgramCacheKey = () => "milo-soft-fur-morph-v2";
    materials.set(key, mat);
    return mat;
  }
  const sphere = new THREE.SphereGeometry(1, 28, 18);
  geometries.add(sphere);
  function oval(
    parent: THREE.Group,
    scale: [number, number, number],
    at: [number, number, number],
    color: string,
    coat = true,
  ) {
    const mesh = new THREE.Mesh(sphere, material(color, coat));
    mesh.scale.set(...scale);
    mesh.position.set(...at);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  oval(body, [3.0, 1.6, 1.48], [-0.45, 3.2, 0], "#b7abc6");
  oval(body, [2.55, 1.1, 1.36], [-0.4, 2.85, 0], "#d6ccdf");
  const neck = oval(rig, [1.33, 1.8, 1.24], [1.35, 3.65, 0], "#c9bdd7");
  const legs: THREE.Group[] = [];
  const legGeo = new THREE.CapsuleGeometry(0.48, 1.5, 6, 14);
  geometries.add(legGeo);
  for (const x of [-1.9, 1.65])
    for (const z of [-0.83, 0.83]) {
      const hip = new THREE.Group();
      hip.position.set(x, 2.75, z);
      rig.add(hip);
      legs.push(hip);
      oval(hip, [0.7, 0.85, 0.68], [0, -0.22, 0], "#b7abc6");
      const limb = new THREE.Mesh(legGeo, material("#bfb2ce", true));
      limb.position.y = -1.12;
      limb.receiveShadow = true;
      hip.add(limb);
      oval(hip, [0.7, 0.35, 0.57], [0.2, -2.38, 0], "#eee6f0", false);
      for (const toe of [-0.22, 0.11])
        oval(hip, [0.035, 0.09, 0.025], [0.82, -2.39, toe], "#af9dbc", false);
    }
  head.position.set(2.25, 4.5, 0);
  oval(head, [1.54, 1.42, 1.47], [0, 0.15, 0], "#cfc2dc");
  oval(head, [0.55, 0.87, 1.1], [1.04, -0.1, 0], "#ece4f0", false);
  const earShape = new THREE.Shape();
  earShape.moveTo(-0.63, 0);
  earShape.quadraticCurveTo(-0.48, 0.75, 0.15, 1.37);
  earShape.quadraticCurveTo(0.48, 0.72, 0.63, 0);
  earShape.closePath();
  const earGeo = new THREE.ExtrudeGeometry(earShape, {
    depth: 0.44,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.06,
  });
  earGeo.rotateY(Math.PI / 2);
  earGeo.computeVertexNormals();
  geometries.add(earGeo);
  for (const z of [-0.88, 0.88]) {
    const ear = new THREE.Mesh(earGeo, material("#b4a1c4"));
    ear.position.set(-0.2, 1.08, z);
    head.add(ear);
    oval(head, [0.045, 0.53, 0.27], [0.33, 1.65, z], "#cd9db9", false);
  }
  const eyes: THREE.Group[] = [],
    closedEyes: THREE.Mesh[] = [];
  function tube(parent: THREE.Group, points: THREE.Vector3[], radius: number, color: string) {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, radius, 6, false);
    geometries.add(geo);
    const mesh = new THREE.Mesh(geo, material(color));
    parent.add(mesh);
    return mesh;
  }
  for (const z of [-0.68, 0.68]) {
    const eye = new THREE.Group();
    eye.position.set(1.29, 0.37, z);
    head.add(eye);
    eyes.push(eye);
    oval(eye, [0.15, 0.41, 0.39], [0, 0, 0], "#4d3b59", false);
    oval(eye, [0.17, 0.31, 0.27], [0.06, 0, 0], "#a9c491", false);
    oval(eye, [0.18, 0.29, 0.09], [0.09, 0, 0], "#302b39", false);
    oval(eye, [0.19, 0.09, 0.085], [0.12, 0.16, 0.1], "#ffffff", false);
    const closed = tube(
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
    oval(head, [0.42, 0.35, 0.48], [1.35, -0.42, z * 0.56], "#f4edf5", false);
    for (const y of [-0.26, -0.49])
      tube(
        head,
        [
          new THREE.Vector3(1.4, y, z * 1.2),
          new THREE.Vector3(1.48, y + 0.06, z * 2),
          new THREE.Vector3(1.35, y + 0.11, z * 2.75),
        ],
        0.024,
        "#dfd1e8",
      );
  }
  oval(head, [0.15, 0.13, 0.23], [1.66, -0.18, 0], "#ba8ba9", false);
  tube(
    head,
    [
      new THREE.Vector3(1.64, -0.32, 0),
      new THREE.Vector3(1.66, -0.51, 0),
      new THREE.Vector3(1.62, -0.55, 0.17),
    ],
    0.026,
    "#8c708f",
  );
  const collarGeo = new THREE.TorusGeometry(1.2, 0.14, 8, 32);
  collarGeo.rotateY(Math.PI / 2);
  geometries.add(collarGeo);
  const collar = new THREE.Mesh(collarGeo, material("#8e78b0"));
  collar.position.set(1.62, 3.72, 0);
  rig.add(collar);
  const tag = oval(rig, [0.14, 0.24, 0.19], [1.75, 3.35, 1.28], "#d5bdf2", false);
  const tailCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 5 }, (_, i) => new THREE.Vector3(-2.7 - i * 0.32, 3.3 + i * 0.65, 0)),
  );
  const tailGeo = new THREE.TubeGeometry(tailCurve, 32, 0.33, 10, false);
  geometries.add(tailGeo);
  const tail = new THREE.Mesh(tailGeo, material("#b7a8c9", true));
  tail.receiveShadow = true;
  tail.frustumCulled = false;
  rig.add(tail);
  const center = new THREE.Vector3(),
    tangent = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    binormal = new THREE.Vector3(),
    up = new THREE.Vector3(0, 0, 1);
  function updateTail(time: number, curled: number) {
    tail.position.y = body.position.y * (1 - curled);
    const awake = [
      [-2.8, 3.2, 0],
      [-3.55, 3.7, 0.1],
      [-3.9, 4.65, 0.2],
      [-3.95, 5.65, 0.08],
      [-3.55, 6.2, -0.05],
    ];
    const asleep = [
      [-2.7, 1.7, 0],
      [-2.5, 1.05, 1.4],
      [-0.7, 0.85, 2.05],
      [1.3, 0.85, 2],
      [2.35, 1.15, 0.85],
    ];
    tailCurve.points.forEach((point, i) =>
      point.set(
        THREE.MathUtils.lerp(awake[i][0], asleep[i][0], curled),
        THREE.MathUtils.lerp(
          awake[i][1] + Math.sin(time * 1.8 - i * 0.45) * 0.12,
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
    const positions = tailGeo.getAttribute("position"),
      normals = tailGeo.getAttribute("normal");
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      tailCurve.getPoint(t, center);
      tailCurve.getTangent(t, tangent);
      // Parallel transport avoids a seam or a sudden twist while the tail curls.
      if (i === 0) normal.copy(up);
      normal.addScaledVector(tangent, -normal.dot(tangent));
      if (normal.lengthSq() < 0.00001) normal.set(0, 1, 0).addScaledVector(tangent, -tangent.y);
      normal.normalize();
      binormal.crossVectors(tangent, normal).normalize();
      const radius = 0.34 * (1 - 0.55 * t ** 2);
      for (let j = 0; j <= 10; j++) {
        const angle = (j / 10) * Math.PI * 2,
          index = i * 11 + j;
        const nx = normal.x * Math.cos(angle) + binormal.x * Math.sin(angle),
          ny = normal.y * Math.cos(angle) + binormal.y * Math.sin(angle),
          nz = normal.z * Math.cos(angle) + binormal.z * Math.sin(angle);
        positions.setXYZ(
          index,
          center.x + nx * radius,
          center.y + ny * radius,
          center.z + nz * radius,
        );
        normals.setXYZ(index, nx, ny, nz);
      }
    }
    positions.needsUpdate = normals.needsUpdate = true;
  }
  return {
    rig,
    body,
    neck,
    head,
    legs,
    eyes,
    closedEyes,
    collar,
    tag,
    updateTail,
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      furTexture.dispose();
      bumpTexture.dispose();
      rig.clear();
    },
  };
}
