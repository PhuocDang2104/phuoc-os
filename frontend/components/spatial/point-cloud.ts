import * as THREE from "three";
import type { ScanUniforms } from "./materials";
import type { TrafficActor } from "./traffic";
import { revealGLSL } from "./shaders";

export function createPointCloud(
  city: THREE.Group,
  actors: TrafficActor[],
  shared: ScanUniforms,
  mobile: boolean,
) {
  const material = new THREE.ShaderMaterial({
    uniforms: shared,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    vertexShader: `
      uniform vec2 uCssSize,uDrawingSize,uPointer; uniform float uPointRadius,uPointStrength,uTime;
      varying vec3 vCloudNormal,vCloudWorld;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.);
        vCloudNormal=normalize(mat3(modelMatrix)*normal); vCloudWorld=world.xyz;
        vec4 clip=projectionMatrix*viewMatrix*world;
        vec2 css=(clip.xy/clip.w*.5+.5)*uCssSize;
        float core=(1.-smoothstep(uPointRadius*.58,uPointRadius,length(css-uPointer)))*uPointStrength;
        world.xyz+=vCloudNormal*sin(uTime*1.3+dot(position,vec3(2.1,1.7,3.2)))*.012*core;
        gl_Position=projectionMatrix*viewMatrix*world;
        gl_Position.z-=.000025*gl_Position.w;
        gl_PointSize=(1.35+.18*sin(position.y))*uDrawingSize.y/uCssSize.y;
      }`,
    fragmentShader: `${revealGLSL}
      uniform int uMode; uniform float uThemeDark;
      varying vec3 vCloudNormal,vCloudWorld;
      void main(){
        float circle=1.-smoothstep(.3,.5,length(gl_PointCoord-.5));
        float core=pointCloudCore();
        if(core<.01||circle<.01)discard;
        vec3 n=normalize(vCloudNormal);
        vec3 color=mix(vec3(.35,.3,1.),vec3(.9,.28,.78),n.z*.5+.5);
        color=mix(color,vec3(.1,.88,1.),smoothstep(.3,.8,n.y));
        if(uMode==4){float h=clamp(vCloudWorld.y/21.,0.,1.);color=mix(vec3(.15,.4,1.),vec3(.18,1.,.55),smoothstep(0.,.6,h));color=mix(color,vec3(1.,.4,.18),smoothstep(.55,1.,h));}
        gl_FragColor=vec4(pow(color,vec3(2.2)),core*circle*.95);
        #include <colorspace_fragment>
      }`,
  });
  const geometries: THREE.BufferGeometry[] = [],
    objects: THREE.Points[] = [];
  const p = new THREE.Vector3(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    n = new THREE.Vector3(),
    ab = new THREE.Vector3(),
    ac = new THREE.Vector3(),
    matrix = new THREE.Matrix4(),
    instance = new THREE.Matrix4(),
    normalMatrix = new THREE.Matrix3();
  let seed = 421;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function sample(meshes: THREE.Mesh[], budget: number, local = false) {
    const positions: number[] = [],
      normals: number[] = [];
    // Allocate by surface area across the entire scene, never by mesh order.
    // Increasing density must not leave the last buildings or small vehicles empty.
    const faces: {
      a: THREE.Vector3;
      b: THREE.Vector3;
      c: THREE.Vector3;
      n: THREE.Vector3;
      area: number;
    }[] = [];
    let totalArea = 0;
    for (const mesh of meshes) {
      const geometry = mesh.geometry,
        pos = geometry.getAttribute("position"),
        norm = geometry.getAttribute("normal"),
        indices = geometry.index;
      if (!norm) continue;
      const count = mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
      for (let item = 0; item < count; item++) {
        matrix.copy(local ? mesh.matrix : mesh.matrixWorld);
        if (mesh instanceof THREE.InstancedMesh) {
          mesh.getMatrixAt(item, instance);
          matrix.multiply(instance);
        }
        if (!local && (Math.abs(matrix.elements[12]) > 210 || Math.abs(matrix.elements[14]) > 210))
          continue;
        normalMatrix.getNormalMatrix(matrix);
        for (let tri = 0; tri < (indices?.count ?? pos.count); tri += 3) {
          const ia = indices ? indices.getX(tri) : tri,
            ib = indices ? indices.getX(tri + 1) : tri + 1,
            ic = indices ? indices.getX(tri + 2) : tri + 2;
          a.fromBufferAttribute(pos, ia).applyMatrix4(matrix);
          b.fromBufferAttribute(pos, ib).applyMatrix4(matrix);
          c.fromBufferAttribute(pos, ic).applyMatrix4(matrix);
          const area = ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() * 0.5;
          if (area < 0.00001) continue;
          n.fromBufferAttribute(norm, ia).applyNormalMatrix(normalMatrix);
          const radius = Math.hypot((a.x + b.x + c.x) / 3, (a.z + b.z + c.z) / 3);
          const weight = local ? 1 : 1 + 3 * (1 - THREE.MathUtils.smoothstep(radius, 70, 190));
          const weightedArea = area * weight;
          faces.push({
            a: a.clone(),
            b: b.clone(),
            c: c.clone(),
            n: n.clone(),
            area: weightedArea,
          });
          totalArea += weightedArea;
        }
      }
    }
    let areaCursor = 0,
      emitted = 0;
    const density = budget / Math.max(totalArea, 0.001);
    for (const face of faces) {
      areaCursor += face.area;
      const end = Math.min(budget, Math.round(areaCursor * density));
      for (; emitted < end; emitted++) {
        const u = Math.sqrt(random()),
          v = random();
        p.copy(face.a)
          .multiplyScalar(1 - u)
          .addScaledVector(face.b, u * (1 - v))
          .addScaledVector(face.c, u * v);
        positions.push(p.x, p.y, p.z);
        normals.push(face.n.x, face.n.y, face.n.z);
      }
    }
    const groundSpacing = mobile ? 2 : 1.65;
    if (!local)
      for (let x = -200; x <= 200; x += groundSpacing)
        for (let z = -200; z <= 200; z += groundSpacing) {
          positions.push(x, 0.055, z);
          normals.push(0, 1, 0);
        }
    function makeCloud(points: number[], directions: number[]) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(directions, 3));
      geometry.computeBoundingSphere();
      geometries.push(geometry);
      const cloud = new THREE.Points(geometry, material);
      cloud.name = "Sampled surface point cloud";
      cloud.visible = false;
      objects.push(cloud);
      return cloud;
    }
    if (local) return makeCloud(positions, normals);
    // A scan covers a few city blocks. Cull other tiles before their vertices reach
    // the GPU, retaining a dense scene without drawing half a million hidden points.
    const tiles = new Map<string, { positions: number[]; normals: number[] }>();
    for (let i = 0; i < positions.length; i += 3) {
      const key = `${Math.floor(positions[i] / 24)}/${Math.floor(positions[i + 2] / 24)}`;
      let tile = tiles.get(key);
      if (!tile) {
        tile = { positions: [], normals: [] };
        tiles.set(key, tile);
      }
      tile.positions.push(positions[i], positions[i + 1], positions[i + 2]);
      tile.normals.push(normals[i], normals[i + 1], normals[i + 2]);
    }
    const group = new THREE.Group();
    tiles.forEach((tile) => group.add(makeCloud(tile.positions, tile.normals)));
    return group;
  }
  city.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  city.traverse((node) => {
    if (
      node instanceof THREE.Mesh &&
      !node.userData.actorId &&
      ["building", "vegetation", "infrastructure"].includes(
        (node.material as THREE.Material).userData.scanCategory,
      )
    )
      meshes.push(node);
  });
  city.add(sample(meshes, mobile ? 220000 : 420000));
  for (const actor of actors) {
    const body = actor.object.children.filter(
      (node): node is THREE.Mesh => node instanceof THREE.Mesh,
    );
    actor.object.add(sample(body, actor.category === "vehicle" ? 1100 : 260, true));
  }
  const center = new THREE.Vector3();
  return {
    update(
      enabled: boolean,
      camera: THREE.Camera,
      width: number,
      height: number,
      pointer: THREE.Vector2,
      radius: number,
    ) {
      const pixelsPerMeter =
        Math.max(
          Math.abs(camera.projectionMatrix.elements[0]) * width,
          Math.abs(camera.projectionMatrix.elements[5]) * height,
        ) * 0.5;
      let visiblePoints = 0;
      objects.forEach((cloud) => {
        if (!enabled) {
          cloud.visible = false;
          return;
        }
        const sphere = cloud.geometry.boundingSphere!;
        center.copy(sphere.center).applyMatrix4(cloud.matrixWorld).project(camera);
        const distance = Math.hypot(
          (center.x * 0.5 + 0.5) * width - pointer.x,
          (center.y * 0.5 + 0.5) * height - pointer.y,
        );
        cloud.visible =
          distance < radius + sphere.radius * pixelsPerMeter && center.z > -1.05 && center.z < 1.05;
        if (cloud.visible) visiblePoints += cloud.geometry.getAttribute("position").count;
      });
      return visiblePoints;
    },
    count: geometries.reduce((sum, g) => sum + g.getAttribute("position").count, 0),
    dispose() {
      objects.forEach((o) => o.removeFromParent());
      geometries.forEach((g) => g.dispose());
      material.dispose();
    },
  };
}
