// A small bridge lets the existing draggable companion share the city's coordinates.
// It does not import Three.js into the first-paint companion bundle.
export type CityPoint = { x: number; y: number; z: number };
export type CityAnchor = {
  id: string;
  kind: "roof" | "street" | "wall";
  point: CityPoint;
  landing?: CityPoint;
};
export type CityCarPlay = { id: string; from: CityPoint; to: CityPoint; heading: number };
export type CityProjection = { x: number; y: number; height: number; visible: boolean };
export type CityCatPose = {
  point: CityPoint;
  heading: number;
  action: string;
  blend: number;
  facing: number;
  screen?: { x: number; y: number };
  progress?: number;
  carrying?: boolean;
};
export type CityBridge = {
  available: () => boolean;
  anchors: () => CityAnchor[];
  project: (point: CityPoint) => CityProjection;
  ground: (x: number, y: number) => CityPoint | null;
  clearance: (from: CityPoint, to: CityPoint) => number;
  companion: (pose: CityCatPose | null) => void;
  borrowCar: (near: CityPoint) => CityCarPlay | null;
  moveCar: (id: string, point: CityPoint, progress: number) => void;
  returnCar: (id: string, completed: boolean) => void;
};
let current: CityBridge | null = null;
export const getCityBridge = () => current;
export function registerCityBridge(bridge: CityBridge) {
  current = bridge;
  return () => {
    if (current === bridge) current = null;
  };
}
