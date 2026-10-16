"use client";

import { useEffect, useRef, useState } from "react";
import type { CatAction } from "./cat-art";
import {
  getCityBridge,
  type CityAnchor,
  type CityPoint,
  type CityCarPlay,
} from "../spatial/city-bridge";

export function useCatMotion({
  reducedMotion,
  paused,
  context,
}: {
  reducedMotion: boolean;
  paused: boolean;
  context: string;
}) {
  const body = useRef<HTMLDivElement>(null);
  const position = useRef({ x: -1, y: -1 });
  const cityPosition = useRef<CityPoint | null>(null);
  const lastCityHeading = useRef(0);
  const [action, setAction] = useState<CatAction>("sit");
  const [speech, setSpeech] = useState("");

  useEffect(() => {
    const element = body.current!;
    let frame = 0,
      previous = 0,
      clock = 0,
      lastSpeech = -9000,
      speechUntil = 0;
    let current: CatAction = "sit",
      facing = 1,
      angle = 0,
      cycle = 0,
      clicks = 0;
    let active = true,
      near = false,
      dragging = false;
    let dragOrigin = { x: 0, y: 0 };
    let firstFrame = true;
    let size = { w: 136, h: 98, top: 40, floor: 600, maxX: 1000 };
    let journey: {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      start: number;
      duration: number;
      arc: number;
      fromAngle: number;
      angle: number;
      next?: () => void;
    } | null = null;
    let nextAt = 1500;
    let nextPlatformAt = 10000 + Math.random() * 5000;
    let nextCityAt = 3200;
    let exitMorph: {
      start: number;
      duration: number;
      point: CityPoint;
      heading: number;
      realStart?: number;
    } | null = null;
    let cityHeading = lastCityHeading.current;
    let carPlay: { plan: CityCarPlay; phase: "pounce" | "carry" } | null = null;
    let triedCar = false;
    let city: {
      point: CityPoint;
      target: CityAnchor;
      from: CityPoint;
      start: number;
      duration: number;
      arc: number;
      steps: number;
      waitUntil: number;
      entry: { x: number; y: number } | null;
      climb?: { wall: CityPoint; landing: CityPoint };
      streetWalked?: boolean;
      petAfterLanding?: boolean;
    } | null = null;
    const hints: Partial<Record<CatAction, string[]>> = {
      walk: [
        "Just checking on the workspace.",
        "A small patrol. Big responsibilities.",
        "Everything seems to be in order.",
      ],
      run: ["Important cat business.", "On my way. Probably.", "A little burst of curiosity."],
      hop: ["Oh! You found my jump button.", "Tiny paws. Excellent suspension."],
      climb: ["The view is better up here.", "Walls are just vertical floors."],
      jump: [
        "This window makes a nice perch.",
        "Landing gear: four paws.",
        "A little leap of curiosity.",
      ],
      stretch: ["A quick stretch between ideas.", "Even a cat needs a screen break."],
      lie: [
        "Okay. This is my spot now.",
        "You had me at head scratches.",
        "Purr. I'll stay a little.",
      ],
      sleep: ["Recharging the curiosity.", "Dreaming in little pixels."],
      sit: context.includes("1")
        ? ["Draw a number. I'll watch.", "Your drawings stay on your device."]
        : ["Need a shortcut? Ask me.", "The gallery is a good place to wander."],
    };
    function say(mode: CatAction, force = false) {
      if (reducedMotion || (!force && clock - lastSpeech < 10500)) return;
      const lines = hints[mode] ?? hints.sit!;
      setSpeech(lines[Math.floor(Math.random() * lines.length)]);
      speechUntil = clock + 4300;
      lastSpeech = clock;
    }
    function measure() {
      const rect = element.getBoundingClientRect();
      const gallery = document.querySelector<HTMLElement>(".work-gallery");
      size = {
        w: rect.width || 136,
        h: rect.height || 98,
        top: (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 38) + 8,
        floor:
          (gallery ? innerHeight - gallery.offsetHeight - 14 : innerHeight - 24) -
          (rect.height || 98),
        maxX: innerWidth - (rect.width || 136) - 4,
      };
      size.floor = Math.max(size.top + 60, size.floor);
    }
    const clampX = (x: number) => Math.max(4, Math.min(size.maxX, x));
    const clampY = (y: number) => Math.max(size.top - 24, Math.min(size.floor, y));
    function paint() {
      const { x, y } = position.current;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      element.style.setProperty("--milo-facing", String(facing));
      element.style.setProperty("--milo-angle", `${angle}deg`);
      element.style.visibility = "visible";
      element.dataset.speechBelow = String(y < size.top + 65);
      element.dataset.speechAlign = x < 90 ? "left" : x > innerWidth - 235 ? "right" : "center";
    }
    function cityAvailable() {
      const bridge = getCityBridge();
      return context.startsWith("/:") && bridge?.available() ? bridge : null;
    }
    function clearCity(keepModel = false) {
      cancelCarPlay();
      city = null;
      cityPosition.current = null;
      element.dataset.inCity = "false";
      element.style.width = "";
      element.style.height = "";
      element.style.opacity = "";
      if (!keepModel) {
        exitMorph = null;
        getCityBridge()?.companion(null);
        element.style.setProperty("--milo-2d-opacity", "1");
        element.dataset.dimension = "2d";
      }
      nextCityAt = clock + 8000 + Math.random() * 6000;
      measure();
    }
    function cancelCarPlay() {
      if (carPlay) getCityBridge()?.returnCar(carPlay.plan.id, false);
      carPlay = null;
      element.dataset.cityActivity = "roaming";
    }
    function cityAnchors() {
      const bridge = cityAvailable();
      if (!bridge) return [];
      return bridge.anchors().filter((anchor) => {
        const p = bridge.project(anchor.point);
        if (anchor.kind === "wall" && !bridge.project({ ...anchor.point, y: 0.4 }).visible)
          return false;
        if (
          !p.visible ||
          p.x < 90 ||
          p.x > innerWidth - 90 ||
          p.y < size.top + 120 ||
          p.y > innerHeight - 80
        )
          return false;
        const node = document.elementFromPoint(p.x, p.y - p.height * 0.4);
        return !node?.closest(
          ".app-window,.work-gallery,.app-launcher,.spatial-controls,.spatial-inspector,.milo-dialog",
        );
      });
    }
    function enterCity(anchor?: CityAnchor) {
      const candidates = cityAnchors().filter((item) => item.kind === "roof");
      const bridge = cityAvailable();
      if (!bridge || (!anchor && !candidates.length)) return false;
      const target = anchor ?? candidates[Math.floor(Math.random() * candidates.length)];
      city = {
        point: { ...target.point },
        from: { ...target.point },
        target,
        start: clock,
        duration: 1200,
        arc: 0,
        steps: 0,
        waitUntil: 0,
        entry: { ...position.current },
      };
      triedCar = false;
      journey = null;
      angle = 0;
      near = false;
      current = "jump";
      setAction("jump");
      element.dataset.inCity = "true";
      if (clock - lastSpeech > 10500) {
        setSpeech("A little rooftop research.");
        lastSpeech = clock;
        speechUntil = clock + 4300;
      }
      return true;
    }
    function cityStep() {
      if (!city) return;
      const bridge = cityAvailable();
      if (!bridge) return;
      if (carPlay?.phase === "pounce") {
        carPlay.phase = "carry";
        const { plan } = carPlay;
        city.from = { ...city.point };
        city.target = {
          id: `CARRY_${plan.id}`,
          kind: "street",
          point: {
            x: plan.to.x - Math.cos(plan.heading) * 5,
            y: 0.4,
            z: plan.to.z + Math.sin(plan.heading) * 5,
          },
        };
        city.start = clock;
        city.duration = 2100;
        city.arc = 3.6;
        city.waitUntil = 0;
        current = "jump";
        setAction(current);
        element.dataset.cityActivity = "carrying";
        return;
      }
      if (carPlay?.phase === "carry") {
        bridge.returnCar(carPlay.plan.id, true);
        carPlay = null;
        city.steps++;
        element.dataset.cityActivity = "roaming";
      }
      if (city.target.kind === "wall" && city.point.y < 1) {
        const wall = cityAvailable()
          ?.anchors()
          .find((anchor) => anchor.id === city!.target.id);
        if (wall) {
          city.from = { ...city.point };
          city.climb = { wall: { ...wall.point }, landing: { ...(wall.landing ?? wall.point) } };
          city.target = { ...wall, point: city.climb.landing };
          city.start = clock;
          city.duration = Math.max(2800, Math.min(4200, wall.point.y * 115));
          city.arc = 0;
          city.entry = null;
          city.waitUntil = 0;
          city.steps++;
          current = "climb";
          cityHeading = Math.PI;
          lastCityHeading.current = cityHeading;
          angle = 0;
          element.dataset.cityActivity = "climbing";
          setAction("climb");
          return;
        }
      }
      // Let the street visit include an actual stroll before chasing a slow car.
      if (city.target.kind === "street" && city.streetWalked && !triedCar) {
        triedCar = true;
        const plan = bridge.borrowCar(city.point);
        if (plan) {
          const projected = bridge.project(plan.from);
          const node = document.elementFromPoint(projected.x, projected.y - 25);
          if (
            projected.visible &&
            projected.x > 90 &&
            projected.x < innerWidth - 90 &&
            projected.y > size.top + 100 &&
            projected.y < innerHeight - 100 &&
            !node?.closest(
              ".app-window,.work-gallery,.app-launcher,.spatial-controls,.spatial-inspector",
            )
          ) {
            carPlay = { plan, phase: "pounce" };
            city.from = { ...city.point };
            city.target = {
              id: `POUNCE_${plan.id}`,
              kind: "street",
              point: {
                x: plan.from.x - Math.cos(plan.heading) * 5,
                y: 0.4,
                z: plan.from.z + Math.sin(plan.heading) * 5,
              },
            };
            city.start = clock;
            city.duration = 1150;
            city.arc = Math.max(5, bridge.clearance(city.from, city.target.point));
            city.waitUntil = 0;
            city.steps++;
            cityHeading = plan.heading;
            lastCityHeading.current = cityHeading;
            current = "hop";
            setAction(current);
            element.dataset.cityActivity = "pouncing";
            setSpeech("Just helping with the parking. Very carefully.");
            lastSpeech = clock;
            speechUntil = clock + 4300;
            return;
          }
          bridge.returnCar(plan.id, false);
        }
      }
      const candidates = cityAnchors()
        .filter((anchor) => anchor.id !== city!.target.id)
        .map((anchor) => ({
          anchor,
          distance: Math.hypot(anchor.point.x - city!.point.x, anchor.point.z - city!.point.z),
        }))
        .filter((item) => item.distance < 52 && item.distance > 5);
      const desired =
        (city.target.kind === "roof" && city.steps >= 1) ||
        (city.target.kind === "street" && !city.streetWalked)
          ? "street"
          : city.target.kind === "wall"
            ? "roof"
            : city.target.kind === "street"
              ? "wall"
              : "roof";
      const nearby = candidates
        .filter((item) => item.anchor.kind === desired)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
      const options = nearby.length
        ? nearby
        : candidates.sort((a, b) => a.distance - b.distance).slice(0, 5);
      if (!options.length || city.steps >= 8) {
        exitMorph = {
          start: clock,
          duration: 1100,
          point: { ...city.point },
          heading: cityHeading,
        };
        clearCity(true);
        const available = platforms();
        if (available.length) perch(available[Math.floor(Math.random() * available.length)]);
        else begin("jump", position.current.x, size.floor, 1000, 65);
        nextPlatformAt = clock + 11000;
        return;
      }
      const { anchor, distance } = options[Math.floor(Math.random() * options.length)];
      city.from = { ...city.point };
      city.climb = undefined;
      city.target =
        anchor.kind === "wall" ? { ...anchor, point: { ...anchor.point, y: 0.4 } } : anchor;
      city.start = clock;
      city.entry = null;
      city.waitUntil = 0;
      city.steps++;
      cityHeading = Math.atan2(
        -(city.target.point.z - city.from.z),
        city.target.point.x - city.from.x,
      );
      lastCityHeading.current = cityHeading;
      const clearance = getCityBridge()!.clearance(city.from, city.target.point);
      const walking =
        (anchor.kind === "street" || anchor.kind === "wall") && city.point.y < 1 && clearance < 5;
      if (walking && anchor.kind === "street") city.streetWalked = true;
      current = walking ? "walk" : "jump";
      element.dataset.cityActivity = walking ? "walking" : "leaping";
      city.duration = walking
        ? Math.max(1100, Math.min(2200, distance * 65))
        : Math.max(950, Math.min(1700, distance * 32));
      city.arc = walking ? 0 : Math.max(4, Math.min(13, distance * 0.23), clearance);
      angle = 0;
      facing = getCityBridge()!.project(anchor.point).x > position.current.x + size.w / 2 ? 1 : -1;
      setAction(current);
      if (clock - lastSpeech > 12000) {
        const lines =
          anchor.kind === "street"
            ? ["Taking the scenic route.", "Sidewalks: the original navigation mesh."]
            : anchor.kind === "wall"
              ? ["A quick vertical shortcut.", "The view is better up here."]
              : [
                  "Rooftop research, in progress.",
                  "Four paws. One well-planned trajectory.",
                  "Checking the neighborhood.",
                ];
        setSpeech(lines[Math.floor(Math.random() * lines.length)]);
        lastSpeech = clock;
        speechUntil = clock + 4300;
      }
    }
    function animateCity() {
      const bridge = cityAvailable();
      if (!city || !bridge) {
        if (city) clearCity();
        return false;
      }
      const p = Math.min(1, (clock - city.start) / city.duration),
        t = p * p * (3 - 2 * p);
      city.point = {
        x: city.from.x + (city.target.point.x - city.from.x) * t,
        y: city.from.y + (city.target.point.y - city.from.y) * t + 4 * p * (1 - p) * city.arc,
        z: city.from.z + (city.target.point.z - city.from.z) * t,
      };
      if (city.climb) {
        const { wall, landing } = city.climb;
        const rise = Math.max(0, Math.min(1, (p - 0.14) / 0.63));
        const pull = Math.max(0, Math.min(1, (p - 0.77) / 0.23));
        const easedPull = pull * pull * (3 - 2 * pull);
        const plant = Math.max(0, Math.min(1, p / 0.14));
        const wallContactX = wall.x - 4.5 * plant * plant * (3 - 2 * plant);
        const easedRise = rise * rise * (3 - 2 * rise);
        city.point = {
          x: wallContactX + (landing.x - wallContactX) * easedPull,
          y: city.from.y + Math.max(0, landing.y - 6 - city.from.y) * easedRise + 6 * easedPull,
          z: wall.z + (landing.z - wall.z) * easedPull,
        };
        // The ledge height is exact even on the lowest buildings.
        if (pull > 0)
          city.point.y =
            Math.max(city.from.y, landing.y - 6) +
            (landing.y - Math.max(city.from.y, landing.y - 6)) * easedPull;
      }
      if (carPlay?.phase === "carry") {
        const { plan } = carPlay;
        bridge.moveCar(
          plan.id,
          {
            x: plan.from.x + (plan.to.x - plan.from.x) * t,
            y: plan.from.y + 4 * p * (1 - p) * city.arc,
            z: plan.from.z + (plan.to.z - plan.from.z) * t,
          },
          p,
        );
      }
      const projected = bridge.project(city.point);
      const height = projected.height,
        width = (height * 136) / 98;
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      size.w = width;
      size.h = height;
      const toX = projected.x - width * 0.52,
        toY = projected.y - height * 0.91;
      position.current = city.entry
        ? {
            x: city.entry.x + (toX - city.entry.x) * t,
            y: city.entry.y + (toY - city.entry.y) * t - Math.sin(p * Math.PI) * 100,
          }
        : { x: toX, y: toY };
      // Both representations follow one screen-space leap during the dissolve.
      const blend = city.entry ? Math.max(0, Math.min(1, (p - 0.28) / 0.62)) : 1;
      const morph = blend * blend * (3 - 2 * blend);
      element.style.setProperty("--milo-2d-opacity", String(1 - morph));
      element.style.opacity = "1";
      element.dataset.dimension = morph > 0.98 ? "3d" : morph < 0.02 ? "2d" : "morphing";
      bridge.companion({
        point: city.point,
        heading: cityHeading,
        action: current,
        blend: morph,
        facing,
        progress: p,
        carrying: carPlay?.phase === "carry",
        screen: city.entry
          ? { x: position.current.x + width * 0.52, y: position.current.y + height * 0.91 }
          : undefined,
      });
      element.dataset.citySurface = city.target.kind;
      cityPosition.current = { ...city.point };
      if (p === 1) {
        angle = 0;
        if (!city.waitUntil) {
          city.waitUntil =
            clock + (city.petAfterLanding ? 9000 : carPlay ? 400 : 700 + Math.random() * 850);
          if (city.climb) {
            city.target = {
              ...city.target,
              id: city.target.id.replace(/-wall$/, ""),
              kind: "roof",
            };
            city.climb = undefined;
            element.dataset.cityActivity = "roaming";
          }
          current = city.petAfterLanding ? "lie" : city.steps % 3 === 0 ? "stretch" : "sit";
          city.petAfterLanding = false;
          setAction(current);
        }
        if (clock > city.waitUntil) cityStep();
      }
      return true;
    }
    function begin(
      mode: CatAction,
      x = position.current.x,
      y = position.current.y,
      duration = 2500,
      arc = 0,
      rotation = 0,
      next?: () => void,
    ) {
      current = mode;
      setAction(mode);
      say(mode);
      const targetX = clampX(x),
        targetY = clampY(y);
      if (Math.abs(targetX - position.current.x) > 4)
        facing = targetX > position.current.x ? 1 : -1;
      journey = {
        fromX: position.current.x,
        fromY: position.current.y,
        toX: targetX,
        toY: targetY,
        start: clock,
        duration,
        arc,
        fromAngle: angle,
        angle: rotation,
        next,
      };
      nextAt = clock + duration;
    }
    function walkTo(x: number, next?: () => void) {
      begin(
        "walk",
        x,
        size.floor,
        Math.max(1400, (Math.abs(x - position.current.x) / 72) * 1000),
        0,
        0,
        next,
      );
    }
    function platforms() {
      return Array.from(
        document.querySelectorAll<HTMLElement>(".app-window:not(.is-maximized) .window-titlebar"),
      )
        .filter(
          (node) =>
            node.getClientRects().length > 0 && getComputedStyle(node).visibility !== "hidden",
        )
        .map((node) => node.getBoundingClientRect())
        .filter(
          (rect) =>
            rect.width > 150 && rect.top > size.top + 20 && rect.top < size.floor + size.h - 10,
        );
    }
    function perch(
      rect: DOMRect,
      x = rect.left + rect.width * (0.2 + Math.random() * 0.45),
      stay = false,
    ) {
      const landingX = clampX(Math.max(rect.left + 5, Math.min(rect.right - size.w - 5, x)));
      const landingY = clampY(rect.top - size.h + 5);
      begin(
        "jump",
        landingX,
        landingY,
        950,
        Math.min(105, Math.max(52, Math.abs(position.current.y - landingY) * 0.4)),
        0,
        () => {
          begin(
            "sit",
            landingX,
            landingY,
            stay ? 5200 : 2600,
            0,
            0,
            stay ? undefined : () => begin("hop", landingX + facing * 75, size.floor, 900, 55),
          );
        },
      );
    }
    function explore() {
      measure();
      cycle++;
      if (cycle % 5 === 0 && innerWidth > 700) {
        const right = position.current.x > innerWidth / 2,
          edge = right ? size.maxX : 4;
        walkTo(edge, () => {
          facing = right ? 1 : -1;
          begin(
            "climb",
            edge,
            Math.max(size.top + 95, size.floor - 240),
            2800,
            0,
            right ? -82 : 82,
            () => {
              begin("sit", edge, position.current.y, 600, 0, right ? -82 : 82, () =>
                begin("jump", edge + (right ? -180 : 180), size.floor, 1050, 70),
              );
            },
          );
        });
      } else if (cycle % 4 === 0 && innerWidth > 900) {
        const available = platforms();
        const platform = available[Math.floor(Math.random() * available.length)];
        if (platform) {
          perch(platform);
        } else begin("hop", position.current.x + facing * 85, size.floor, 800, 75);
      } else if (cycle % 3 === 0) {
        begin("stretch", position.current.x, size.floor, 1700, 0, 0, () =>
          begin("run", innerWidth * (0.12 + Math.random() * 0.62), size.floor, 1800),
        );
      } else {
        const target =
          position.current.x > innerWidth / 2
            ? innerWidth * (0.08 + Math.random() * 0.25)
            : innerWidth * (0.58 + Math.random() * 0.22);
        walkTo(target, () => begin("sit", position.current.x, size.floor, 1200));
      }
    }
    function tick(now: number) {
      if (!active || document.hidden) return;
      if (firstFrame) {
        firstFrame = false;
        if (!paused) setAction("sit");
        setSpeech("");
      }
      const delta = previous ? Math.min(now - previous, 48) : 0;
      previous = now;
      if (!paused && !dragging && !(near && ["walk", "run", "climb"].includes(current)))
        clock += delta;
      if (!paused && !dragging && !reducedMotion) {
        if (!city && !exitMorph && clock > nextCityAt && !["lie", "sleep"].includes(current)) {
          if (!enterCity()) nextCityAt = clock + 4500;
        }
        if (city) {
          animateCity();
        } else {
          if (clock > nextPlatformAt && !["lie", "sleep"].includes(current)) {
            nextPlatformAt = clock + 10000 + Math.random() * 5000;
            const available = platforms();
            if (available.length) perch(available[Math.floor(Math.random() * available.length)]);
          }
          if (journey) {
            const p = Math.min(1, (clock - journey.start) / journey.duration);
            const t =
              current === "walk" || current === "run" || current === "climb"
                ? p
                : p * p * (3 - 2 * p);
            position.current = {
              x: journey.fromX + (journey.toX - journey.fromX) * t,
              y:
                journey.fromY +
                (journey.toY - journey.fromY) * t -
                Math.sin(p * Math.PI) * journey.arc,
            };
            angle = journey.fromAngle + (journey.angle - journey.fromAngle) * Math.min(1, p * 5);
            if (p === 1) {
              const next = journey.next;
              journey = null;
              if (next) next();
              else {
                nextAt = clock + 800;
                current = "sit";
                setAction("sit");
              }
            }
          } else if (clock > nextAt && !near) explore();
        }
      }
      if (speechUntil && clock > speechUntil) {
        setSpeech("");
        speechUntil = 0;
      }
      if (exitMorph) {
        const elapsed =
          exitMorph.realStart === undefined ? clock - exitMorph.start : now - exitMorph.realStart;
        const p = Math.min(1, elapsed / exitMorph.duration),
          t = Math.min(1, p / 0.78),
          blend = 1 - t * t * (3 - 2 * t);
        getCityBridge()?.companion({
          point: exitMorph.point,
          heading: exitMorph.heading,
          action: current,
          blend,
          facing,
          screen: { x: position.current.x + size.w * 0.52, y: position.current.y + size.h * 0.91 },
        });
        element.style.setProperty("--milo-2d-opacity", String(1 - blend));
        element.dataset.dimension = p < 0.78 ? "morphing" : "2d";
        if (p === 1) {
          getCityBridge()?.companion(null);
          exitMorph = null;
        }
      }
      paint();
      if (!reducedMotion && !paused) frame = requestAnimationFrame(tick);
    }
    function pet() {
      if (paused) return;
      measure();
      if (city) {
        if (city.climb || carPlay) {
          if (carPlay) {
            cancelCarPlay();
            city.from = { ...city.point };
            city.target = { id: "PET_LANDING", kind: "street", point: { ...city.point, y: 0.4 } };
            city.start = clock;
            city.duration = 700;
            city.arc = 0;
            city.waitUntil = 0;
            current = "jump";
            setAction(current);
          }
          city.petAfterLanding = true;
          say("lie", true);
          return;
        }
        cancelCarPlay();
        city.climb = undefined;
        city.waitUntil = clock + 9000;
        city.start = clock - city.duration;
        city.from = { ...city.point };
        city.target = { ...city.target, point: { ...city.point } };
        current = "lie";
        setAction("lie");
        say("lie", true);
        return;
      }
      journey = null;
      angle = 0;
      if (position.current.y < size.floor - 90) {
        begin("jump", position.current.x, size.floor, 450, 20, 0, () => {
          begin("lie", position.current.x, size.floor, 9000, 0, 0, () =>
            begin("sleep", position.current.x, size.floor, 4500),
          );
          say("lie", true);
        });
      } else {
        begin("lie", position.current.x, position.current.y, 9000, 0, 0, () =>
          begin("sleep", position.current.x, position.current.y, 4500),
        );
        say("lie", true);
      }
      paint();
    }
    function dragStart(event: Event) {
      if (paused) return;
      if (city) {
        const point = { ...city.point };
        clearCity(true);
        exitMorph = {
          start: clock,
          duration: 450,
          point,
          heading: cityHeading,
          realStart: performance.now(),
        };
      } else if (exitMorph) clearCity();
      measure();
      const detail = (event as CustomEvent<{ x: number; y: number }>).detail;
      dragOrigin = { x: position.current.x - detail.x, y: position.current.y - detail.y };
      dragging = true;
      journey = null;
      angle = 0;
      current = "sit";
      setAction("sit");
      element.dataset.dragging = "true";
      say("hop", true);
    }
    function dragMove(event: Event) {
      if (!dragging) return;
      const detail = (event as CustomEvent<{ x: number; y: number }>).detail;
      const oldX = position.current.x;
      position.current = {
        x: clampX(detail.x + dragOrigin.x),
        y: clampY(detail.y + dragOrigin.y),
      };
      if (Math.abs(position.current.x - oldX) > 1) facing = position.current.x > oldX ? 1 : -1;
      paint();
    }
    function dragEnd() {
      if (!dragging) return;
      dragging = false;
      element.dataset.dragging = "false";
      const center = position.current.x + size.w / 2;
      const eligible = platforms()
        .filter(
          (rect) =>
            center >= rect.left - 35 &&
            center <= rect.right + 35 &&
            rect.top > position.current.y - size.h / 2,
        )
        .sort(
          (a, b) =>
            Math.abs(a.top - position.current.y - size.h) -
            Math.abs(b.top - position.current.y - size.h),
        );
      const landing = eligible[0];
      if (reducedMotion) {
        position.current.y = landing ? clampY(landing.top - size.h + 5) : size.floor;
        paint();
      } else if (landing) perch(landing, position.current.x, true);
      else {
        const bridge = cityAvailable(),
          footX = position.current.x + size.w * 0.5,
          footY = position.current.y + size.h * 0.9;
        const roof = cityAnchors()
          .filter((anchor) => anchor.kind === "roof")
          .sort((a, b) => {
            const pa = bridge!.project(a.point),
              pb = bridge!.project(b.point);
            return Math.hypot(pa.x - footX, pa.y - footY) - Math.hypot(pb.x - footX, pb.y - footY);
          })[0];
        const p = roof && bridge?.project(roof.point);
        const ground = bridge?.ground(footX, footY);
        if (roof && p && Math.hypot(p.x - footX, p.y - footY) < 140) enterCity(roof);
        else if (ground) enterCity({ id: "DROP", kind: "street", point: ground });
        else begin("jump", position.current.x, size.floor, 690, 30);
      }
    }
    function reactToClick(event: PointerEvent) {
      const target = event.target as Element;
      if (
        event.button !== 0 ||
        paused ||
        target.closest(
          ".milo, .milo-dialog, .topbar, .spatial-controls, .spatial-inspector, .spatial-footer, canvas:not(.neural-field):not(.spatial-canvas), dialog, .gallery-rail",
        )
      )
        return;
      measure();
      if (city) {
        city.waitUntil = clock;
        return;
      }
      clicks++;
      const modes: CatAction[] = ["hop", "stretch", "run", "sit"];
      const mode = modes[(clicks - 1) % modes.length];
      const destination =
        mode === "run"
          ? clampX(event.clientX - size.w / 2)
          : position.current.x + (mode === "hop" ? facing * 40 : 0);
      begin(
        reducedMotion ? "sit" : mode,
        reducedMotion ? position.current.x : destination,
        reducedMotion ? position.current.y : size.floor,
        mode === "run" ? 1500 : mode === "hop" ? 700 : 1800,
        mode === "hop" ? 65 : 0,
      );
    }
    function look(event: PointerEvent) {
      const distance = Math.hypot(
        event.clientX - position.current.x - size.w / 2,
        event.clientY - position.current.y - size.h / 2,
      );
      near = distance < 75;
      if (distance < 170 && !["walk", "run", "climb", "jump", "hop"].includes(current))
        facing = event.clientX > position.current.x + size.w / 2 ? 1 : -1;
    }
    function resize() {
      measure();
      position.current.x = clampX(position.current.x);
      position.current.y = clampY(position.current.y);
      if (journey) {
        journey.toX = clampX(journey.toX);
        journey.toY = clampY(journey.toY);
      }
      paint();
    }
    function visibility() {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }
    measure();
    if (reducedMotion || !context.startsWith("/:")) clearCity();
    else if (cityPosition.current && cityAvailable()) {
      const point = { ...cityPosition.current };
      city = {
        point,
        from: point,
        target: { id: "RESUME", kind: point.y > 2 ? "roof" : "street", point },
        start: 0,
        duration: 1,
        arc: 0,
        steps: 0,
        waitUntil: 600,
        entry: null,
      };
    } else {
      getCityBridge()?.companion(null);
      element.style.setProperty("--milo-2d-opacity", "1");
      element.dataset.dimension = "2d";
    }
    if (position.current.x < 0) position.current = { x: innerWidth * 0.92, y: size.floor };
    position.current.x = clampX(position.current.x);
    position.current.y = clampY(position.current.y);
    if (reducedMotion) {
      position.current.y = size.floor;
    }
    paint();
    frame = requestAnimationFrame(tick);
    window.addEventListener("milo:pet", pet);
    window.addEventListener("milo:drag-start", dragStart);
    window.addEventListener("milo:drag-move", dragMove);
    window.addEventListener("milo:drag-end", dragEnd);
    window.addEventListener("pointerdown", reactToClick);
    window.addEventListener("pointermove", look, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelCarPlay();
      active = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("milo:pet", pet);
      window.removeEventListener("milo:drag-start", dragStart);
      window.removeEventListener("milo:drag-move", dragMove);
      window.removeEventListener("milo:drag-end", dragEnd);
      window.removeEventListener("pointerdown", reactToClick);
      window.removeEventListener("pointermove", look);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [reducedMotion, paused, context]);
  return { body, action, speech };
}
