import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { CityCatPose } from "./city-bridge";

// A real articulated mesh, sharing Milo's silver/lavender coat and green eyes.
// The city depth buffer, lights and camera apply to it exactly as to other geometry.
export function createCityCat() {
  const root = new THREE.Group(),
    rig = new THREE.Group(),
    torso = new THREE.Group(),
    head = new THREE.Group();
  root.name = "Milo / articulated 3D companion";
  root.visible = false;
  root.add(rig);
  rig.add(torso, head);
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Map<string, THREE.MeshStandardMaterial>();
  const morph = { value: 0 };
  let pose: CityCatPose | null = null,
    heading = 0,
    snapHeading = false;
  function material(color: string) {
    if (materials.has(color)) return materials.get(color)!;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.015 });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMiloMorph = morph;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uMiloMorph;")
        .replace(
          "#include <alphatest_fragment>",
          "#include <alphatest_fragment>\nvec2 cell=floor(gl_FragCoord.xy/2.);float pixel=fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);if(pixel>uMiloMorph)discard;",
        );
    };
    mat.customProgramCacheKey = () => "milo-voxel-morph-v1";
    materials.set(color, mat);
    return mat;
  }
  function part(
    parent: THREE.Group,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: string,
    r = 0.12,
  ) {
    const geometry = new RoundedBoxGeometry(w, h, d, 1, Math.min(w, h, d) * r);
    geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  part(torso, 5, 2.8, 2.55, -0.3, 3.25, 0, "#b5a9c2", 0.16);
  part(torso, 4.3, 1.35, 2.37, -0.1, 2.7, 0, "#e1d8e7", 0.15);
  part(torso, 3.6, 0.55, 2.5, -0.5, 4.6, 0, "#d1c5dc", 0.13);
  for (const x of [-1.8, -0.35, 1.1]) {
    part(torso, 0.34, 0.1, 2.5, x, 4.92, 0, "#8e7da1", 0.1);
    for (const z of [-1.28, 1.28]) part(torso, 0.4, 0.9, 0.07, x, 4.25, z, "#9685a6", 0.07);
  }
  const legs: THREE.Group[] = [];
  for (const x of [-1.9, 1.6])
    for (const z of [-0.84, 0.84]) {
      const hip = new THREE.Group();
      hip.position.set(x, 2.75, z);
      rig.add(hip);
      legs.push(hip);
      part(hip, 0.75, 2.3, 0.83, 0, -1.12, 0, "#b5a9c2", 0.13);
      part(hip, 1.12, 0.6, 0.93, 0.18, -2.4, 0, "#f1eaf3", 0.1);
      for (const offset of [-0.22, 0.1])
        part(hip, 0.04, 0.14, 0.04, 0.67, -2.38, offset, "#9685a6");
    }
  head.position.set(2.25, 4.5, 0);
  part(head, 2.5, 2.35, 2.5, 0, 0.25, 0, "#d1c5dc", 0.15);
  part(head, 0.12, 1.65, 2.0, 1.28, 0.17, 0, "#eee6f0", 0.1);
  // Triangular ear prisms have real thickness and a small pink inner face.
  const earShape = new THREE.Shape();
  earShape.moveTo(-0.6, 0);
  earShape.lineTo(0.6, 0);
  earShape.lineTo(0.16, 1.35);
  earShape.closePath();
  const earGeo = new THREE.ExtrudeGeometry(earShape, { depth: 0.55, bevelEnabled: false });
  earGeo.rotateY(Math.PI / 2);
  geometries.add(earGeo);
  for (const z of [-0.82, 0.82]) {
    const ear = new THREE.Mesh(earGeo, material("#ac9aba"));
    ear.position.set(-0.25, 1.25, z);
    head.add(ear);
    const innerGeo = new THREE.ExtrudeGeometry(earShape, { depth: 0.025, bevelEnabled: false });
    innerGeo.scale(0.58, 0.65, 1);
    innerGeo.rotateY(Math.PI / 2);
    geometries.add(innerGeo);
    const inner = new THREE.Mesh(innerGeo, material("#c793b1"));
    inner.position.set(0.32, 1.38, z);
    head.add(inner);
  }
  const eyes: THREE.Mesh[] = [];
  for (const z of [-0.67, 0.67]) {
    part(head, 0.12, 0.76, 0.66, 1.37, 0.4, z, "#44344f", 0.12);
    const iris = part(head, 0.15, 0.59, 0.43, 1.44, 0.42, z, "#b8caa8", 0.06);
    eyes.push(iris);
    part(head, 0.17, 0.52, 0.17, 1.47, 0.42, z, "#332a3b", 0.04);
    part(head, 0.19, 0.15, 0.13, 1.49, 0.65, z + 0.12, "#ffffff", 0.04);
    part(head, 0.42, 0.45, 0.69, 1.39, -0.38, z * 0.57, "#f5eff4", 0.22);
  }
  part(head, 0.22, 0.2, 0.32, 1.66, -0.13, 0, "#b384a1", 0.08);
  part(head, 0.14, 0.06, 0.48, 1.67, -0.52, 0, "#82667f", 0.08);
  for (const z of [-0.98, 0.98])
    for (const y of [-0.17, -0.43]) {
      const line = new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.4, y, z),
        new THREE.Vector3(1.49, y + 0.06, z * 1.55),
        new THREE.Vector3(1.43, y + 0.12, z * 2.03),
      ]);
      const geo = new THREE.TubeGeometry(line, 4, 0.025, 3, false);
      geometries.add(geo);
      head.add(new THREE.Mesh(geo, material("#d3c4df")));
    }
  part(head, 0.8, 0.13, 0.23, 0.6, 1.46, 0, "#9685a6");
  const collar = part(rig, 0.65, 0.3, 2.75, 1.42, 3.72, 0, "#81719f", 0.05);
  part(rig, 0.25, 0.46, 0.35, 1.8, 3.45, 1.36, "#cdb8ef", 0.05);
  const tail: THREE.Group[] = [];
  let parent = rig;
  for (let i = 0; i < 6; i++) {
    const joint = new THREE.Group();
    joint.position.set(i ? 0 : -2.7, i ? 0.84 : 3.2, 0);
    joint.rotation.z = i < 3 ? 0.43 : -0.31;
    parent.add(joint);
    part(
      joint,
      0.57,
      0.99,
      0.58,
      0,
      0.43,
      0,
      i === 5 ? "#e3dce9" : i % 2 ? "#a391b6" : "#c8bcd3",
      0.16,
    );
    tail.push(joint);
    parent = joint;
  }
  // A soft contact patch follows whichever roof or sidewalk the paws are on.
  const shadowData = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const distance = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5),
        i = (y * 64 + x) * 4;
      shadowData[i] = shadowData[i + 1] = shadowData[i + 2] = 12;
      shadowData[i + 3] = Math.max(0, 1 - distance) ** 2 * 100;
    }
  const shadowTex = new THREE.DataTexture(shadowData, 64, 64);
  shadowTex.needsUpdate = true;
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  const shadowGeo = new THREE.PlaneGeometry(12, 7);
  geometries.add(shadowGeo);
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  root.add(shadow);
  root.scale.setScalar(1.8);
  return {
    root,
    setPose(next: CityCatPose | null) {
      pose = next;
      if (!root.visible && !!next && next.blend > 0.001) snapHeading = true;
      root.visible = !!next && next.blend > 0.001;
      morph.value = next?.blend ?? 0;
    },
    update(
      time: number,
      delta: number,
      camera: THREE.Camera,
      width: number,
      height: number,
      rect: DOMRect,
    ) {
      if (!pose || !root.visible) return;
      root.position.set(pose.point.x, pose.point.y, pose.point.z);
      if (pose.screen) {
        const depth = root.position.clone().project(camera).z;
        root.position
          .set(
            ((pose.screen.x - rect.left) / width) * 2 - 1,
            1 - ((pose.screen.y - rect.top) / height) * 2,
            depth,
          )
          .unproject(camera);
      }
      const sideHeading =
        Math.atan2(camera.position.x, camera.position.z) + (pose.facing > 0 ? 0 : Math.PI);
      const desired = pose.screen ? sideHeading : pose.heading;
      if (snapHeading) {
        heading = desired;
        snapHeading = false;
      }
      heading +=
        Math.atan2(Math.sin(desired - heading), Math.cos(desired - heading)) *
        (1 - Math.exp(-delta * 9));
      root.rotation.y = heading;
      const moving = pose.action === "walk" || pose.action === "run" || pose.action === "climb",
        jumping = pose.action === "jump" || pose.action === "hop",
        resting = pose.action === "lie" || pose.action === "sleep",
        climbing = pose.action === "climb",
        carrying = pose.carrying === true,
        progress = pose.progress ?? 0.5;
      const smooth = (value: number) => {
        const p = THREE.MathUtils.clamp(value, 0, 1);
        return p * p * (3 - 2 * p);
      };
      const wallGrip = climbing
        ? smooth(progress / 0.14) * (1 - smooth((progress - 0.77) / 0.23))
        : 0;
      const landing = jumping ? smooth((progress - 0.77) / 0.23) : 0;
      const crouch = jumping ? Math.max(1 - smooth(progress / 0.18), landing) : 0;
      const pace = time * (pose.action === "run" ? 12 : 7);
      legs.forEach((leg, index) => {
        const beat = Math.sin(pace + (index === 0 || index === 3 ? 0 : Math.PI));
        const ledgeReach =
          climbing && index > 1
            ? smooth((progress - 0.73) / 0.08) * (1 - smooth((progress - 0.9) / 0.1)) * 0.6
            : 0;
        leg.rotation.z = climbing
          ? beat * 0.28 * wallGrip + (index > 1 ? -0.14 : 0.18) * wallGrip + ledgeReach
          : carrying && index > 1
            ? 0.7 - 0.08 * Math.sin(progress * Math.PI)
            : moving
              ? beat * 0.43
              : jumping
                ? index < 2
                  ? -0.62
                  : 0.47
                : resting
                  ? 1.1
                  : 0;
        leg.position.y =
          2.75 + (climbing ? Math.max(0, beat) * 0.22 * wallGrip : 0) - crouch * 0.25;
        leg.scale.y = 1 + wallGrip * 0.12;
      });
      torso.scale.set(1 + crouch * 0.06, resting ? 0.56 : 1 - crouch * 0.12, 1);
      torso.position.y = resting
        ? -1.1
        : Math.sin(time * (moving ? 14 : 2)) * (moving ? 0.07 : 0.035) - crouch * 0.3;
      head.position.y = resting ? 2.45 : 4.5 + Math.sin(time * 2) * 0.055 - crouch * 0.32;
      head.rotation.z = climbing
        ? -0.15 * wallGrip
        : pose.carrying
          ? -0.18
          : jumping
            ? 0.12 * Math.sin(progress * Math.PI) - 0.08 * landing
            : Math.sin(time * 0.7) * 0.025;
      head.rotation.y = moving || jumping ? 0 : Math.sin(time * 0.6) * 0.14 + pose.facing * 0.08;
      const pitch = climbing
        ? Math.PI * 0.5 * wallGrip
        : jumping
          ? -0.12 * Math.sin(progress * Math.PI)
          : 0;
      rig.rotation.z = THREE.MathUtils.lerp(rig.rotation.z, pitch, 1 - Math.exp(-delta * 15));
      collar.position.y = resting ? 2.2 : 3.72;
      tail.forEach((joint, index) => {
        joint.rotation.z =
          (index < 3 ? 0.43 : -0.31) + Math.sin(time * 2.1 - index * 0.55) * 0.14 - wallGrip * 0.16;
        joint.rotation.x =
          Math.sin(time * 1.5 - index * 0.7) * 0.13 + wallGrip * Math.sin(time * 2) * 0.08;
      });
      const blink = time % 6.7;
      eyes.forEach((eye) => {
        eye.scale.y = blink > 6.45 ? 0.15 : 1;
      });
      shadowMat.opacity = pose.blend * (1 - wallGrip) * (jumping ? 0.28 : 0.8);
      shadow.scale.setScalar(jumping ? 0.7 : 1);
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      shadowTex.dispose();
      shadowMat.dispose();
      root.clear();
    },
  };
}
