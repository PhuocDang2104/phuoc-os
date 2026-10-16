export type ScanMode = "normal" | "lidar" | "segments" | "depth" | "control";
export type CameraView = "isometric" | "top" | "street";
export type SpatialSettings = {
  mode: ScanMode;
  view: CameraView;
  full: boolean;
  boxes: boolean;
  labels: boolean;
  instance: boolean;
  scientific: boolean;
  actorHighlight: boolean;
  paused: boolean;
  reducedMotion: boolean;
  selected: string | null;
};

export const SPATIAL_CONFIG = {
  scanner: {
    desktopRadius: 218,
    mobileRadius: 126,
    trailTau: 0.68,
    pixelSize: 4,
    edgeNoise: 0.2,
    dampingSeconds: 0.085,
    maskWidth: 512,
    mobileMaskWidth: 256,
  },
  quality: { desktopDpr: 1.5, mobileDpr: 1, mobileFps: 30, shadows: 1024, maxLabels: 14 },
  motion: { modeSeconds: 0.22 },
  world: { vehicleCount: 40, pedestrianCount: 32, routeLength: 132 },
  camera: { span: 121, near: 0.1, far: 1400, transitionSeconds: 0.8, depthNear: 65, depthFar: 250 },
  palette: {
    cyan: "#00d9ff",
    blue: "#265bff",
    violet: "#7950f2",
    magenta: "#ff49c8",
    background: "#f3f3ee",
  },
  presets: {
    isometric: { position: [95, 112, 121], target: [0, 0, 0], span: 121 },
    top: { position: [0, 175, 0.01], target: [0, 0, 0], span: 142 },
    street: { position: [90, 48, 110], target: [0, 1, 0], span: 102 },
  },
} as const;

export const MODE_NAMES: ScanMode[] = ["normal", "lidar", "segments", "depth", "control"];
export const DEFAULT_SPATIAL_SETTINGS: SpatialSettings = {
  mode: "segments",
  view: "isometric",
  full: false,
  boxes: true,
  labels: false,
  instance: false,
  scientific: false,
  actorHighlight: false,
  paused: false,
  reducedMotion: false,
  selected: null,
};
export const SEMANTIC_COLORS = {
  ground: "#18283e",
  building: "#aaa1ee",
  road: "#303c88",
  sidewalk: "#49b7b7",
  vegetation: "#5be7a7",
  vehicle: "#ffc278",
  pedestrian: "#ef78ca",
  marking: "#eee9c9",
  infrastructure: "#809fbf",
} as const;
export type SceneCategory = keyof typeof SEMANTIC_COLORS;

export type ActorSnapshot = {
  id: string;
  category: "vehicle" | "pedestrian";
  subtype: string;
  status: string;
  speed: number;
  heading: number;
  acceleration: number;
  steering: number;
  turn: string;
  lane: string;
  signal: string;
  nearest: number;
  range: number;
};
