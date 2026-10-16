import * as THREE from "three";
import type { TrafficActor } from "./traffic";
import type { ScanUniforms } from "./materials";
import { previewRoute } from "./routes";
import { revealGLSL } from "./shaders";

export function createControlVectors(actors: TrafficActor[], shared: ScanUniforms) {
  const root = new THREE.Group();
  root.name = "Vehicle motion and steering";
  root.visible = false;
  const arrowGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(-0.5, 0, 0.78),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0.5, 0, 0.78),
  ]);
  function lineMaterial(color: THREE.Vector3) {
    return new THREE.ShaderMaterial({
      uniforms: { ...shared, uLineColor: { value: color } },
      transparent: true,
      depthTest: true,
      depthWrite: false,
      vertexShader: `varying float vAlong;void main(){vAlong=position.z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `${revealGLSL}
      uniform vec3 uLineColor;uniform float uThemeDark,uTime;varying float vAlong;
      void main(){float reveal=revealAtFragment();float pulse=pow(.5+.5*sin(vAlong*8.-uTime*5.),6.);
        float alpha=mix(.07,.85,reveal)*(.65+.35*pulse);if(alpha<.01)discard;
        vec3 color=mix(uLineColor*.25,uLineColor,uThemeDark);gl_FragColor=vec4(color,alpha);
        #include <colorspace_fragment>
      }`,
    });
  }
  const primary = lineMaterial(new THREE.Vector3(0.32, 0.9, 0.77)),
    secondary = lineMaterial(new THREE.Vector3(0.67, 0.53, 0.95));
  const geometries: THREE.BufferGeometry[] = [arrowGeometry];
  const vectors = actors
    .filter((a) => a.category === "vehicle")
    .map((actor) => {
      const group = new THREE.Group();
      root.add(group);
      const arrow = new THREE.LineSegments(arrowGeometry, primary);
      group.add(arrow);
      const steerGeo = new THREE.BufferGeometry();
      steerGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(18 * 3), 3));
      const steer = new THREE.LineSegments(steerGeo, secondary);
      group.add(steer);
      const pathGeo = new THREE.BufferGeometry();
      pathGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(18 * 3), 3));
      const path = new THREE.Line(pathGeo, primary);
      root.add(path);
      path.frustumCulled = false;
      geometries.push(steerGeo, pathGeo);
      return { actor, group, arrow, steerGeo, pathGeo };
    });
  const point = new THREE.Vector3();
  return {
    root,
    update() {
      let count = 0;
      for (const { actor, group, arrow, steerGeo, pathGeo } of vectors) {
        group.position.copy(actor.object.position);
        group.rotation.y = actor.object.rotation.y;
        arrow.position.y = actor.dimensions.y + 0.28;
        arrow.scale.z = actor.speed * 1.35;
        arrow.visible = actor.speed > 0.08;
        if (arrow.visible) count++;
        const steer = steerGeo.getAttribute("position") as THREE.BufferAttribute;
        const nose = actor.dimensions.z * 0.5 + 0.3;
        for (let i = 0; i < 8; i++) {
          const a = (actor.steering * i) / 8,
            b = (actor.steering * (i + 1)) / 8;
          steer.setXYZ(i * 2, Math.sin(a) * 3.5, 0.25, nose + Math.cos(a) * 3.5);
          steer.setXYZ(i * 2 + 1, Math.sin(b) * 3.5, 0.25, nose + Math.cos(b) * 3.5);
        }
        steer.setXYZ(16, 0, 0.25, nose);
        steer.setXYZ(
          17,
          Math.sin(actor.steering) * 4.3,
          0.25,
          nose + Math.cos(actor.steering) * 4.3,
        );
        steer.needsUpdate = true;
        steerGeo.computeBoundingSphere();
        const positions = pathGeo.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < 18; i++) {
          if (actor.route) previewRoute(actor.route, (i / 17) * (8 + actor.speed * 1.4), point);
          else point.copy(actor.object.position);
          positions.setXYZ(i, point.x, 0.2, point.z);
        }
        positions.needsUpdate = true;
      }
      return count;
    },
    dispose() {
      geometries.forEach((g) => g.dispose());
      primary.dispose();
      secondary.dispose();
      root.clear();
    },
  };
}
