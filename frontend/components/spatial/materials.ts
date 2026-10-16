import * as THREE from "three";
import { SPATIAL_CONFIG, SEMANTIC_COLORS, type SceneCategory } from "./config";
import { revealGLSL, surfaceDeclarations } from "./shaders";
import { createSurfaceTextures } from "./surface-textures";

export type ScanUniforms = ReturnType<typeof createScanUniforms>;
export function createScanUniforms() {
  const palette = (color: string) =>
    new THREE.Vector3().fromArray(new THREE.Color(color).convertLinearToSRGB().toArray());
  return {
    uRevealMask: { value: null as THREE.Texture | null },
    uDrawingSize: { value: new THREE.Vector2(1, 1) },
    uCssSize: { value: new THREE.Vector2(1, 1) },
    uFull: { value: 0 },
    uPixelSize: { value: SPATIAL_CONFIG.scanner.pixelSize as number },
    uEdgeNoise: { value: SPATIAL_CONFIG.scanner.edgeNoise as number },
    uNormalCyan: { value: palette(SPATIAL_CONFIG.palette.cyan) },
    uNormalBlue: { value: palette(SPATIAL_CONFIG.palette.blue) },
    uNormalViolet: { value: palette(SPATIAL_CONFIG.palette.violet) },
    uNormalMagenta: { value: palette(SPATIAL_CONFIG.palette.magenta) },
    uMode: { value: 2 },
    uPreviousMode: { value: 2 },
    uModeBlend: { value: 1 },
    uThemeDark: { value: 1 },
    uPointer: { value: new THREE.Vector2(-1000, -1000) },
    uPointStrength: { value: 0 },
    uPointRadius: { value: 58 },
    uNormalCoreRadius: { value: 84 },
    uNormalCoreStrength: { value: 0 },
    uNormalCoreTime: { value: 0 },
    uTime: { value: 0 },
    uScientific: { value: 0 },
    uInstance: { value: 0 },
    uActorHighlight: { value: 0 },
    uDepthRange: {
      value: new THREE.Vector2(SPATIAL_CONFIG.camera.depthNear, SPATIAL_CONFIG.camera.depthFar),
    },
    uCameraClip: {
      value: new THREE.Vector2(SPATIAL_CONFIG.camera.near, SPATIAL_CONFIG.camera.far),
    },
  };
}

export function createMaterialFactory(shared: ScanUniforms) {
  const textures = createSurfaceTextures();
  const materials: THREE.Material[] = [];
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  function surface(category: SceneCategory, color: string, instance = 0) {
    const key = `${category}-${color}-${instance}`;
    if (cache.has(key)) return cache.get(key)!;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: category === "vehicle" ? 0.48 : 0.94,
      metalness: category === "vehicle" ? 0.12 : 0,
    });
    material.userData.scanCategory = category;
    const classColor = new THREE.Vector3().fromArray(
      new THREE.Color(SEMANTIC_COLORS[category]).convertLinearToSRGB().toArray(),
    );
    const instanceColor = new THREE.Color(SEMANTIC_COLORS[category]);
    if (instance)
      instanceColor.offsetHSL(
        ((instance * 0.078) % 0.26) - 0.13,
        0.08,
        ((instance * 0.043) % 0.24) - 0.12,
      );
    const instanceSrgb = new THREE.Vector3().fromArray(
      instanceColor.clone().convertLinearToSRGB().toArray(),
    );
    const rgbPalette: Record<SceneCategory, string> = {
      ground: "#8c967d",
      building: "#c8c0b1",
      road: "#555b60",
      sidewalk: "#b9b5a9",
      vegetation: color === "#d1d4ca" ? "#76634b" : "#668452",
      vehicle: color,
      pedestrian: color,
      marking: "#e8e1c6",
      infrastructure: "#77858a",
    };
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, shared, {
        uClassColor: { value: classColor },
        uInstanceColor: { value: instanceSrgb },
        uIsActor: { value: category === "vehicle" || category === "pedestrian" ? 1 : 0 },
        uIsGround: { value: ["ground", "road", "sidewalk"].includes(category) ? 1 : 0 },
        uIsBuilding: { value: category === "building" ? 1 : 0 },
        uRgbTint: { value: new THREE.Color(rgbPalette[category]) },
        uSurfaceKind: {
          value:
            category === "road"
              ? 1
              : category === "building"
                ? 2
                : category === "vegetation"
                  ? 3
                  : 0,
        },
        uSurfaceSeed: { value: instance },
        uConcrete: { value: textures.concrete },
        uAsphalt: { value: textures.asphalt },
        uBrick: { value: textures.brick },
      });
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vScanNormal; varying vec3 vScanWorld;",
        )
        .replace(
          "#include <project_vertex>",
          `#include <project_vertex>
          vScanNormal = inverseTransformDirection(transformedNormal, viewMatrix);
          vec4 scanPosition = vec4(transformed, 1.);
          #ifdef USE_INSTANCING
            scanPosition = instanceMatrix * scanPosition;
          #endif
          vScanWorld = (modelMatrix * scanPosition).xyz;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\n" + surfaceDeclarations)
        .replace(
          "#include <tonemapping_fragment>",
          `vec3 scanWorldDx=dFdx(vScanWorld),scanWorldDy=dFdy(vScanWorld);
          vec3 daylightBeauty=gl_FragColor.rgb;
          float wall = 1.-smoothstep(.2,.5,abs(vScanNormal.y));
          vec2 wallUV=vec2(abs(vScanNormal.x)>.5?vScanWorld.z:vScanWorld.x,vScanWorld.y);
          vec2 win=fract(wallUV/vec2(1.8,3.05));
          float windowGrid=step(.23,win.x)*step(win.x,.67)*step(.3,win.y)*step(win.y,.62);
          float litWindow=step(.76,scanHash(floor(wallUV/vec2(1.8,3.05))));
          vec3 nightSurface = gl_FragColor.rgb * .067 * mix(1., .5, uIsGround) + vec3(.009, .012, .018);
          nightSurface += uIsBuilding*wall*windowGrid*mix(vec3(-.008),vec3(.025,.029,.036),litWindow);
          nightSurface *= .97 + .06*scanHash(floor(vScanWorld.xz*7.));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, nightSurface, uThemeDark);
          float scanReveal = revealAtFragment();
          if(scanReveal>.001) {
            vec3 naturalRgb=(uMode==0 || (uModeBlend<.999 && uPreviousMode==0))?rgbSurface(daylightBeauty):vec3(0.);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, analysisSurface(gl_FragColor.rgb,naturalRgb,scanWorldDx,scanWorldDy), scanReveal);
          }
          #include <tonemapping_fragment>`,
        );
    };
    material.customProgramCacheKey = () => "spatial-surface-v1";
    cache.set(key, material);
    materials.push(material);
    return material;
  }
  function annotation(color: string) {
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      depthTest: true,
      depthWrite: false,
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, shared);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\n" + revealGLSL)
        .replace(
          "#include <premultiplied_alpha_fragment>",
          "gl_FragColor.a *= revealAtFragment(); if(gl_FragColor.a < .02) discard;\n#include <premultiplied_alpha_fragment>",
        );
    };
    material.customProgramCacheKey = () => "spatial-annotation-v1";
    materials.push(material);
    return material;
  }
  return {
    surface,
    annotation,
    dispose: () => {
      materials.forEach((material) => material.dispose());
      textures.dispose();
    },
  };
}
export type MaterialFactory = ReturnType<typeof createMaterialFactory>;
