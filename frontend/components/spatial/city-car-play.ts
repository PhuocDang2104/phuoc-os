import * as THREE from "three";
import type { CityCarPlay, CityPoint } from "./city-bridge";
import { routePosition, routeTangent } from "./routes";
import type { TrafficActor } from "./traffic";

// A short lease keeps the same actor, mesh and route alive during Milo's detour.
// Traffic reserves the landing position; interrupted play settles onto a valid lane.
export function createCityCarPlay(actors: TrafficActor[]) {
  let lease: {
    actor: TrafficActor;
    plan: CityCarPlay;
    originalProgress: number;
    targetProgress: number;
    recovery?: { from: THREE.Vector3; elapsed: number; completed: boolean };
  } | null = null;
  function finish(completed: boolean) {
    if (!lease) return;
    const { actor, originalProgress, targetProgress } = lease;
    actor.route!.progress = completed ? targetProgress : originalProgress;
    actor.route!.committed = false;
    actor.route!.reserved = false;
    routePosition(actor.route!, undefined, actor.object.position);
    actor.object.rotation.z = 0;
    actor.box.position.copy(actor.object.position);
    actor.box.rotation.copy(actor.object.rotation);
    actor.companionHeld = false;
    actor.companionDrop = undefined;
    actor.speed = actor.acceleration = actor.steering = 0;
    actor.status = "waiting";
    lease = null;
  }
  return {
    borrow(near: CityPoint): CityCarPlay | null {
      if (lease) return null;
      const candidates = actors
        .filter(
          (actor) =>
            actor.category === "vehicle" &&
            actor.subtype !== "bus" &&
            actor.route?.phase === "street" &&
            actor.speed < 4 &&
            Math.abs(actor.object.position.x) < 58 &&
            Math.abs(actor.object.position.z) < 58,
        )
        .sort(
          (a, b) =>
            Math.hypot(a.object.position.x - near.x, a.object.position.z - near.z) -
            Math.hypot(b.object.position.x - near.x, b.object.position.z - near.z),
        );
      for (const actor of candidates) {
        if (Math.hypot(actor.object.position.x - near.x, actor.object.position.z - near.z) > 32)
          continue;
        const route = actor.route!;
        for (const displacement of [14, -14, 11, -11]) {
          const progress = route.progress + displacement;
          if (progress < 6 || progress > route.length - 6) continue;
          const destination = routePosition(route, progress);
          const free = actors.every(
            (other) =>
              other === actor ||
              Math.hypot(
                other.object.position.x - destination.x,
                other.object.position.z - destination.z,
              ) >
                (actor.dimensions.z + other.dimensions.z) * 0.5 + 5,
          );
          if (!free) continue;
          const tangent = routeTangent(route);
          const plan = {
            id: actor.id,
            from: {
              x: actor.object.position.x,
              y: actor.object.position.y,
              z: actor.object.position.z,
            },
            to: { x: destination.x, y: destination.y, z: destination.z },
            heading: Math.atan2(
              -tangent.z * Math.sign(displacement),
              tangent.x * Math.sign(displacement),
            ),
          };
          lease = { actor, plan, originalProgress: route.progress, targetProgress: progress };
          actor.companionHeld = true;
          actor.companionDrop = destination;
          actor.speed = actor.acceleration = actor.steering = 0;
          actor.status = "Milo's parking assistant";
          return plan;
        }
      }
      return null;
    },
    move(id: string, point: CityPoint, progress: number) {
      if (!lease || lease.actor.id !== id || lease.recovery) return;
      lease.actor.object.position.set(point.x, point.y, point.z);
      lease.actor.object.rotation.z = Math.sin(Math.PI * progress) * 0.035;
      lease.actor.box.position.copy(lease.actor.object.position);
      lease.actor.box.rotation.copy(lease.actor.object.rotation);
    },
    release(id: string, completed: boolean) {
      if (!lease || lease.actor.id !== id || lease.recovery) return;
      if (completed) finish(true);
      else {
        const current = lease.actor.object.position;
        const distance = (point: CityPoint) => Math.hypot(current.x - point.x, current.z - point.z);
        const settleAtDestination = distance(lease.plan.to) < distance(lease.plan.from);
        lease.actor.companionDrop = new THREE.Vector3().copy(
          settleAtDestination ? lease.plan.to : lease.plan.from,
        );
        lease.recovery = { from: current.clone(), elapsed: 0, completed: settleAtDestination };
      }
    },
    update(delta: number) {
      if (!lease?.recovery) return;
      const recovery = lease.recovery;
      recovery.elapsed += delta;
      const p = Math.min(1, recovery.elapsed / 0.7),
        t = p * p * (3 - 2 * p);
      lease.actor.object.position.lerpVectors(recovery.from, lease.actor.companionDrop!, t);
      lease.actor.object.rotation.z *= 1 - t;
      lease.actor.box.position.copy(lease.actor.object.position);
      lease.actor.box.rotation.copy(lease.actor.object.rotation);
      if (p === 1) finish(recovery.completed);
    },
    get state() {
      return !lease ? "idle" : lease.recovery ? "settling" : "playing";
    },
    get actorId() {
      return lease?.actor.id ?? "";
    },
  };
}
