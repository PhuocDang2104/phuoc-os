"use client";

import { useEffect, useRef } from "react";
import { useWorkstation } from "../shell";

export function NeuralField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { workspace, reducedMotion } = useWorkstation();
  useEffect(() => {
    const element = canvas.current!;
    const context = element.getContext("2d");
    if (!context) return;
    let width = 0,
      height = 0,
      frame = 0,
      last = 0,
      phase = 0;
    const pointer = { x: -1000, y: -1000 };
    const resize = () => {
      const rect = element.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(devicePixelRatio, 1.5);
      element.width = width * ratio;
      element.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      cancelAnimationFrame(frame);
      draw(0);
    };
    const draw = (time: number) => {
      if (time && time - last < 40) {
        frame = requestAnimationFrame(draw);
        return;
      }
      last = time;
      if (!reducedMotion && time) phase += 0.003;
      context.clearRect(0, 0, width, height);
      const cols = width < 700 ? 58 : 116;
      const rows = width < 700 ? 28 : 46;
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
          const u = col / cols,
            v = row / rows;
          const wave = Math.sin(u * 9 + v * 3.8 + phase) * Math.cos(v * 4.3 + phase * 0.4);
          let x = u * width * 1.2 - width * 0.1;
          let y = height * 0.32 + v * height * 0.7 + wave * (70 + 55 * v);
          const dist = Math.hypot(x - pointer.x, y - pointer.y);
          const influence = !reducedMotion ? Math.max(0, 1 - dist / 160) : 0;
          y -= influence * 12;
          x += !reducedMotion ? (pointer.x / width - 0.5) * v * 5 : 0;
          const fade = Math.sin(u * Math.PI) * (0.15 + v * 0.42);
          const highlight = Math.max(0, wave - 0.35) * 0.28;
          context.fillStyle = `rgba(${workspace === 1 ? "158,147,204" : "145,144,169"},${fade + highlight + influence * 0.2})`;
          context.beginPath();
          context.arc(x, y, 0.65 + v * 0.55 + influence * 0.4, 0, Math.PI * 2);
          context.fill();
        }
      if (!reducedMotion && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const move = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("mousemove", move);
    };
  }, [workspace, reducedMotion]);
  return <canvas ref={canvas} className="neural-field" aria-hidden="true" />;
}
