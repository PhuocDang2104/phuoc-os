import * as THREE from "three";
import type { CityCarPlay, CityCarryPhase, CityPoint } from "./city-bridge";
import {
  advanceRoute,
  cloneVehicleRoute,
  routePosition,
  routeTangent,
  setVehicleTurn,
  type VehicleRoute,
} from "./routes";
import type { TrafficActor } from "./traffic";

export function createCityCarPlay(actors: TrafficActor[]) {
  let lease: {
    actor: TrafficActor;
    plan: CityCarPlay;
    start: VehicleRoute;
    end: VehicleRoute;
    distance: number;
    phase: CityCarryPhase;
    dropFrom?: THREE.Vector3;
    recovery?: { from: THREE.Vector3; yaw: number; elapsed: number; route: VehicleRoute };
  } | null = null;
  const smooth = (p: number) => {
    const t = THREE.MathUtils.clamp(p, 0, 1);
    return t * t * (3 - 2 * t);
  };
  function atDistance(distance: number) {
    const route = cloneVehicleRoute(lease!.start);
    advanceRoute(route, distance);
    return route;
  }
  function syncBox(actor: TrafficActor) {
    actor.box.position.copy(actor.object.position);
    actor.box.rotation.copy(actor.object.rotation);
  }
  function finish(route: VehicleRoute) {
    if (!lease) return;
    const actor = lease.actor;
    Object.assign(actor.route!, cloneVehicleRoute(route));
    routePosition(actor.route!, undefined, actor.object.position);
    const tangent = routeTangent(actor.route!);
    actor.object.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0);
    actor.companionHeld = false;
    actor.companionDrop = undefined;
    actor.speed = actor.acceleration = actor.steering = 0;
    actor.status = "waiting";
    syncBox(actor);
    lease = null;
  }
  return {
    borrow(near: CityPoint): CityCarPlay | null {
      if (lease) return null;
      const candidates = actors
        .filter(
          (a) =>
            a.category === "vehicle" &&
            a.subtype !== "bus" &&
            a.route?.phase === "street" &&
            a.speed < 4 &&
            Math.hypot(a.object.position.x - near.x, a.object.position.z - near.z) < 32,
        )
        .sort(
          (a, b) =>
            Math.hypot(a.object.position.x - near.x, a.object.position.z - near.z) -
            Math.hypot(b.object.position.x - near.x, b.object.position.z - near.z),
        );
      for (const actor of candidates)
        for (const turn of [1, 3])
          for (const exitDistance of [22, 30, 16]) {
            const start = cloneVehicleRoute(actor.route!);
            if (!setVehicleTurn(start, (start.heading + turn) % 4)) continue;
            const length = start.length - start.progress + start.nextLength! + exitDistance;
            const cursor = cloneVehicleRoute(start),
              path: CityCarPlay["path"] = [];
            const segments = Math.ceil(length / 0.6);
            let previous = 0,
              inside = true;
            for (let i = 0; i <= segments; i++) {
              const distance = (length * i) / segments;
              advanceRoute(cursor, distance - previous);
              previous = distance;
              const point = routePosition(cursor),
                tangent = routeTangent(cursor);
              if (Math.abs(point.x) > 62 || Math.abs(point.z) > 62) {
                inside = false;
                break;
              }
              path.push({
                point: { x: point.x, y: point.y, z: point.z },
                heading: Math.atan2(-tangent.z, tangent.x),
                distance,
              });
            }
            if (!inside) continue;
            const destination = routePosition(cursor);
            if (
              !actors.every(
                (other) =>
                  other === actor ||
                  Math.hypot(
                    other.object.position.x - destination.x,
                    other.object.position.z - destination.z,
                  ) >
                    (actor.dimensions.z + other.dimensions.z) * 0.5 + 3.5,
              )
            )
              continue;
            const plan = {
              id: actor.id,
              from: { ...path[0].point },
              to: { x: destination.x, y: destination.y, z: destination.z },
              heading: path[0].heading,
              path,
              length,
              duration: (length / 3.8) * 1000,
              roofHeight:
                new THREE.Box3().setFromObject(actor.object).max.y - actor.object.position.y,
            };
            lease = {
              actor,
              plan,
              start,
              end: cloneVehicleRoute(cursor),
              distance: 0,
              phase: "grab",
            };
            actor.companionHeld = true;
            actor.companionDrop = destination;
            actor.speed = actor.acceleration = actor.steering = 0;
            actor.status = "Milo is picking up this car";
            return plan;
          }
      return null;
    },
    hold(id: string, grip: CityPoint, heading: number, phase: CityCarryPhase, progress: number) {
      if (!lease || lease.actor.id !== id || lease.recovery) return;
      lease.phase = phase;
      if (phase === "grab" && progress < 0.58) return;
      const actor = lease.actor;
      const position = new THREE.Vector3(
        grip.x,
        Math.max(0.14, grip.y - lease.plan.roofHeight),
        grip.z,
      );
      if (phase === "grab")
        position.lerpVectors(lease.plan.from, position, smooth((progress - 0.58) / 0.12));
      let yaw = heading + Math.PI / 2;
      if (phase === "walk") lease.distance = lease.plan.length * smooth(progress);
      if (phase === "drop") {
        lease.distance = lease.plan.length;
        const release = smooth((progress - 0.7) / 0.3),
          targetYaw = lease.plan.path.at(-1)!.heading + Math.PI / 2;
        if (progress >= 0.7 && !lease.dropFrom) lease.dropFrom = position.clone();
        if (lease.dropFrom) position.lerpVectors(lease.dropFrom, lease.plan.to, release);
        yaw += Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw)) * release;
      }
      actor.object.position.copy(position);
      actor.object.rotation.set(0, yaw, 0);
      actor.status =
        phase === "walk"
          ? "carried in Milo's mouth"
          : phase === "drop"
            ? "Milo is setting this car down"
            : "Milo is picking up this car";
      syncBox(actor);
    },
    release(id: string, completed: boolean) {
      if (!lease || lease.actor.id !== id || lease.recovery) return;
      if (completed) finish(lease.end);
      else {
        const route = atDistance(lease.distance);
        lease.actor.companionDrop = routePosition(route);
        lease.recovery = {
          from: lease.actor.object.position.clone(),
          yaw: lease.actor.object.rotation.y,
          elapsed: 0,
          route,
        };
      }
    },
    update(delta: number) {
      if (!lease?.recovery) return;
      const recovery = lease.recovery;
      recovery.elapsed += delta;
      const p = Math.min(1, recovery.elapsed / 0.8),
        t = smooth(p);
      lease.actor.object.position.lerpVectors(recovery.from, lease.actor.companionDrop!, t);
      const tangent = routeTangent(recovery.route),
        yaw = Math.atan2(tangent.x, tangent.z);
      lease.actor.object.rotation.y =
        recovery.yaw + Math.atan2(Math.sin(yaw - recovery.yaw), Math.cos(yaw - recovery.yaw)) * t;
      syncBox(lease.actor);
      if (p === 1) finish(recovery.route);
    },
    get state() {
      return !lease
        ? "idle"
        : lease.recovery
          ? "settling"
          : lease.phase === "grab"
            ? "biting"
            : lease.phase === "walk"
              ? "carrying"
              : "lowering";
    },
    get actorId() {
      return lease?.actor.id ?? "";
    },
  };
}
