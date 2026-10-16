import * as THREE from "three";
import type { ScanUniforms } from "./materials";
import type { TrafficActor } from "./traffic";
import { revealGLSL } from "./shaders";

export function createSensorFans(actors: TrafficActor[], shared: ScanUniforms) {
  const root = new THREE.Group();
  root.name = "Forward lidar waves";
  root.visible = false;
  const vertices: number[] = [];
  for (let i = 0; i < 48; i++) {
    const a = -0.84 + (i / 48) * 1.68,
      b = -0.84 + ((i + 1) / 48) * 1.68;
    vertices.push(
      0,
      0,
      0,
      Math.sin(a) * 17,
      0,
      Math.cos(a) * 17,
      Math.sin(b) * 17,
      0,
      Math.cos(b) * 17,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: shared,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vFan;void main(){vFan=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `${revealGLSL}
      uniform float uTime,uThemeDark; varying vec2 vFan;
      void main(){float r=length(vFan),theta=atan(vFan.x,vFan.y);float width=max(fwidth(r),.035);
        float ring=1.-smoothstep(width,width*2.,abs(mod(r-uTime*4.5,4.)-2.));
        float rays=1.-smoothstep(.003,.014,abs(mod(theta+.04,.12)-.06));
        float fade=smoothstep(.4,2.,r)*(1.-smoothstep(11.,17.,r))*(1.-smoothstep(.68,.84,abs(theta)));
        float alpha=(ring*.58+rays*.065+.018)*fade*mix(.18,1.,revealAtFragment());
        if(alpha<.006)discard;
        vec3 color=mix(vec3(.025,.26,.25),vec3(.22,.86,.88),uThemeDark);
        gl_FragColor=vec4(color,alpha);
        #include <colorspace_fragment>
      }`,
  });
  const fans = actors
    .filter((a) => a.category === "vehicle")
    .map((actor) => {
      const fan = new THREE.Mesh(geometry, material);
      fan.renderOrder = 2;
      root.add(fan);
      return { actor, fan };
    });
  return {
    root,
    update() {
      for (const { actor, fan } of fans) {
        const yaw = actor.object.rotation.y;
        fan.position.copy(actor.object.position);
        fan.position.x += Math.sin(yaw) * actor.dimensions.z * 0.5;
        fan.position.z += Math.cos(yaw) * actor.dimensions.z * 0.5;
        fan.position.y = 0.19;
        fan.rotation.y = yaw;
      }
      return fans.length;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      root.clear();
    },
  };
}
