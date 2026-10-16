import type { CityCarPlay } from "./city-bridge";

// Small and Three-free: the companion follows the exact route sampled by traffic.
export function sampleCarryPath(plan: CityCarPlay, progress: number) {
  const distance = Math.max(0, Math.min(1, progress)) * plan.length;
  let low = 0,
    high = plan.path.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (plan.path[mid].distance <= distance) low = mid;
    else high = mid;
  }
  const a = plan.path[low],
    b = plan.path[high];
  const t = Math.max(
    0,
    Math.min(1, (distance - a.distance) / Math.max(0.0001, b.distance - a.distance)),
  );
  return {
    point: {
      x: a.point.x + (b.point.x - a.point.x) * t,
      y: 0.4,
      z: a.point.z + (b.point.z - a.point.z) * t,
    },
    heading:
      a.heading + Math.atan2(Math.sin(b.heading - a.heading), Math.cos(b.heading - a.heading)) * t,
  };
}
export function sampleMiloCarry(plan: CityCarPlay, progress: number) {
  const sample = sampleCarryPath(plan, progress);
  return {
    point: {
      x: sample.point.x - Math.cos(sample.heading) * 6.93,
      y: 0.4,
      z: sample.point.z + Math.sin(sample.heading) * 6.93,
    },
    heading: sample.heading,
  };
}
