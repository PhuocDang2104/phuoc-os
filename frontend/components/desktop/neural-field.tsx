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
    const pointer = { x: 0, y: 0 };
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
      const cols = width < 700 ? 90 : 195;
      const rows = width < 700 ? 110 : 125;
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
          const u = col / cols,
            v = row / rows;
          const wave = Math.sin(u * 8.5 + v * 3 + phase) * Math.cos(v * 7.5 - u * 2 + phase * 0.4);
          const ribbon = Math.sin(u * 13 - v * 5 + wave * 1.8 + phase * 0.5);
          let x = u * width;
          let y = v * height;
          const dist = Math.hypot(x - pointer.x, y - pointer.y);
          const influence = !reducedMotion ? Math.max(0, 1 - dist / 160) : 0;
          y -= influence * 5;
          x += !reducedMotion ? (pointer.x / width - 0.5) * 2 : 0;
          const density = Math.max(0, wave * 0.68 + ribbon * 0.34 + 0.12);
          if (density < 0.05) continue;
          const light = document.documentElement.dataset.theme === "light";
          const alpha = light
            ? density * 0.26 + influence * 0.05
            : density * 0.52 + influence * 0.08;
          context.fillStyle = `rgba(${light ? "80,63,103" : workspace === 1 ? "153,135,182" : density > 0.65 ? "188,180,197" : "128,111,150"},${alpha})`;
          const pointSize = 0.7 + density * 1.3;
          context.fillRect(x, y, pointSize, pointSize);
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
    window.addEventListener("phuoc:theme", resize);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("phuoc:theme", resize);
    };
  }, [workspace, reducedMotion]);
  return <canvas ref={canvas} className="neural-field" aria-hidden="true" />;
}
