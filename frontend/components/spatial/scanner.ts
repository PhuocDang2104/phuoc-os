import * as THREE from "three";
import { SPATIAL_CONFIG } from "./config";
import { maskFragment, maskVertex, revealGLSL } from "./shaders";

export class PointerScanner {
  private targets = [
    new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false }),
    new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false }),
  ];
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private quad: THREE.Mesh;
  private current = 0;
  private smoothed = new THREE.Vector2();
  private initialized = false;
  private wasActive = false;
  private material: THREE.ShaderMaterial;
  private samples = new THREE.WebGLRenderTarget(SPATIAL_CONFIG.quality.maxLabels, 1, {
    depthBuffer: false,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });
  private sampleMaterial: THREE.ShaderMaterial;
  private bytes = new Uint8Array(SPATIAL_CONFIG.quality.maxLabels * 4);
  constructor(private renderer: THREE.WebGLRenderer) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: maskVertex,
      fragmentShader: maskFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPrevious: { value: null },
        uCssSize: { value: new THREE.Vector2() },
        uFrom: { value: new THREE.Vector2() },
        uTo: { value: new THREE.Vector2() },
        uDelta: { value: 0 },
        uTau: { value: SPATIAL_CONFIG.scanner.trailTau },
        uRadius: { value: SPATIAL_CONFIG.scanner.desktopRadius },
        uActive: { value: 0 },
        uTime: { value: 0 },
      },
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    // One tiny readback supplies all DOM label visibility from the exact GPU reveal field.
    this.sampleMaterial = new THREE.ShaderMaterial({
      vertexShader: maskVertex,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uRevealMask: { value: null },
        uDrawingSize: { value: new THREE.Vector2(SPATIAL_CONFIG.quality.maxLabels, 1) },
        uCssSize: { value: new THREE.Vector2() },
        uFull: { value: 0 },
        uPixelSize: { value: SPATIAL_CONFIG.scanner.pixelSize },
        uEdgeNoise: { value: SPATIAL_CONFIG.scanner.edgeNoise },
        uPoints: {
          value: Array.from(
            { length: SPATIAL_CONFIG.quality.maxLabels },
            () => new THREE.Vector2(),
          ),
        },
      },
      fragmentShader: `${revealGLSL}\nuniform vec2 uPoints[${SPATIAL_CONFIG.quality.maxLabels}];\nvoid main(){ int index=int(floor(gl_FragCoord.x)); vec2 css=uPoints[index]*uCssSize; vec2 cell=floor(css/uPixelSize); vec2 uv=(cell*uPixelSize+uPixelSize*.5)/uCssSize; float field=texture2D(uRevealMask,uv).r; float threshold=.11+uEdgeNoise*scanHash(cell)+uEdgeNoise*.33*scanHash(floor(cell/3.)); float reveal=smoothstep(threshold,threshold+.085,field); gl_FragColor=vec4(vec3(reveal),1.); }`,
    });
  }
  get texture() {
    return this.targets[this.current].texture;
  }
  resize(width: number, height: number) {
    const w =
        width < 760 ? SPATIAL_CONFIG.scanner.mobileMaskWidth : SPATIAL_CONFIG.scanner.maskWidth,
      h = Math.max(128, Math.round((w * height) / width));
    this.targets.forEach((target) => {
      target.setSize(w, h);
      this.renderer.setRenderTarget(target);
      this.renderer.setClearColor(0, 1);
      this.renderer.clear();
    });
    this.renderer.setRenderTarget(null);
    this.material.uniforms.uCssSize.value.set(width, height);
    this.sampleMaterial.uniforms.uCssSize.value.set(width, height);
    this.initialized = false;
  }
  update(
    delta: number,
    time: number,
    pointer: THREE.Vector2,
    active: boolean,
    mobile: boolean,
    reduced: boolean,
    radiusScale = 1,
  ) {
    if (!this.initialized || (active && !this.wasActive)) {
      this.smoothed.copy(pointer);
      this.initialized = true;
    }
    this.wasActive = active;
    const uniforms = this.material.uniforms;
    uniforms.uFrom.value.copy(this.smoothed);
    this.smoothed.lerp(
      pointer,
      reduced ? 1 : 1 - Math.exp(-delta / SPATIAL_CONFIG.scanner.dampingSeconds),
    );
    uniforms.uTo.value.copy(this.smoothed);
    uniforms.uDelta.value = reduced ? 1 : delta;
    uniforms.uTime.value = time;
    uniforms.uTau.value = reduced ? 0.025 : SPATIAL_CONFIG.scanner.trailTau;
    uniforms.uRadius.value =
      (mobile ? SPATIAL_CONFIG.scanner.mobileRadius : SPATIAL_CONFIG.scanner.desktopRadius) *
      radiusScale;
    uniforms.uActive.value = active ? 1 : 0;
    uniforms.uPrevious.value = this.texture;
    const next = 1 - this.current;
    this.quad.material = this.material;
    this.renderer.setRenderTarget(this.targets[next]);
    this.renderer.render(this.scene, this.camera);
    this.current = next;
    this.renderer.setRenderTarget(null);
  }
  visibility(points: THREE.Vector2[]) {
    if (!points.length) return [];
    const uniforms = this.sampleMaterial.uniforms;
    uniforms.uRevealMask.value = this.texture;
    points
      .slice(0, SPATIAL_CONFIG.quality.maxLabels)
      .forEach((point, index) => uniforms.uPoints.value[index].copy(point));
    this.quad.material = this.sampleMaterial;
    this.renderer.setRenderTarget(this.samples);
    this.renderer.render(this.scene, this.camera);
    this.renderer.readRenderTargetPixels(
      this.samples,
      0,
      0,
      SPATIAL_CONFIG.quality.maxLabels,
      1,
      this.bytes,
    );
    this.renderer.setRenderTarget(null);
    this.quad.material = this.material;
    return points
      .slice(0, SPATIAL_CONFIG.quality.maxLabels)
      .map((_, index) => this.bytes[index * 4] / 255);
  }
  dispose() {
    this.targets.forEach((target) => target.dispose());
    this.samples.dispose();
    this.material.dispose();
    this.sampleMaterial.dispose();
    this.quad.geometry.dispose();
  }
}
