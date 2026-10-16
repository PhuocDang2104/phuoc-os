import * as THREE from "three";

export const ROAD_SPACING = 66;
const CORNER = 9,
  OFFSET = 2.15,
  BOUND = 2;
const directions = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;
export type VehicleRoute = {
  from: THREE.Vector2;
  to: THREE.Vector2;
  heading: number;
  exit: number;
  phase: "street" | "junction";
  curve: THREE.Curve<THREE.Vector3>;
  length: number;
  progress: number;
  seed: number;
  trips: number;
  turn: "straight" | "left" | "right";
  nextCurve?: THREE.Curve<THREE.Vector3>;
  nextLength?: number;
  committed?: boolean;
  reserved?: boolean;
};
const point = (node: THREE.Vector2, heading: number, along: number) => {
  const [dx, dz] = directions[heading];
  return new THREE.Vector3(
    node.x + dx * along - dz * OFFSET,
    0.14,
    node.y + dz * along + dx * OFFSET,
  );
};
const validExit = (node: THREE.Vector2, heading: number) => {
  const [dx, dz] = directions[heading];
  return (
    Math.abs(node.x / ROAD_SPACING + dx) <= BOUND && Math.abs(node.y / ROAD_SPACING + dz) <= BOUND
  );
};
function chooseExit(route: VehicleRoute) {
  const choice = (route.seed + route.trips * 7) % 5;
  const desired = (route.heading + (choice < 2 ? 1 : choice < 4 ? 3 : 0)) % 4;
  route.exit =
    [desired, route.heading, (route.heading + 1) % 4, (route.heading + 3) % 4].find((heading) =>
      validExit(route.to, heading),
    ) ?? (route.heading + 2) % 4;
  route.turn =
    route.exit === route.heading
      ? "straight"
      : route.exit === (route.heading + 1) % 4
        ? "right"
        : "left";
}
function setStreet(route: VehicleRoute) {
  route.curve = new THREE.LineCurve3(
    point(route.from, route.heading, CORNER),
    point(route.to, route.heading, -CORNER),
  );
  route.length = route.curve.getLength();
  route.phase = "street";
  route.committed = false;
  route.reserved = false;
  chooseExit(route);
  route.nextCurve = junctionCurve(route);
  route.nextLength = route.nextCurve.getLength();
}
function junctionCurve(route: VehicleRoute) {
  const start = point(route.to, route.heading, -CORNER),
    end = point(route.to, route.exit, CORNER);
  if (route.exit === route.heading) return new THREE.LineCurve3(start, end);
  const [dx, dz] = directions[route.heading],
    [ex, ez] = directions[route.exit];
  const radius = Math.max(Math.abs(end.x - start.x), Math.abs(end.z - start.z));
  const k = radius * 0.55228475;
  return new THREE.CubicBezierCurve3(
    start,
    start.clone().add(new THREE.Vector3(dx * k, 0, dz * k)),
    end.clone().sub(new THREE.Vector3(ex * k, 0, ez * k)),
    end,
  );
}
export function createVehicleRoute(index: number): VehicleRoute {
  let heading = index % 4;
  let to = new THREE.Vector2(0, 0);
  if (index >= 16) {
    const slot = index - 16;
    const nodes = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];
    to = new THREE.Vector2(nodes[slot % 8][0] * ROAD_SPACING, nodes[slot % 8][1] * ROAD_SPACING);
    heading = (slot + Math.floor(slot / 8)) % 4;
  }
  // The additional traffic starts on outer approaches, never on an occupied slot.
  if (index >= 48) {
    const outer = [
        [-2, -1],
        [-1, -2],
        [1, -2],
        [2, -1],
        [2, 1],
        [1, 2],
        [-1, 2],
        [-2, 1],
      ],
      slot = index - 48;
    to = new THREE.Vector2(outer[slot % 8][0] * ROAD_SPACING, outer[slot % 8][1] * ROAD_SPACING);
    heading =
      outer[slot % 8][0] === -2
        ? 2
        : outer[slot % 8][0] === 2
          ? 0
          : outer[slot % 8][1] === -2
            ? 3
            : 1;
  }
  const [dx, dz] = directions[heading];
  const route: VehicleRoute = {
    from: to.clone().sub(new THREE.Vector2(dx * ROAD_SPACING, dz * ROAD_SPACING)),
    to,
    heading,
    exit: heading,
    phase: "street",
    curve: new THREE.LineCurve3(),
    length: 48,
    progress: index < 16 ? 38 - Math.floor(index / 4) * 10 : 4 + ((index * 13) % 38),
    seed: index * 13 + 1,
    trips: 0,
    turn: "straight",
  };
  setStreet(route);
  return route;
}
export const junctionKey = (node: THREE.Vector2) => `${node.x}/${node.y}`;
export function routePosition(
  route: VehicleRoute,
  distance = route.progress,
  target = new THREE.Vector3(),
) {
  return route.curve.getPointAt(THREE.MathUtils.clamp(distance / route.length, 0, 1), target);
}
export function routeTangent(
  route: VehicleRoute,
  distance = route.progress,
  target = new THREE.Vector3(),
) {
  return route.curve.getTangentAt(THREE.MathUtils.clamp(distance / route.length, 0, 1), target);
}
export function advanceRoute(route: VehicleRoute, distance: number) {
  route.progress += distance;
  while (route.progress >= route.length) {
    route.progress -= route.length;
    if (route.phase === "street") {
      route.curve = route.nextCurve!;
      route.length = route.curve.getLength();
      route.phase = "junction";
    } else {
      route.from.copy(route.to);
      route.heading = route.exit;
      const [dx, dz] = directions[route.heading];
      route.to.add(new THREE.Vector2(dx * ROAD_SPACING, dz * ROAD_SPACING));
      route.trips++;
      setStreet(route);
    }
  }
}
// A continuous look-ahead polyline across the next curve, used by Control & SLAM.
export function previewRoute(route: VehicleRoute, ahead: number, target: THREE.Vector3) {
  const remaining = route.length - route.progress;
  if (ahead <= remaining) return routePosition(route, route.progress + ahead, target);
  if (route.phase === "street") {
    const curve = route.nextCurve!;
    return curve.getPointAt(Math.min(1, (ahead - remaining) / route.nextLength!), target);
  }
  const [dx, dz] = directions[route.exit];
  return routePosition(route, route.length, target).add(
    new THREE.Vector3(dx, 0, dz).multiplyScalar(ahead - remaining),
  );
}
