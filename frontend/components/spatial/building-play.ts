import * as THREE from "three";
import type { CityBuildingPlay, CityCatPose, CityPoint } from "./city-bridge";
import type { ScanUniforms } from "./materials";
import type { CityWorld } from "./world";
import { buildingRebuildGLSL } from "./building-rebuild-shader";

type Building = { id: string; box: THREE.Box3; center: THREE.Vector3 };
type Grain = {
  home: THREE.Vector3;
  rubble: THREE.Vector3;
  normal: THREE.Vector3;
  seed: number;
  threshold: number;
};
const ease = (p: number) => {
  const t = THREE.MathUtils.clamp(p, 0, 1);
  return t * t * (3 - 2 * t);
};

export function createBuildingPlay(world: CityWorld, uniforms: ScanUniforms, mobile: boolean) {
  const buildings: Building[] = world.sceneObjects.subjects
    .filter(
      (s) =>
        s.category === "building" &&
        Math.abs(s.object.position.x) < 60 &&
        Math.abs(s.object.position.z) < 60,
    )
    .map((s) => ({
      id: s.id,
      center: s.object.position.clone(),
      box: new THREE.Box3(
        new THREE.Vector3(
          s.object.position.x - s.dimensions.x / 2,
          0.16,
          s.object.position.z - s.dimensions.z / 2,
        ),
        new THREE.Vector3(
          s.object.position.x + s.dimensions.x / 2,
          s.dimensions.y + 0.55,
          s.object.position.z + s.dimensions.z / 2,
        ),
      ),
    }));
  const root = new THREE.Group();
  root.name = "Milo / voxel reconstruction";
  root.visible = false;
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.72,
    emissive: 0x4d3e91,
    emissiveIntensity: 0.25,
  });
  const geometry = new THREE.BoxGeometry(1, 1, 1),
    particles = new THREE.InstancedMesh(geometry, material, mobile ? 760 : 1450);
  particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  particles.frustumCulled = false;
  root.add(particles);
  world.root.add(root);
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRebuildWorld;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
      vec4 rebuildPosition=vec4(transformed,1.);
      #ifdef USE_INSTANCING
      rebuildPosition=instanceMatrix*rebuildPosition;
      #endif
      vRebuildWorld=(modelMatrix*rebuildPosition).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vRebuildWorld;\n" + buildingRebuildGLSL,
      )
      .replace("void main() {", "void main() {\nif(rebuildDiscard(vRebuildWorld))discard;");
  };
  depth.customProgramCacheKey = () => "milo-rebuild-depth-v1";
  const originals = new Map<THREE.Mesh, THREE.Material | undefined>();
  world.root.traverse((node) => {
    if (
      node instanceof THREE.Mesh &&
      (node.material as THREE.Material).userData.scanCategory === "building"
    ) {
      originals.set(node, node.customDepthMaterial);
      node.customDepthMaterial = depth;
    }
  });
  const matrix = new THREE.Matrix4(),
    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    scale = new THREE.Vector3(),
    color = new THREE.Color(),
    neutral = new THREE.Color(),
    blue = new THREE.Color("#789bff"),
    lilac = new THREE.Color("#c2a7ff");
  let active: Building | null = null,
    phase: "idle" | "shattering" | "rubble" | "rebuilding" = "idle",
    elapsed = 0,
    time = 0,
    lastEvent = -100,
    lastShadow = -1,
    departed = 0;
  let grains: Grain[] = [],
    outlines: THREE.Object3D[] = [];
  let seed = 701;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function distance(box: THREE.Box3, p: CityPoint) {
    return Math.hypot(
      Math.max(box.min.x - p.x, 0, p.x - box.max.x),
      Math.max(box.min.z - p.z, 0, p.z - box.max.z),
    );
  }
  function clear(from: CityPoint, to: CityPoint) {
    for (let i = 0; i <= 20; i++) {
      const t = i / 20,
        x = from.x + (to.x - from.x) * t,
        z = from.z + (to.z - from.z) * t,
        margin = 0.35 + 1.85 * Math.min(1, t * 4);
      if (
        buildings.some(
          (b) =>
            x > b.box.min.x - margin &&
            x < b.box.max.x + margin &&
            z > b.box.min.z - margin &&
            z < b.box.max.z + margin,
        )
      )
        return false;
    }
    return true;
  }
  function sample(building: Building) {
    const faces: {
        a: THREE.Vector3;
        b: THREE.Vector3;
        c: THREE.Vector3;
        n: THREE.Vector3;
        end: number;
      }[] = [],
      a = new THREE.Vector3(),
      b = new THREE.Vector3(),
      c = new THREE.Vector3(),
      ab = new THREE.Vector3(),
      ac = new THREE.Vector3(),
      instance = new THREE.Matrix4(),
      transform = new THREE.Matrix4();
    let area = 0;
    world.root.updateMatrixWorld(true);
    originals.forEach((_, mesh) => {
      const pos = mesh.geometry.getAttribute("position"),
        indices = mesh.geometry.index;
      for (let i = 0; i < (mesh instanceof THREE.InstancedMesh ? mesh.count : 1); i++) {
        transform.copy(mesh.matrixWorld);
        if (mesh instanceof THREE.InstancedMesh) {
          mesh.getMatrixAt(i, instance);
          transform.multiply(instance);
        }
        position.setFromMatrixPosition(transform);
        if (!building.box.containsPoint(position)) continue;
        for (let tri = 0; tri < (indices?.count ?? pos.count); tri += 3) {
          a.fromBufferAttribute(pos, indices ? indices.getX(tri) : tri).applyMatrix4(transform);
          b.fromBufferAttribute(pos, indices ? indices.getX(tri + 1) : tri + 1).applyMatrix4(
            transform,
          );
          c.fromBufferAttribute(pos, indices ? indices.getX(tri + 2) : tri + 2).applyMatrix4(
            transform,
          );
          const n = ab.subVectors(b, a).cross(ac.subVectors(c, a)),
            weight = n.length() * 0.5;
          if (weight < 0.0001) continue;
          area += weight;
          faces.push({
            a: a.clone(),
            b: b.clone(),
            c: c.clone(),
            n: n.clone().normalize(),
            end: area,
          });
        }
      }
    });
    if (!faces.length) return [];
    return Array.from({ length: particles.instanceMatrix.count }, () => {
      const target = random() * area;
      let lo = 0,
        hi = faces.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (faces[mid].end < target) lo = mid + 1;
        else hi = mid;
      }
      const face = faces[lo],
        u = Math.sqrt(random()),
        v = random(),
        home = face.a
          .clone()
          .multiplyScalar(1 - u)
          .addScaledVector(face.b, u * (1 - v))
          .addScaledVector(face.c, u * v),
        s = random();
      const dx = home.x - building.center.x,
        dz = home.z - building.center.z,
        theta = Math.atan2(dz, dx) + (s - 0.5) * 0.5,
        r = Math.hypot(dx, dz) + s * 2;
      return {
        home,
        normal: face.n,
        seed: s,
        threshold:
          0.08 +
          (0.64 * (home.y - building.box.min.y)) / (building.box.max.y - building.box.min.y) +
          0.25 * s,
        rubble: new THREE.Vector3(
          building.center.x + Math.cos(theta) * r,
          0.25 + s * 0.8,
          building.center.z + Math.sin(theta) * r,
        ),
      };
    });
  }
  function finish() {
    phase = "idle";
    root.visible = false;
    uniforms.uRebuildActive.value = 0;
    uniforms.uRebuildCoverage.value = 1;
    outlines.forEach((o) => (o.visible = true));
    outlines = [];
    active = null;
    grains = [];
    lastShadow = -1;
  }
  return {
    root,
    plan(near: CityPoint, view?: CityPoint): CityBuildingPlay | null {
      if (active || time - lastEvent < 85) return null;
      const options: { plan: CityBuildingPlay; distance: number }[] = [];
      for (const b of buildings)
        for (const [nx, nz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          if (view && nx * (view.x - b.center.x) + nz * (view.z - b.center.z) < 0) continue;
          const point = {
              x: b.center.x + nx * ((b.box.max.x - b.box.min.x) / 2 + 6.5),
              y: 0.4,
              z: b.center.z + nz * ((b.box.max.z - b.box.min.z) / 2 + 6.5),
            },
            leave = { x: point.x + nx * 9, y: 0.4, z: point.z + nz * 9 },
            d = Math.hypot(point.x - near.x, point.z - near.z);
          if (
            d < 7 ||
            d > 30 ||
            Math.abs(leave.x) > 60 ||
            Math.abs(leave.z) > 60 ||
            !clear(near, point) ||
            !clear(point, leave)
          )
            continue;
          options.push({
            distance: d,
            plan: { id: b.id, point, leave, heading: Math.atan2(nz, -nx) },
          });
        }
      options.sort((a, b) => a.distance - b.distance);
      return options[0]?.plan ?? null;
    },
    strike(id: string) {
      if (active || time - lastEvent < 85) return false;
      const b = buildings.find((b) => b.id === id);
      if (!b) return false;
      const sampled = sample(b);
      if (!sampled.length) return false;
      active = b;
      grains = sampled;
      elapsed = 0;
      departed = 0;
      phase = "shattering";
      lastEvent = time;
      lastShadow = -1;
      uniforms.uRebuildMin.value.copy(b.box.min);
      uniforms.uRebuildMax.value.copy(b.box.max);
      uniforms.uRebuildActive.value = 1;
      uniforms.uRebuildCoverage.value = 1;
      outlines = world.structure.children.filter(
        (o) => Math.hypot(o.position.x - b.center.x, o.position.z - b.center.z) < 0.5,
      );
      outlines.forEach((o) => (o.visible = false));
      particles.count = grains.length;
      root.visible = true;
      return true;
    },
    update(delta: number, pose: CityCatPose | null, reduced = false) {
      time += delta;
      if (!active) return false;
      if (reduced) {
        finish();
        return true;
      }
      elapsed += delta;
      if (phase === "shattering" && elapsed >= 2.5) {
        phase = "rubble";
        elapsed = 0;
      }
      if (phase === "rubble") {
        const away =
          !pose ||
          pose.blend < 0.1 ||
          distance(active.box, pose.point) > 10 ||
          pose.point.y > active.box.max.y + 8;
        departed = away ? departed + delta : 0;
        if (departed > 0.6 || elapsed > 24) {
          phase = "rebuilding";
          elapsed = 0;
        }
      }
      if (phase === "rebuilding" && elapsed >= 5.8) {
        finish();
        return true;
      }
      const rebuilding = phase === "rebuilding",
        p = rebuilding ? elapsed / 5.8 : elapsed / 2.5;
      const coverage =
        phase === "shattering"
          ? 1 - ease((elapsed - 0.8) / 1.4)
          : rebuilding
            ? ease((p - 0.08) / 0.92)
            : 0;
      uniforms.uRebuildCoverage.value = coverage;
      neutral.set(uniforms.uThemeDark.value > 0.5 ? "#9d96b6" : "#c8c0d7");
      material.emissiveIntensity = rebuilding ? 0.65 : 0.22;
      grains.forEach((g, i) => {
        let size = 0.18 + g.seed * 0.25;
        if (rebuilding) {
          const t = ease((p - g.seed * 0.14) / 0.84),
            noise = (1 - t) ** 2;
          position.lerpVectors(g.rubble, g.home, t);
          position.x += Math.sin(elapsed * 3 + g.seed * 31) * noise * 1.8;
          position.z += Math.cos(elapsed * 2.7 + g.seed * 31) * noise * 1.8;
          position.y += Math.sin(t * Math.PI) * noise * 3;
          size *= 1 - ease((coverage - g.threshold + 0.015) / 0.12);
          color
            .copy(blue)
            .lerp(lilac, g.seed)
            .lerp(neutral, t * 0.65);
        } else {
          const birth = ease((1 - coverage - (1 - g.threshold)) / 0.2),
            fall = ease((elapsed - 0.8 - g.seed * 0.35) / 1.4);
          if (phase === "rubble") position.copy(g.rubble);
          else
            position
              .lerpVectors(g.home, g.rubble, fall)
              .addScaledVector(g.normal, Math.sin(fall * Math.PI) * 0.8);
          size *= phase === "rubble" ? 1 : birth;
          color.copy(neutral).lerp(lilac, birth * 0.35);
        }
        matrix.makeRotationFromEuler(
          rotation.set(
            g.seed * (rebuilding ? 1 - p : phase === "rubble" ? 1 : p) * 3,
            g.seed * 4,
            0,
          ),
        );
        matrix.scale(scale.setScalar(Math.max(0.0001, size)));
        matrix.setPosition(position);
        particles.setMatrixAt(i, matrix);
        particles.setColorAt(i, color);
      });
      particles.instanceMatrix.needsUpdate = true;
      if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
      const shadow = Math.floor(coverage * 10);
      if (shadow !== lastShadow) {
        lastShadow = shadow;
        return true;
      }
      return false;
    },
    unavailable(id: string) {
      return active?.id === id;
    },
    occludes(point: THREE.Vector3) {
      return !(active && uniforms.uRebuildCoverage.value === 0 && active.box.containsPoint(point));
    },
    get state() {
      return phase;
    },
    get buildingId() {
      return active?.id ?? "";
    },
    get count() {
      return grains.length;
    },
    dispose() {
      finish();
      originals.forEach((original, mesh) => (mesh.customDepthMaterial = original));
      particles.dispose();
      geometry.dispose();
      material.dispose();
      depth.dispose();
      root.removeFromParent();
    },
  };
}
