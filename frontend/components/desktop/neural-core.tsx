"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";

export default function NeuralCore() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { reducedMotion } = useWorkstation();
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const element = canvas.current!,
      ctx = element.getContext("2d");
    if (!ctx) return;
    let frame = 0,
      angle = 0,
      width = 0,
      height = 0,
      last = 0;
    const draw = (time: number) => {
      if (time && time - last < 35) {
        frame = requestAnimationFrame(draw);
        return;
      }
      last = time;
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width * 0.32, height * 0.38, 245),
        count = width < 600 ? 1600 : 3200;
      if (!reducedMotion) angle += 0.0016;
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2,
          ring = Math.sqrt(1 - y * y),
          phi = i * 2.39996323;
        const shape = 1 + 0.11 * Math.sin(phi * 3 + y * 9 + angle * 2);
        const x = Math.cos(phi + angle) * ring,
          z = Math.sin(phi + angle) * ring;
        const scale = 1 + z * 0.19;
        const px = width / 2 + x * radius * scale * shape,
          py = height / 2 + y * radius * scale * shape;
        const opacity = 0.13 + (z + 1) * 0.3;
        ctx.fillStyle = active
          ? `rgba(184,167,255,${opacity})`
          : `rgba(${z > 0.4 ? "184,167,255" : "139,149,184"},${opacity})`;
        ctx.beginPath();
        ctx.arc(px, py, 0.6 + (z + 1) * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reducedMotion && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      const rect = element.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(devicePixelRatio, 1.5);
      element.width = width * dpr;
      element.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cancelAnimationFrame(frame);
      draw(0);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) draw(0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [reducedMotion, active]);
  const portals = [
    { id: "work", title: "Work", sub: "Ideas, engineered into reality", number: "01" },
    { id: "research", title: "Research", sub: "Questions, models, discoveries", number: "02" },
    { id: "blog", title: "Blog", sub: "Notes from the workbench", number: "03" },
    { id: "awards", title: "Awards", sub: "Milestones along the way", number: "04" },
  ];
  return (
    <section className="neural-core">
      <div className="core-heading">
        <div className="intro-eyebrow">
          <span className="accent-line" />
          EVERYTHING IS CONNECTED
        </div>
        <h1>Follow your curiosity.</h1>
        <p>One mind. Many intersections. Choose a path.</p>
      </div>
      <div className="core-visual">
        <canvas ref={canvas} aria-hidden="true" />
        <span className="core-center-label mono">
          PHUOC.OS
          <br />
          <small>KNOWLEDGE CORE</small>
        </span>
        {portals.map((portal) => (
          <Link
            href={`/${portal.id}`}
            key={portal.id}
            className={`core-portal portal-${portal.id}`}
            onMouseEnter={() => setActive(portal.id)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(portal.id)}
            onBlur={() => setActive(null)}
          >
            <span className="portal-node" />
            <span>
              <small className="mono">CLUSTER / {portal.number}</small>
              <strong>
                {portal.title} <Icon name="external" size={16} />
              </strong>
              <span>{portal.sub}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="core-caption mono">
        <span className="status-dot" /> AN EXPLORABLE MAP OF IDEAS
      </div>
    </section>
  );
}
