import * as THREE from "three";
import { type ActorSnapshot } from "./config";
import {
  advanceRoute,
  createVehicleRoute,
  junctionKey,
  previewRoute,
  routePosition,
  routeTangent,
  type VehicleRoute,
} from "./routes";

export type TrafficActor = {
  id: string;
  category: "vehicle" | "pedestrian";
  subtype: string;
  object: THREE.Group;
  box: THREE.LineSegments;
  pickMeshes: THREE.Mesh[];
  dimensions: THREE.Vector3;
  axis: "x" | "z";
  direction: number;
  lane: number;
  distance: number;
  baseSpeed: number;
  speed: number;
  status: string;
  signal: string;
  crossing: boolean;
  acceleration: number;
  steering: number;
  route?: VehicleRoute;
  companionHeld?: boolean;
  companionDrop?: THREE.Vector3;
};

export function updateTraffic(actors: TrafficActor[], time: number, delta: number) {
  const phase = time % 24;
  const greenX = phase < 10,
    greenZ = phase >= 12 && phase < 22;
  const vehicles = actors.filter((actor) => actor.category === "vehicle");
  const reserved = new Map<string, string>();
  for (const actor of vehicles) {
    if (actor.companionHeld) continue;
    if (!actor.route) {
      actor.route = createVehicleRoute(+actor.id.slice(4) - 1);
      routePosition(actor.route, undefined, actor.object.position);
    }
    const route = actor.route;
    if (
      route.phase === "street" &&
      !(route.heading % 2 === 0 ? greenX : greenZ) &&
      !route.committed
    )
      route.reserved = false;
    if (route.phase === "junction") reserved.set(junctionKey(route.to), actor.id);
    else if (route.reserved) reserved.set(junctionKey(route.to), actor.id);
    else if (route.progress < actor.dimensions.z * 0.5 + 2)
      reserved.set(junctionKey(route.from), actor.id);
  }
  // Claim a junction while still far enough away for the other approaches to brake.
  for (const actor of [...vehicles].sort(
    (a, b) => a.route!.length - a.route!.progress - (b.route!.length - b.route!.progress),
  )) {
    if (actor.companionHeld) continue;
    const route = actor.route!,
      remaining = route.length - route.progress;
    const green = route.heading % 2 === 0 ? greenX : greenZ;
    const amber = route.heading % 2 === 0 ? phase >= 10 && phase < 12 : phase >= 22;
    const stop = remaining - actor.dimensions.z * 0.5 - 3.2;
    if (
      route.phase === "street" &&
      (green || amber) &&
      stop < (actor.speed * actor.speed) / (2 * 3.1) + 1
    )
      route.committed = true;
    if (
      route.phase === "street" &&
      remaining < 21 &&
      (green || route.committed) &&
      !reserved.has(junctionKey(route.to))
    ) {
      reserved.set(junctionKey(route.to), actor.id);
      route.reserved = true;
    }
  }
  const tangent = new THREE.Vector3(),
    ahead = new THREE.Vector3(),
    future = new THREE.Vector3();
  for (const actor of vehicles) {
    if (actor.companionHeld) continue;
    const route = actor.route!;
    routeTangent(route, undefined, tangent);
    const axisGreen = route.heading % 2 === 0 ? greenX : greenZ;
    const yellow = route.heading % 2 === 0 ? phase >= 10 && phase < 12 : phase >= 22;
    const variation =
      0.82 +
      0.12 * Math.sin(time * 0.23 + route.seed) +
      0.06 * Math.sin(time * 0.61 + route.seed * 2);
    let target = actor.baseSpeed * variation,
      clearance = Infinity,
      physicalClearance = Infinity;
    // Forecast hazards affect the braking target. Only a present physical obstacle
    // may cap displacement, so a changing prediction cannot cause an instant stop.
    const remaining = route.length - route.progress;
    const occupied = reserved.get(junctionKey(route.to));
    if (
      route.phase === "street" &&
      ((!axisGreen && !route.committed) || (occupied && occupied !== actor.id))
    )
      clearance = Math.max(0, remaining - actor.dimensions.z * 0.5 - 3.2);
    if (route.phase === "junction" || remaining < 12)
      target = Math.min(target, route.turn === "straight" ? 6 : 3.6);
    for (const other of actors) {
      if (other === actor) continue;
      if (other.companionDrop) {
        const dx = other.companionDrop.x - actor.object.position.x,
          dz = other.companionDrop.z - actor.object.position.z,
          forward = dx * tangent.x + dz * tangent.z,
          lateral = Math.abs(dx * tangent.z - dz * tangent.x);
        if (forward > 0 && lateral < (actor.dimensions.x + other.dimensions.x) * 0.5) {
          const gap = Math.max(0, forward - (actor.dimensions.z + other.dimensions.z) * 0.5 - 2);
          clearance = Math.min(clearance, gap);
          physicalClearance = Math.min(physicalClearance, gap);
        }
      }
      if (other.category === "pedestrian" && !other.crossing) continue;
      if (other.category === "pedestrian") {
        if (other.object.position.distanceToSquared(actor.object.position) > 35 * 35) continue;
        const dx = other.object.position.x - actor.object.position.x,
          dz = other.object.position.z - actor.object.position.z;
        const forward = dx * tangent.x + dz * tangent.z,
          lateral = Math.abs(dx * tangent.z - dz * tangent.x);
        if (forward > 0 && lateral < actor.dimensions.x * 0.5 + 0.25)
          physicalClearance = Math.min(
            physicalClearance,
            Math.max(0, forward - actor.dimensions.z * 0.5 - 0.45),
          );
        previewRoute(route, 0, ahead);
        let obstacle = Infinity;
        for (let distance = 1.25; distance <= 25; distance += 1.25) {
          previewRoute(route, distance, future);
          const arrival = Math.min(2.5, distance / Math.max(actor.speed, 2));
          const vx = future.x - ahead.x,
            vz = future.z - ahead.z;
          const length2 = vx * vx + vz * vz;
          if (length2 > 0.0001) {
            for (const prediction of [0, arrival]) {
              const px =
                other.object.position.x +
                Math.sin(other.object.rotation.y) * other.speed * prediction;
              const pz =
                other.object.position.z +
                Math.cos(other.object.rotation.y) * other.speed * prediction;
              const projection = ((px - ahead.x) * vx + (pz - ahead.z) * vz) / length2;
              const closest = THREE.MathUtils.clamp(projection, 0, 1);
              const separation2 =
                (ahead.x + closest * vx - px) ** 2 + (ahead.z + closest * vz - pz) ** 2;
              if (separation2 < 6.25) {
                const entry = Math.max(0, projection - Math.sqrt((6.25 - separation2) / length2));
                obstacle = Math.min(obstacle, distance - 1.25 + Math.min(1, entry) * 1.25);
              }
            }
          }
          ahead.copy(future);
        }
        clearance = Math.min(clearance, Math.max(0, obstacle - actor.dimensions.z * 0.5 - 2));
        continue;
      }
      if (
        other.category === "vehicle" &&
        Math.cos(other.object.rotation.y - Math.atan2(tangent.x, tangent.z)) < 0.7
      )
        continue;
      const dx = other.object.position.x - actor.object.position.x,
        dz = other.object.position.z - actor.object.position.z;
      const forward = dx * tangent.x + dz * tangent.z;
      const lateral = Math.abs(dx * tangent.z - dz * tangent.x);
      if (forward > 0 && lateral < (actor.dimensions.x + other.dimensions.x) * 0.43) {
        clearance = Math.min(
          clearance,
          Math.max(0, forward - (actor.dimensions.z + other.dimensions.z) * 0.5 - 1.8),
        );
        physicalClearance = Math.min(
          physicalClearance,
          Math.max(0, forward - (actor.dimensions.z + other.dimensions.z) * 0.5 - 0.3),
        );
      }
    }
    target = Math.min(target, Math.sqrt(Math.max(0, 2 * 2.7 * clearance)));
    const oldSpeed = actor.speed;
    const dt = Math.max(0.001, delta);
    const acceleration = target > oldSpeed ? 1.3 + (route.seed % 7) * 0.14 : -3.1;
    let speed = THREE.MathUtils.clamp(
      target,
      Math.max(0, oldSpeed + Math.min(0, acceleration) * dt),
      oldSpeed + Math.max(0, acceleration) * dt,
    );
    let movement = Math.min(speed * delta, physicalClearance);
    if (route.phase === "street" && movement >= remaining) {
      if (!occupied || occupied === actor.id) reserved.set(junctionKey(route.to), actor.id);
      else movement = Math.max(0, Math.min(movement, remaining - actor.dimensions.z * 0.5 - 3.2));
    }
    advanceRoute(route, movement);
    speed = delta > 0 ? movement / delta : oldSpeed;
    actor.speed = speed;
    actor.acceleration = (speed - oldSpeed) / dt;
    routePosition(route, undefined, actor.object.position);
    routeTangent(route, undefined, tangent);
    routeTangent(route, Math.min(route.length, route.progress + 0.3), ahead);
    const yaw = Math.atan2(tangent.x, tangent.z),
      nextYaw = Math.atan2(ahead.x, ahead.z);
    const yawDelta = Math.atan2(Math.sin(nextYaw - yaw), Math.cos(nextYaw - yaw));
    actor.steering = THREE.MathUtils.clamp(
      Math.atan((actor.dimensions.z * 0.6 * yawDelta) / 0.3),
      -0.65,
      0.65,
    );
    actor.object.rotation.y = yaw;
    actor.axis = Math.abs(tangent.x) > Math.abs(tangent.z) ? "x" : "z";
    actor.direction = (actor.axis === "x" ? tangent.x : tangent.z) >= 0 ? 1 : -1;
    actor.distance += movement;
    actor.status =
      speed < 0.12
        ? "waiting"
        : route.phase === "junction" && route.turn !== "straight"
          ? `turning ${route.turn}`
          : "moving";
    actor.signal = axisGreen ? "green" : yellow ? "amber" : "red";
  }
  actors
    .filter((actor) => actor.category === "pedestrian")
    .forEach((actor, index) => {
      actor.speed = actor.baseSpeed;
      if (actor.crossing) {
        const walk = actor.axis === "x" ? greenX : greenZ;
        actor.signal = walk ? "walk" : "wait";
        if (!walk && actor.distance < 2) actor.speed = 0;
        actor.distance = (actor.distance + actor.speed * delta) % 26;
        const t = (actor.distance - 13) * actor.direction;
        if (actor.axis === "x") actor.object.position.set(t, 0.18, actor.lane % 2 ? 9 : -9);
        else actor.object.position.set(actor.lane % 2 ? 9 : -9, 0.18, t);
        actor.object.rotation.y =
          actor.axis === "x"
            ? (actor.direction * Math.PI) / 2
            : actor.direction === 1
              ? 0
              : Math.PI;
        actor.status = actor.speed === 0 ? "waiting" : Math.abs(t) < 8 ? "crossing" : "walking";
      } else {
        const sx = index % 2 ? 1 : -1,
          sz = Math.floor(index / 2) % 2 ? 1 : -1;
        const points = [
          [sx * 10, sz * 10],
          [sx * 60, sz * 10],
          [sx * 60, sz * 53],
          [sx * 10, sz * 53],
        ];
        actor.distance = (actor.distance + actor.speed * delta) % 186;
        let d = actor.distance;
        for (let segment = 0; segment < 4; segment++) {
          const a = points[segment],
            b = points[(segment + 1) % 4],
            length = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (d <= length) {
            actor.object.position.set(
              a[0] + ((b[0] - a[0]) * d) / length,
              0.18,
              a[1] + ((b[1] - a[1]) * d) / length,
            );
            actor.object.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
            break;
          }
          d -= length;
        }
        actor.status = "walking";
        actor.signal = "sidewalk";
      }
      actor.box.position.copy(actor.object.position);
      actor.box.rotation.copy(actor.object.rotation);
    });
  actors
    .filter((actor) => actor.category === "vehicle")
    .forEach((actor) => {
      actor.box.position.copy(actor.object.position);
      actor.box.rotation.copy(actor.object.rotation);
    });
}

export function snapshotActor(actor: TrafficActor, actors: TrafficActor[]): ActorSnapshot {
  let nearest = Infinity;
  for (const other of actors)
    if (other !== actor)
      nearest = Math.min(nearest, actor.object.position.distanceTo(other.object.position));
  return {
    id: actor.id,
    category: actor.category,
    subtype: actor.subtype,
    status: actor.status,
    speed: +(actor.speed * 3.6).toFixed(1),
    acceleration: +actor.acceleration.toFixed(2),
    steering: +THREE.MathUtils.radToDeg(actor.steering).toFixed(1),
    turn: actor.route?.turn ?? "walking",
    heading: Math.round(((((actor.object.rotation.y * 180) / Math.PI) % 360) + 360) % 360),
    lane:
      actor.category === "vehicle"
        ? `${actor.route?.phase.toUpperCase()} / ${actor.route?.turn.toUpperCase()}`
        : actor.crossing
          ? "Zebra crossing"
          : "Sidewalk",
    signal: actor.signal,
    nearest: +nearest.toFixed(1),
    range: +actor.object.position.length().toFixed(1),
  };
}
