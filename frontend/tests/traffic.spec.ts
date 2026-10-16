import { test, expect } from "@playwright/test";
import { createCity } from "../components/spatial/world";
import { createMaterialFactory, createScanUniforms } from "../components/spatial/materials";
import { updateTraffic } from "../components/spatial/traffic";
import { createCityCarPlay } from "../components/spatial/city-car-play";
import { routePosition } from "../components/spatial/routes";

test("traffic turns, stays on roads and accelerates smoothly through several signal cycles", () => {
  const uniforms = createScanUniforms(),
    materials = createMaterialFactory(uniforms);
  const city = createCity(materials, true, uniforms);
  const vehicles = city.actors.filter((actor) => actor.category === "vehicle");
  let turns = 0,
    braking = 0,
    peakSteering = 0,
    maxRoadDistance = 0,
    minAcceleration = 0,
    maxAcceleration = 0;
  try {
    for (let frame = 0; frame < 90 * 60; frame++) {
      updateTraffic(city.actors, frame / 60, 1 / 60);
      for (const actor of vehicles) {
        const { x, z } = actor.object.position;
        const distanceToRoad = Math.min(
          Math.abs(x - Math.round(x / 66) * 66),
          Math.abs(z - Math.round(z / 66) * 66),
        );
        maxRoadDistance = Math.max(maxRoadDistance, distanceToRoad);
        if (frame > 180) {
          minAcceleration = Math.min(minAcceleration, actor.acceleration);
          maxAcceleration = Math.max(maxAcceleration, actor.acceleration);
        }
        if (actor.route?.phase === "junction" && actor.route.turn !== "straight") turns++;
        if (actor.acceleration < -0.5) braking++;
        peakSteering = Math.max(peakSteering, Math.abs(actor.steering));
      }
    }
    expect(maxRoadDistance).toBeLessThan(7.1);
    expect(minAcceleration).toBeGreaterThan(-4);
    expect(maxAcceleration).toBeLessThan(2.5);
    expect(turns).toBeGreaterThan(100);
    expect(braking).toBeGreaterThan(100);
    expect(peakSteering).toBeGreaterThan(0.2);
    expect(peakSteering).toBeLessThan(0.66);
    expect(vehicles.reduce((sum, actor) => sum + actor.route!.trips, 0)).toBeGreaterThan(40);
  } finally {
    city.dispose();
    materials.dispose();
  }
});

test("Milo borrows the same car, reserves a road landing, and safely releases interrupted play", () => {
  const uniforms = createScanUniforms(),
    materials = createMaterialFactory(uniforms);
  const city = createCity(materials, true, uniforms);
  const play = createCityCarPlay(city.actors);
  try {
    updateTraffic(city.actors, 0, 1 / 60);
    let plan = city.actors.map((actor) => play.borrow(actor.object.position)).find(Boolean);
    for (let frame = 1; !plan && frame < 30 * 60; frame++) {
      updateTraffic(city.actors, frame / 60, 1 / 60);
      if (frame % 30 === 0)
        plan = city.actors.map((actor) => play.borrow(actor.object.position)).find(Boolean);
    }
    if (!plan) throw new Error("No slow vehicle has a safe landing during a signal cycle");
    expect(plan).toBeTruthy();
    const actor = city.actors.find((actor) => actor.id === plan.id)!;
    const mesh = actor.object,
      route = actor.route!;
    const startProgress = route.progress;
    const midpoint = { x: (plan.from.x + plan.to.x) / 2, y: 4, z: (plan.from.z + plan.to.z) / 2 };
    play.move(plan.id, midpoint, 0.5);
    for (let i = 0; i < 60; i++) updateTraffic(city.actors, i / 60, 1 / 60);
    expect(actor.object.position.y).toBe(4);
    expect(route.progress).toBe(startProgress);
    expect(actor.companionDrop!.y).toBeCloseTo(0.14);
    expect(play.borrow(plan.to)).toBeNull();
    play.release(plan.id, true);
    expect(actor.object).toBe(mesh);
    expect(actor.route).toBe(route);
    expect(actor.object.position.distanceTo(routePosition(route))).toBeLessThan(0.001);
    expect(
      Math.hypot(
        actor.object.position.x - plan.to.x,
        actor.object.position.y - plan.to.y,
        actor.object.position.z - plan.to.z,
      ),
    ).toBeLessThan(0.001);
    expect(actor.companionHeld).toBe(false);
    expect(actor.speed).toBe(0);
    expect(Math.abs(route.progress - startProgress)).toBeGreaterThan(10);
    const interrupted = city.actors.map((item) => play.borrow(item.object.position)).find(Boolean)!;
    expect(interrupted).toBeTruthy();
    const held = city.actors.find((item) => item.id === interrupted.id)!;
    play.move(held.id, { ...interrupted.from, y: 6 }, 0.2);
    play.release(held.id, false);
    expect(play.state).toBe("settling");
    play.update(0.35);
    expect(held.object.position.y).toBeGreaterThan(0.14);
    expect(held.object.position.y).toBeLessThan(6);
    play.update(0.35);
    expect(play.state).toBe("idle");
    expect(held.object.position.distanceTo(routePosition(held.route!))).toBeLessThan(0.001);
    expect(held.companionDrop).toBeUndefined();
    for (let i = 0; i < 60; i++) updateTraffic(city.actors, i / 60, 1 / 60);
    expect(held.acceleration).toBeLessThan(2.5);
  } finally {
    city.dispose();
    materials.dispose();
  }
});
