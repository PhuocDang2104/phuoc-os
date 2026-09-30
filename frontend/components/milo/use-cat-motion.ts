"use client";

import { useEffect, useRef, useState } from "react";
import type { CatAction } from "./cat-art";

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
    const hints: Partial<Record<CatAction, string[]>> = {
      walk: [
        "Just checking on the workspace.",
        "A small patrol. Big responsibilities.",
        "Everything seems to be in order.",
      ],
      run: ["Important cat business.", "On my way. Probably.", "A little burst of curiosity."],
      hop: ["Oh! You found my jump button.", "Tiny paws. Excellent suspension."],
      climb: ["The view is better up here.", "Walls are just vertical floors."],
      jump: ["This window makes a nice perch.", "Landing gear: four paws.", "A little leap of curiosity."],
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
    const clampY = (y: number) => Math.max(size.top, Math.min(size.floor, y));
    function paint() {
      const { x, y } = position.current;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      element.style.setProperty("--milo-facing", String(facing));
      element.style.setProperty("--milo-angle", `${angle}deg`);
      element.style.visibility = "visible";
      element.dataset.speechBelow = String(y < size.top + 65);
      element.dataset.speechAlign = x < 90 ? "left" : x > innerWidth - 235 ? "right" : "center";
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
      return Array.from(document.querySelectorAll<HTMLElement>(".app-window:not(.is-maximized) .window-titlebar"))
        .map((node) => node.getBoundingClientRect())
        .filter((rect) => rect.width > 150 && rect.top > size.top + 20 && rect.top < size.floor + size.h - 10);
    }
    function perch(rect: DOMRect, x = rect.left + rect.width * (.2 + Math.random() * .45), stay = false) {
      const landingX = clampX(Math.max(rect.left + 5, Math.min(rect.right - size.w - 5, x)));
      const landingY = clampY(rect.top - size.h + 5);
      begin("jump", landingX, landingY, 950, Math.min(105, Math.max(52, Math.abs(position.current.y - landingY) * .4)), 0, () => {
        begin("sit", landingX, landingY, stay ? 5200 : 2600, 0, 0, stay ? undefined : () => begin("hop", landingX + facing * 75, size.floor, 900, 55));
      });
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
      if (speechUntil && clock > speechUntil) {
        setSpeech("");
        speechUntil = 0;
      }
      paint();
      if (!reducedMotion && !paused) frame = requestAnimationFrame(tick);
    }
    function pet() {
      if (paused) return;
      measure();
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
        .filter((rect) => center >= rect.left - 35 && center <= rect.right + 35 && rect.top > position.current.y - size.h / 2)
        .sort((a, b) => Math.abs(a.top - position.current.y - size.h) - Math.abs(b.top - position.current.y - size.h));
      const landing = eligible[0];
      if (reducedMotion) {
        position.current.y = landing ? clampY(landing.top - size.h + 5) : size.floor;
        paint();
      } else if (landing) perch(landing, position.current.x, true);
      else begin("jump", position.current.x, size.floor, 690, 30);
    }
    function reactToClick(event: PointerEvent) {
      const target = event.target as Element;
      if (
        event.button !== 0 ||
        paused ||
        target.closest(
          ".milo, .milo-dialog, .topbar, canvas:not(.neural-field), dialog, .gallery-rail",
        )
      )
        return;
      measure();
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
