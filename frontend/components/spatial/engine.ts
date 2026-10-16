import * as THREE from "three";
import {
  DEFAULT_SPATIAL_SETTINGS,
  MODE_NAMES,
  SPATIAL_CONFIG,
  type ActorSnapshot,
  type CameraView,
  type SpatialSettings,
} from "./config";
import { createMaterialFactory, createScanUniforms } from "./materials";
import { PointerScanner } from "./scanner";
import { snapshotActor, updateTraffic, type TrafficActor } from "./traffic";
import { createCity, type CityWorld } from "./world";
import type { SceneSubject } from "./scene-objects";
import { registerCityBridge, type CityAnchor, type CityPoint } from "./city-bridge";
import { createCityCat } from "./city-cat";
import { createCityCarPlay } from "./city-car-play";

type Callbacks = {
  onReady: () => void;
  onError: (message: string) => void;
  onSelect: (id: string | null) => void;
  onSnapshot: (actor: ActorSnapshot | null) => void;
  onView: (view: CameraView) => void;
  onPause: () => void;
};
type Label = {
  node: HTMLDivElement;
  caption: HTMLSpanElement;
  actor: SceneSubject | null;
  visible: boolean;
};

export class SpatialEngine {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(
    -50,
    50,
    50,
    -50,
    SPATIAL_CONFIG.camera.near,
    SPATIAL_CONFIG.camera.far,
  );
  private world: CityWorld;
  private cityCat = createCityCat();
  private carPlay: ReturnType<typeof createCityCarPlay>;
  private uniforms = createScanUniforms();
  private materials = createMaterialFactory(this.uniforms);
  private scanner: PointerScanner;
  private settings = { ...DEFAULT_SPATIAL_SETTINGS };
  private observer: ResizeObserver;
  private frame = 0;
  private previous = 0;
  private time = 0;
  private simulationTime = 0;
  private lastLabels = 0;
  private lastSnapshot = 0;
  private lastDraw = 0;
  private modeStarted = -Infinity;
  private width = 1;
  private height = 1;
  private mobile = false;
  private stopped = false;
  private dirty = true;
  private pointer = new THREE.Vector2();
  private ndc = new THREE.Vector2();
  private active = false;
  private touchedAt = 0;
  private pressed: {
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    orbit: boolean;
    touch: boolean;
  } | null = null;
  private desiredPosition = new THREE.Vector3();
  private desiredTarget = new THREE.Vector3();
  private target = new THREE.Vector3();
  private span = SPATIAL_CONFIG.camera.span as number;
  private desiredSpan = this.span;
  private raycaster = new THREE.Raycaster();
  private projected = new THREE.Vector3();
  private labels: Label[] = [];
  private hovered: string | null = null;
  private actorById = new Map<string, TrafficActor>();
  private listeners: Array<() => void> = [];
  private unregisterCity: (() => void) | null = null;
  constructor(
    private host: HTMLDivElement,
    private events: HTMLElement,
    private labelLayer: HTMLDivElement,
    private inspectorAnchor: HTMLDivElement,
    private callbacks: Callbacks,
  ) {
    this.mobile = host.clientWidth < 760;
    this.renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: this.mobile ? "low-power" : "high-performance",
      // Optional verification captures the GPU output without composited DOM elements.
      preserveDrawingBuffer: new URL(location.href).searchParams.get("spatialDebug") === "1",
    });
    this.renderer.debug.onShaderError = (gl, program) => {
      throw new Error(gl.getProgramInfoLog(program) || "Spatial shader compilation failed");
    };
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    // Architecture is static: retain its shadow atlas instead of redrawing it for every scan.
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio || 1,
        this.mobile ? SPATIAL_CONFIG.quality.mobileDpr : SPATIAL_CONFIG.quality.desktopDpr,
      ),
    );
    this.renderer.domElement.className = "spatial-canvas";
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    host.append(this.renderer.domElement);
    this.syncTheme();
    this.listen(window, "phuoc:theme", this.syncTheme);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xc4cac0, 1.65));
    const light = new THREE.DirectionalLight(0xfffcf1, 2.15);
    light.position.set(-65, 140, 45);
    light.castShadow = true;
    light.shadow.mapSize.set(SPATIAL_CONFIG.quality.shadows, SPATIAL_CONFIG.quality.shadows);
    light.shadow.camera.left = -155;
    light.shadow.camera.right = 155;
    light.shadow.camera.top = 155;
    light.shadow.camera.bottom = -155;
    light.shadow.camera.far = 450;
    light.shadow.normalBias = 0.09;
    light.shadow.bias = -0.00015;
    light.shadow.radius = 3;
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xf5f7ff, 0.17));
    this.world = createCity(this.materials, this.mobile, this.uniforms);
    this.carPlay = createCityCarPlay(this.world.actors);
    this.scene.add(this.world.root);
    this.scene.add(this.cityCat.root);
    this.host.dataset.pointCount = String(this.world.pointCloud.count);
    this.host.dataset.objectCount = String(
      this.world.sceneObjects.subjects.filter((subject) => subject.category !== "building").length,
    );
    this.host.dataset.vehicleCount = String(SPATIAL_CONFIG.world.vehicleCount);
    this.host.dataset.pedestrianCount = String(SPATIAL_CONFIG.world.pedestrianCount);
    this.world.actors.forEach((actor) => this.actorById.set(actor.id, actor));
    this.scanner = new PointerScanner(this.renderer);
    this.applyPreset("isometric", true);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    const roofs = this.world.sceneObjects.subjects.filter(
      (subject) =>
        subject.category === "building" &&
        Math.abs(subject.object.position.x) < 60 &&
        Math.abs(subject.object.position.z) < 60,
    );
    const anchors: CityAnchor[] = roofs.flatMap((subject) => [
      {
        id: subject.id,
        kind: "roof" as const,
        roofId: subject.id,
        point: {
          x: subject.object.position.x,
          y: subject.dimensions.y + 0.5,
          z: subject.object.position.z,
        },
      },
      ...[-1, 1].map((side) => ({
        id: `${subject.id}-stroll-${side}`,
        kind: "roof" as const,
        roofId: subject.id,
        point: {
          x: subject.object.position.x + side * subject.dimensions.x * 0.17,
          y: subject.dimensions.y + 0.5,
          z: subject.object.position.z + side * subject.dimensions.z * 0.1,
        },
      })),
      {
        id: `${subject.id}-wall`,
        kind: "wall" as const,
        point: {
          x: subject.object.position.x + subject.dimensions.x * 0.5 + 8.2,
          y: subject.dimensions.y + 0.4,
          z: subject.object.position.z,
        },
        landing: {
          x: subject.object.position.x + subject.dimensions.x * 0.5 - 5,
          y: subject.dimensions.y + 0.5,
          z: subject.object.position.z,
        },
      },
    ]);
    for (const x of [-42, -23, 22, 41])
      for (const z of [-9.2, 9.2])
        anchors.push({ id: `STREET_${x}_${z}`, kind: "street", point: { x, y: 0.4, z } });
    for (const z of [-39, -22, 23, 42])
      for (const x of [-9.2, 9.2])
        anchors.push({ id: `STREET_${x}_${z}`, kind: "street", point: { x, y: 0.4, z } });
    const cityRay = new THREE.Raycaster(),
      center = new THREE.Vector3(),
      foot = new THREE.Vector3(),
      crown = new THREE.Vector3(),
      hit = new THREE.Vector3();
    const bounds = roofs.map(
      (subject) =>
        new THREE.Box3(
          subject.object.position
            .clone()
            .add(new THREE.Vector3(-subject.dimensions.x * 0.5, 0, -subject.dimensions.z * 0.5)),
          subject.object.position
            .clone()
            .add(
              new THREE.Vector3(
                subject.dimensions.x * 0.5,
                subject.dimensions.y,
                subject.dimensions.z * 0.5,
              ),
            ),
        ),
    );
    // Milo's body extends out from the wall. Reject narrow alleys where that
    // clearance would put its torso inside a neighboring building.
    for (let index = anchors.length - 1; index >= 0; index--) {
      const anchor = anchors[index];
      if (
        anchor.kind === "wall" &&
        bounds.some(
          (box) =>
            box.max.x > anchor.point.x - 4.4 &&
            box.min.x < anchor.point.x + 7 &&
            box.max.z > anchor.point.z - 3 &&
            box.min.z < anchor.point.z + 3,
        )
      )
        anchors.splice(index, 1);
    }
    this.unregisterCity = registerCityBridge({
      borrowCar: (near) => this.carPlay.borrow(near),
      moveCar: (id, point, progress) => this.carPlay.move(id, point, progress),
      returnCar: (id, completed) => this.carPlay.release(id, completed),
      companion: (pose) => {
        this.cityCat.setPose(pose);
        this.host.dataset.milo3d = String(!!pose && pose.blend > 0.001);
        this.host.dataset.miloBlend = String(pose?.blend ?? 0);
        this.dirty = true;
      },
      available: () => !this.stopped && this.host.isConnected && !document.hidden,
      anchors: () => anchors,
      project: (point: CityPoint) => {
        const rect = this.host.getBoundingClientRect();
        foot.set(point.x, point.y, point.z).project(this.camera);
        crown.set(point.x, point.y + 18, point.z).project(this.camera);
        center.set(point.x, point.y + 8, point.z);
        const ndc = center.clone().project(this.camera);
        cityRay.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.camera);
        const distance = center.distanceTo(cityRay.ray.origin);
        const occluded = bounds.some(
          (box) =>
            !!cityRay.ray.intersectBox(box, hit) &&
            hit.distanceTo(cityRay.ray.origin) < distance - 0.7,
        );
        return {
          x: rect.left + (foot.x * 0.5 + 0.5) * this.width,
          y: rect.top + (-foot.y * 0.5 + 0.5) * this.height,
          height: Math.max(65, Math.min(140, Math.abs(crown.y - foot.y) * this.height * 0.5)),
          visible: !occluded && foot.z > -1 && foot.z < 1,
        };
      },
      ground: (x: number, y: number) => {
        const rect = this.host.getBoundingClientRect();
        cityRay.setFromCamera(
          new THREE.Vector2(
            ((x - rect.left) / this.width) * 2 - 1,
            1 - ((y - rect.top) / this.height) * 2,
          ),
          this.camera,
        );
        const point = cityRay.ray.intersectPlane(
          new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4),
          new THREE.Vector3(),
        );
        if (
          !point ||
          Math.abs(point.x) > 65 ||
          Math.abs(point.z) > 65 ||
          bounds.some(
            (box) =>
              point.x > box.min.x &&
              point.x < box.max.x &&
              point.z > box.min.z &&
              point.z < box.max.z,
          )
        )
          return null;
        return { x: point.x, y: point.y, z: point.z };
      },
      clearance: (from, to) => {
        let arc = 4;
        for (let i = 1; i < 20; i++) {
          const t = i / 20,
            x = from.x + (to.x - from.x) * t,
            z = from.z + (to.z - from.z) * t,
            y = from.y + (to.y - from.y) * t;
          for (const box of bounds)
            if (x > box.min.x && x < box.max.x && z > box.min.z && z < box.max.z)
              arc = Math.max(arc, (box.max.y + 0.6 - y) / (4 * t * (1 - t)));
        }
        return Math.min(34, arc);
      },
    });
    for (let index = 0; index < SPATIAL_CONFIG.quality.maxLabels; index++) {
      const node = document.createElement("div"),
        caption = document.createElement("span");
      node.className = "spatial-projected-object";
      caption.className = "spatial-object-caption mono";
      node.append(caption);
      node.setAttribute("aria-hidden", "true");
      labelLayer.append(node);
      this.labels.push({ node, caption, actor: null, visible: false });
    }
    this.listen(events, "pointermove", this.onPointerMove, true);
    this.listen(events, "pointerdown", this.onPointerDown, true);
    this.listen(events, "pointerup", this.onPointerUp, true);
    this.listen(
      events,
      "pointercancel",
      () => {
        this.pressed = null;
        this.active = false;
      },
      true,
    );
    this.listen(
      events,
      "pointerleave",
      () => {
        this.active = false;
        this.pressed = null;
        this.dirty = true;
      },
      true,
    );
    this.listen(events, "wheel", this.onWheel, { passive: false, capture: true });
    this.listen(events, "keydown", this.onKey, true);
    this.listen(document, "visibilitychange", () => {
      cancelAnimationFrame(this.frame);
      this.previous = 0;
      if (!document.hidden && !this.stopped) this.frame = requestAnimationFrame(this.tick);
    });
    this.listen(this.renderer.domElement, "webglcontextlost", (event) => {
      event.preventDefault();
      this.stopped = true;
      cancelAnimationFrame(this.frame);
      callbacks.onError("The 3D view is unavailable. Your workspace remains ready.");
    });
    this.frame = requestAnimationFrame(this.tick);
    callbacks.onReady();
  }
  private listen(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    target.addEventListener(type, listener, options);
    this.listeners.push(() => target.removeEventListener(type, listener, options));
  }
  private syncTheme = () => {
    const dark = document.documentElement.dataset.theme !== "light";
    this.uniforms.uThemeDark.value = dark ? 1 : 0;
    this.scene.background = new THREE.Color(dark ? "#151922" : SPATIAL_CONFIG.palette.background);
    this.host.dataset.theme = dark ? "dark" : "light";
    this.dirty = true;
  };
  setSettings(settings: SpatialSettings) {
    const previous = this.settings;
    this.settings = { ...settings };
    this.dirty = true;
    this.lastLabels = -Infinity;
    if (previous.view !== settings.view) this.applyPreset(settings.view, settings.reducedMotion);
    const uniforms = this.uniforms;
    if (previous.mode !== settings.mode) {
      uniforms.uPreviousMode.value = MODE_NAMES.indexOf(previous.mode);
      this.modeStarted = this.time;
    }
    uniforms.uMode.value = MODE_NAMES.indexOf(settings.mode);
    uniforms.uFull.value = settings.full ? 1 : 0;
    uniforms.uScientific.value = settings.scientific ? 1 : 0;
    uniforms.uInstance.value = settings.instance ? 1 : 0;
    uniforms.uActorHighlight.value = settings.actorHighlight ? 1 : 0;
    this.world.annotations.visible = settings.boxes && settings.mode !== "control";
    this.world.sceneObjects.root.visible = settings.mode === "normal";
    this.world.structure.visible = settings.mode === "lidar";
    this.world.controlVectors.root.visible = settings.mode === "control";
    this.world.sensorFans.root.visible = settings.mode === "lidar";
    if (previous.selected !== settings.selected) {
      this.refreshLabels();
      const actor = settings.selected ? this.actorById.get(settings.selected) : null;
      this.callbacks.onSnapshot(actor ? snapshotActor(actor, this.world.actors) : null);
    }
  }
  private applyPreset(view: CameraView, instant = false) {
    const preset = SPATIAL_CONFIG.presets[view];
    this.desiredPosition.fromArray(preset.position);
    this.desiredTarget.fromArray(preset.target);
    this.desiredSpan = preset.span * (this.mobile ? 1.4 : 1);
    if (instant) {
      this.camera.position.copy(this.desiredPosition);
      this.target.copy(this.desiredTarget);
      this.span = this.desiredSpan;
      this.camera.lookAt(this.target);
    }
    this.dirty = true;
  }
  resetCamera(view: CameraView) {
    this.applyPreset(view, this.settings.reducedMotion);
  }
  private resize() {
    const wasMobile = this.mobile;
    this.width = Math.max(1, this.host.clientWidth);
    this.height = Math.max(1, this.host.clientHeight);
    this.mobile = this.width < 760;
    if (wasMobile !== this.mobile) this.applyPreset(this.settings.view, true);
    this.renderer.setPixelRatio(
      Math.min(
        devicePixelRatio || 1,
        this.mobile ? SPATIAL_CONFIG.quality.mobileDpr : SPATIAL_CONFIG.quality.desktopDpr,
      ),
    );
    this.renderer.setSize(this.width, this.height);
    this.renderer.getDrawingBufferSize(this.uniforms.uDrawingSize.value);
    this.uniforms.uCssSize.value.set(this.width, this.height);
    this.scanner.resize(this.width, this.height);
    this.pointer.set(this.width * 0.6, this.height * 0.5);
    this.dirty = true;
    this.lastLabels = -Infinity;
  }
  private interactiveTarget(target: EventTarget | null) {
    return (
      target instanceof Element &&
      !!target.closest(
        ".app-window,.work-gallery,.app-launcher,.workspace-dock,.minimized-tray,.spatial-controls,.spatial-inspector,.spatial-footer button,.spatial-footer select,.milo,dialog",
      )
    );
  }
  private pointerCoordinates(event: PointerEvent) {
    const rect = this.host.getBoundingClientRect();
    this.pointer.set(event.clientX - rect.left, this.height - (event.clientY - rect.top));
    this.ndc.set((this.pointer.x / this.width) * 2 - 1, (this.pointer.y / this.height) * 2 - 1);
  }
  private onPointerDown: EventListener = (raw) => {
    const event = raw as PointerEvent;
    this.pointerCoordinates(event);
    if (event.button !== 0 || this.interactiveTarget(event.target)) return;
    this.events.focus({ preventScroll: true });
    this.active = true;
    this.touchedAt = performance.now();
    this.pressed = {
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      orbit: false,
      touch: event.pointerType === "touch",
    };
  };
  private onPointerMove: EventListener = (raw) => {
    const event = raw as PointerEvent;
    this.pointerCoordinates(event);
    if (this.interactiveTarget(event.target) && this.hovered) {
      this.hovered = null;
      this.lastLabels = -Infinity;
    }
    this.active = true;
    this.dirty = true;
    this.touchedAt = performance.now();
    if (this.pressed && !this.pressed.touch) {
      if (Math.hypot(event.clientX - this.pressed.x, event.clientY - this.pressed.y) > 5)
        this.pressed.orbit = true;
      if (this.pressed.orbit) {
        const offset = this.desiredPosition.clone().sub(this.desiredTarget),
          spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta -= (event.clientX - this.pressed.lastX) * 0.005;
        spherical.phi = THREE.MathUtils.clamp(
          spherical.phi + (event.clientY - this.pressed.lastY) * 0.004,
          0.08,
          1.3,
        );
        this.desiredPosition
          .copy(this.desiredTarget)
          .add(new THREE.Vector3().setFromSpherical(spherical));
        this.active = false;
      }
      this.pressed.lastX = event.clientX;
      this.pressed.lastY = event.clientY;
    }
  };
  private onPointerUp: EventListener = (raw) => {
    const event = raw as PointerEvent;
    this.pointerCoordinates(event);
    if (this.pressed && !this.pressed.orbit && !this.interactiveTarget(event.target)) {
      const actor = this.pickActor();
      this.callbacks.onSelect(actor?.id ?? null);
    }
    if (this.pressed?.touch) {
      this.active = true;
      this.touchedAt = performance.now();
    }
    this.pressed = null;
  };
  private onWheel: EventListener = (raw) => {
    const event = raw as WheelEvent;
    if (!event.ctrlKey && !event.metaKey) return;
    if (this.interactiveTarget(event.target)) return;
    event.preventDefault();
    this.desiredSpan = THREE.MathUtils.clamp(this.desiredSpan + event.deltaY * 0.025, 38, 140);
    this.dirty = true;
  };
  private onKey: EventListener = (raw) => {
    const event = raw as KeyboardEvent;
    if ((event.target as HTMLElement).closest("input,textarea,select,.app-window,dialog")) return;
    const views: Record<string, CameraView> = { "1": "isometric", "2": "top", "3": "street" };
    if (views[event.key]) {
      event.preventDefault();
      this.callbacks.onView(views[event.key]);
    }
    if (event.code === "Space" && !(event.target as HTMLElement).closest("button,a,summary")) {
      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onPause();
    }
    if (
      event.key === "Escape" &&
      (this.settings.selected || this.events.classList.contains("is-scene-focused"))
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onSelect(null);
      this.active = false;
      this.dirty = true;
    }
  };
  private pickActor() {
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hit = this.raycaster.intersectObjects(
      [...this.world.pickMeshes, ...this.world.occluders],
      false,
    )[0];
    return hit?.object.userData.actorId ? this.actorById.get(hit.object.userData.actorId) : null;
  }
  private projectedBounds(actor: SceneSubject) {
    const { x: w, y: h, z: d } = actor.dimensions;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const x of [-w / 2, w / 2])
      for (const y of [0, h])
        for (const z of [-d / 2, d / 2]) {
          this.projected.set(x, y, z).applyMatrix4(actor.object.matrixWorld).project(this.camera);
          if (this.projected.z < -1 || this.projected.z > 1) return null;
          const sx = (this.projected.x * 0.5 + 0.5) * this.width,
            sy = (-this.projected.y * 0.5 + 0.5) * this.height;
          minX = Math.min(minX, sx);
          maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy);
          maxY = Math.max(maxY, sy);
        }
    if (maxX < 0 || minX > this.width || maxY < 0 || minY > this.height) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  private occluded(actor: SceneSubject) {
    const point = actor.object.position
      .clone()
      .add(
        new THREE.Vector3(0, actor.dimensions.y * (this.actorById.has(actor.id) ? 0.6 : 1.03), 0),
      );
    this.projected.copy(point).project(this.camera);
    this.raycaster.setFromCamera(
      new THREE.Vector2(this.projected.x, this.projected.y),
      this.camera,
    );
    const distance = point.clone().sub(this.raycaster.ray.origin).dot(this.raycaster.ray.direction),
      hit = this.raycaster.intersectObjects(this.world.occluders, false)[0];
    return !!hit && hit.distance < distance - 0.4;
  }
  private refreshLabels() {
    if (!this.settings.labels && !this.settings.selected && !this.hovered) {
      this.labels.forEach((label) => {
        label.actor = null;
        label.node.style.opacity = "0";
      });
      return;
    }
    const points: THREE.Vector2[] = [],
      candidates: SceneSubject[] = [],
      occupied: Array<{ x: number; y: number }> = [];
    const sorted: SceneSubject[] = [
      ...this.world.actors,
      ...(this.settings.mode === "normal"
        ? this.world.sceneObjects.subjects.filter((subject) => subject.category !== "building")
        : []),
    ];
    const distance = (subject: SceneSubject) => {
      this.projected
        .copy(subject.object.position)
        .add(new THREE.Vector3(0, subject.dimensions.y, 0))
        .project(this.camera);
      return Math.hypot(
        (this.projected.x * 0.5 + 0.5) * this.width - this.pointer.x,
        (this.projected.y * 0.5 + 0.5) * this.height - this.pointer.y,
      );
    };
    const distances = new Map(sorted.map((subject) => [subject.id, distance(subject)]));
    sorted.sort((a, b) => {
      if (a.id === this.settings.selected) return -1;
      if (b.id === this.settings.selected) return 1;
      return distances.get(a.id)! - distances.get(b.id)!;
    });
    for (const actor of sorted) {
      if (candidates.length >= this.labels.length) break;
      if (
        this.settings.mode === "control" &&
        actor.category !== "vehicle" &&
        actor.id !== this.settings.selected
      )
        continue;
      if (!this.settings.labels && actor.id !== this.settings.selected && actor.id !== this.hovered)
        continue;
      const box = this.projectedBounds(actor);
      if (
        actor.id !== this.settings.selected &&
        distances.get(actor.id)! > (this.mobile ? 160 : 270)
      )
        continue;
      if (!box || box.y < 30 || box.y > this.height - 20 || this.occluded(actor)) continue;
      if (
        occupied.some((p) => Math.abs(p.x - box.x) < 100 && Math.abs(p.y - box.y) < 24) &&
        actor.id !== this.settings.selected
      )
        continue;
      candidates.push(actor);
      occupied.push({ x: box.x, y: box.y });
      points.push(
        new THREE.Vector2(
          (box.x + box.width / 2) / this.width,
          1 - (box.y + box.height / 2) / this.height,
        ),
      );
    }
    const visibility = this.settings.full ? points.map(() => 1) : this.scanner.visibility(points);
    this.labels.forEach((label, index) => {
      label.actor = candidates[index] ?? null;
      label.visible =
        !!candidates[index] &&
        (visibility[index] > 0.45 || candidates[index].id === this.settings.selected);
      label.node.dataset.category = label.actor?.category ?? "vehicle";
    });
  }
  private paintLabels() {
    this.labels.forEach((label) => {
      if (!label.actor || !label.visible) {
        label.node.style.opacity = "0";
        return;
      }
      const box = this.projectedBounds(label.actor);
      if (!box) {
        label.node.style.opacity = "0";
        return;
      }
      label.node.style.transform = `translate3d(${box.x}px,${box.y}px,0)`;
      label.node.style.width = `${box.width}px`;
      label.node.style.height = `${box.height}px`;
      label.node.style.opacity = "1";
      const moving = this.actorById.get(label.actor.id);
      label.caption.textContent = moving
        ? `${moving.id} · ${moving.category === "vehicle" ? `${moving.subtype.toUpperCase()} / ${(moving.speed * 3.6).toFixed(0)} km/h` : moving.status}`
        : `${label.actor.subtype.toUpperCase()} · ${label.actor.id}`;
      label.caption.style.display =
        this.settings.labels ||
        label.actor.id === this.settings.selected ||
        label.actor.id === this.hovered
          ? ""
          : "none";
      const offset =
        Math.max(0, 6 - box.x) + Math.min(0, this.width - 6 - box.x - label.caption.offsetWidth);
      label.caption.style.transform = `translateX(${offset}px)`;
    });
    const selected = this.settings.selected ? this.actorById.get(this.settings.selected) : null;
    if (selected) {
      const box = this.projectedBounds(selected);
      if (box) {
        const x = THREE.MathUtils.clamp(
          box.x + box.width + 24,
          this.mobile ? 12 : this.width * 0.52,
          Math.max(12, this.width - 282),
        );
        const y = THREE.MathUtils.clamp(box.y - 40, 130, Math.max(130, this.height - 300));
        this.inspectorAnchor.style.transform = `translate3d(${this.mobile ? 12 : x}px,${this.mobile ? Math.max(140, this.height - 340) : y}px,0)`;
      } else
        this.inspectorAnchor.style.transform = `translate3d(${this.mobile ? 12 : Math.max(12, this.width - 282)}px,${this.mobile ? Math.max(140, this.height - 340) : 140}px,0)`;
    }
  }
  private tick = (now: number) => {
    if (this.stopped || document.hidden) return;
    this.frame = requestAnimationFrame(this.tick);
    const frameInterval = this.mobile ? 1000 / SPATIAL_CONFIG.quality.mobileFps : 0;
    if (now - this.lastDraw < frameInterval) return;
    const delta = this.previous ? Math.min((now - this.previous) / 1000, 0.5) : 0.016;
    this.previous = now;
    this.lastDraw = now;
    this.time += delta;
    if (this.settings.reducedMotion && !this.dirty) return;
    try {
      this.carPlay.update(delta);
      this.host.dataset.miloCarState = this.carPlay.state;
      this.host.dataset.miloCarId = this.carPlay.actorId;
      if (!this.settings.paused && !this.settings.reducedMotion) {
        const steps = Math.max(1, Math.ceil(delta / 0.04));
        for (let step = 0; step < steps; step++) {
          this.simulationTime += delta / steps;
          updateTraffic(this.world.actors, this.simulationTime, delta / steps);
        }
      }
      this.host.dataset.vectorCount = String(
        this.settings.mode === "control" ? this.world.controlVectors.update() : 0,
      );
      this.host.dataset.sensorCount = String(
        this.settings.mode === "lidar" ? this.world.sensorFans.update() : 0,
      );
      this.host.dataset.turningCount = String(
        this.world.actors.filter(
          (a) => a.route?.phase === "junction" && a.route.turn !== "straight",
        ).length,
      );
      const damping = this.settings.reducedMotion
        ? 1
        : 1 - Math.exp((-delta * 4.8) / SPATIAL_CONFIG.camera.transitionSeconds);
      this.camera.position.lerp(this.desiredPosition, damping);
      this.target.lerp(this.desiredTarget, damping);
      this.span = THREE.MathUtils.lerp(this.span, this.desiredSpan, damping);
      const aspect = this.width / this.height;
      this.camera.left = -this.span * aspect * 0.5;
      this.camera.right = this.span * aspect * 0.5;
      this.camera.top = this.span * 0.5;
      this.camera.bottom = -this.span * 0.5;
      this.camera.lookAt(this.target);
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
      this.cityCat.update(
        this.time,
        delta,
        this.camera,
        this.width,
        this.height,
        this.host.getBoundingClientRect(),
      );
      this.world.root.updateMatrixWorld(true);
      let active = this.active && !this.pressed?.orbit;
      if (this.mobile && now - this.touchedAt > 1600) active = false;
      if (this.mobile && !this.settings.reducedMotion && now - this.touchedAt > 6000) {
        this.pointer.set(
          this.width * (0.5 + 0.17 * Math.sin(this.time * 0.18)),
          this.height * (0.47 + 0.11 * Math.cos(this.time * 0.22)),
        );
        active = true;
      }
      this.scanner.update(
        delta,
        this.time,
        this.pointer,
        active,
        this.mobile,
        this.settings.reducedMotion,
        this.settings.mode === "segments" ? 1.08 : 1,
      );
      const pointTarget = active && this.settings.mode === "control" ? 1 : 0;
      const pointDamping = this.settings.reducedMotion ? 1 : 1 - Math.exp(-delta * 14);
      this.uniforms.uPointer.value.lerp(this.pointer, pointDamping);
      this.uniforms.uNormalCoreRadius.value = this.mobile ? 52 : 84;
      this.uniforms.uNormalCoreTime.value = this.settings.reducedMotion ? 0 : this.time;
      this.uniforms.uNormalCoreStrength.value = THREE.MathUtils.lerp(
        this.uniforms.uNormalCoreStrength.value,
        active && this.settings.mode === "segments" ? 1 : 0,
        pointDamping,
      );
      let pointStrength = THREE.MathUtils.lerp(
        this.uniforms.uPointStrength.value,
        pointTarget,
        pointDamping,
      );
      if (pointStrength < 0.002) pointStrength = 0;
      this.uniforms.uPointStrength.value = pointStrength;
      this.uniforms.uPointRadius.value =
        this.settings.mode === "control" ? (this.mobile ? 100 : 165) : this.mobile ? 37 : 58;
      this.host.dataset.visiblePointCount = String(
        this.world.pointCloud.update(
          pointStrength > 0.001 && this.settings.mode === "control",
          this.camera,
          this.width,
          this.height,
          this.uniforms.uPointer.value,
          this.uniforms.uPointRadius.value,
        ),
      );
      this.uniforms.uRevealMask.value = this.scanner.texture;
      this.uniforms.uTime.value = this.time;
      this.uniforms.uModeBlend.value = this.settings.reducedMotion
        ? 1
        : Math.min(1, (this.time - this.modeStarted) / SPATIAL_CONFIG.motion.modeSeconds);
      if (this.time - this.lastLabels > 0.16) {
        this.refreshLabels();
        this.lastLabels = this.time;
      }
      if (this.settings.selected && this.time - this.lastSnapshot > 0.3) {
        const actor = this.actorById.get(this.settings.selected);
        if (actor) this.callbacks.onSnapshot(snapshotActor(actor, this.world.actors));
        this.lastSnapshot = this.time;
      }
      if (
        this.active &&
        !this.pressed &&
        this.time - this.lastLabels < 0.02 &&
        !this.interactiveTarget(
          document.elementFromPoint(
            this.pointer.x,
            this.host.getBoundingClientRect().top + this.height - this.pointer.y,
          ),
        )
      ) {
        const actor = this.pickActor();
        this.hovered = actor?.id ?? null;
        this.host.dataset.hovered = actor?.id ?? "";
        this.host.style.cursor = actor ? "pointer" : "grab";
      }
      this.world.actors.forEach((actor) => {
        actor.box.visible = this.settings.boxes;
      });
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
      this.paintLabels();
      this.host.dataset.mode = this.settings.mode;
      this.host.dataset.view = this.settings.view;
      this.host.dataset.paused = String(this.settings.paused || this.settings.reducedMotion);
      this.dirty = false;
    } catch (error) {
      this.stopped = true;
      cancelAnimationFrame(this.frame);
      console.error("Spatial scene:", error);
      this.callbacks.onError(
        "The 3D view could not start. The rest of the workspace is available.",
      );
    }
  };
  dispose() {
    this.stopped = true;
    this.unregisterCity?.();
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.listeners.forEach((remove) => remove());
    this.labels.forEach((label) => label.node.remove());
    this.world.dispose();
    this.cityCat.dispose();
    this.materials.dispose();
    this.scanner.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
