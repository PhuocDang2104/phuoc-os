"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";
import { createJourneyWave } from "./journey-wave";

const chapters = [
  {
    year: "2023",
    stage: "FOUNDATION",
    organization: "HCMUT",
    role: "Electrical / Electronic Engineering",
    logo: "hcmut",
    body: "Bachelor of Electrical and Electronic Engineering in Electrical Engineering at Ho Chi Minh City University of Technology, 2023–2027.",
    href: "/work",
  },
  {
    year: "2025",
    stage: "EMBEDDED",
    organization: "FPT Software",
    role: "Embedded engineering internship",
    logo: "fpt-software",
    body: "Firmware, hardware interfaces and the practical constraints that turn software into a dependable physical system.",
    href: "/work",
  },
  {
    year: "2026",
    stage: "RESEARCH",
    organization: "MLIoT Lab",
    role: "Research assistant",
    logo: "mliot",
    body: "Connecting sensor signals with useful intelligence through machine learning, explainability and deployment beyond the lab.",
    href: "/research",
  },
  {
    year: "2026",
    stage: "AI TRACK",
    organization: "FPT Software",
    role: "ML / DL AI engineering internship",
    logo: "fpt-software",
    body: "Model development, computer vision and intelligent applications: connecting learned representations with practical deployment.",
    href: "/research",
  },
];
const trajectory = "M120 25C120 75 380 80 380 130C380 178 140 188 140 245C140 300 380 300 380 350";

export function JourneyLog() {
  const { reducedMotion } = useWorkstation();
  const uid = useId().replaceAll(":", "");
  const root = useRef<HTMLDivElement>(null),
    ignition = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null),
    head = useRef<SVGCircleElement>(null),
    trail = useRef<SVGUseElement>(null),
    illuminated = useRef<SVGUseElement>(null),
    waveCanvas = useRef<HTMLCanvasElement>(null);
  const [intro, setIntro] = useState<"orbit" | "travel" | "done">("orbit");
  const [replay, setReplay] = useState(0),
    [active, setActive] = useState(0),
    [expanded, setExpanded] = useState<number | null>(null);
  const skip = useRef(false);
  useEffect(() => {
    if (reducedMotion) {
      queueMicrotask(() => setIntro("done"));
      return;
    }
    const flight = setTimeout(() => {
      if (skip.current) return;
      const dot = root.current?.querySelector<HTMLElement>(".j-star-0 .j-star-dot");
      if (dot && ignition.current && root.current) {
        const point = dot.getBoundingClientRect(),
          bounds = root.current.getBoundingClientRect();
        ignition.current.style.setProperty(
          "--flight-x",
          `${point.left + point.width / 2 - bounds.left - bounds.width / 2}px`,
        );
        ignition.current.style.setProperty(
          "--flight-y",
          `${point.top + point.height / 2 - bounds.top - bounds.height / 2}px`,
        );
      }
      setIntro("travel");
    }, 900);
    const finish = setTimeout(() => setIntro("done"), 1900);
    return () => {
      clearTimeout(flight);
      clearTimeout(finish);
    };
  }, [replay, reducedMotion]);
  useEffect(() => {
    if (intro !== "done" || reducedMotion) return;
    const line = path.current!,
      length = line.getTotalLength();
    const wave = createJourneyWave(waveCanvas.current!, line);
    const points = [
      [120, 25],
      [380, 130],
      [140, 245],
      [380, 350],
    ];
    const milestones = points.map(([x, y]) => {
      let closest = Infinity,
        fraction = 0;
      for (let i = 0; i <= 160; i++) {
        const p = line.getPointAtLength((length * i) / 160),
          distance = Math.hypot(p.x - x, p.y - y);
        if (distance < closest) {
          closest = distance;
          fraction = i / 160;
        }
      }
      return fraction;
    });
    let frame = 0,
      elapsed = 0,
      previous = 0,
      current = -1;
    function tick(now: number) {
      if (!document.hidden) elapsed += previous ? Math.min(now - previous, 40) : 0;
      previous = now;
      const progress = (elapsed % 8200) / 8200,
        position = line.getPointAtLength(progress * length);
      head.current?.setAttribute("cx", String(position.x));
      head.current?.setAttribute("cy", String(position.y));
      const opacity = Math.min(1, progress / 0.025, (1 - progress) / 0.04),
        tail = Math.min(length * 0.11, progress * length);
      head.current?.setAttribute("opacity", String(opacity));
      trail.current?.setAttribute("opacity", String(opacity));
      trail.current?.setAttribute("stroke-dasharray", `${tail} ${length * 1.1}`);
      trail.current?.setAttribute("stroke-dashoffset", String(-(progress * length - tail)));
      illuminated.current?.setAttribute("stroke-dasharray", `${progress * length} ${length * 1.1}`);
      illuminated.current?.setAttribute("opacity", String(Math.min(1, (1 - progress) / 0.04)));
      wave.draw(progress, elapsed, opacity);
      const chapter = milestones.reduce(
        (last, milestone, index) => (progress >= milestone - 0.015 ? index : last),
        0,
      );
      if (chapter !== current) {
        current = chapter;
        setActive(chapter);
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      wave.dispose();
    };
  }, [intro, replay, reducedMotion]);
  function replayIntro() {
    skip.current = false;
    setExpanded(null);
    setActive(0);
    setIntro(reducedMotion ? "done" : "orbit");
    setReplay((value) => value + 1);
  }
  const chapter = expanded === null ? null : chapters[expanded];
  return (
    <div
      ref={root}
      className={`journey-log-experience ${intro === "done" ? "intro-complete" : ""}`}
      data-view="constellation"
      data-intro={intro}
      onKeyDown={(event) => {
        if (event.key === "Escape" && expanded !== null) {
          event.stopPropagation();
          setExpanded(null);
          root.current?.querySelector<HTMLButtonElement>(`.j-star-${expanded}`)?.focus();
        }
      }}
    >
      <div className="j-toolbar">
        <div className="j-toolbar-actions">
          {intro !== "done" && (
            <button
              className="j-skip mono"
              onClick={() => {
                skip.current = true;
                setIntro("done");
              }}
            >
              Skip intro
            </button>
          )}
          <button aria-label="Replay journey intro" title="Replay intro" onClick={replayIntro}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor">
              <path d="M3 5a5.5 5.5 0 1 1-1 5M3 1v4h4" />
            </svg>
          </button>
        </div>
      </div>
      <div key={replay} className="j-constellation" aria-label="Journey trajectory">
        <canvas className="j-wave-field" ref={waveCanvas} aria-hidden="true" />
        <svg viewBox="0 0 500 500" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-color`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#c4a4ef" />
              <stop offset=".5" stopColor="#a7b9ed" />
              <stop offset="1" stopColor="#bd9be5" />
            </linearGradient>
            <path ref={path} id={`${uid}-path`} className="j-trajectory" d={trajectory} />
          </defs>
          <use href={`#${uid}-path`} className="j-trajectory-base" stroke={`url(#${uid}-color)`} />
          <use
            ref={illuminated}
            href={`#${uid}-path`}
            className="j-trajectory-lit"
            strokeDasharray="0 10000"
          />
          <use ref={trail} href={`#${uid}-path`} className="j-trajectory-trail" />
          <circle ref={head} className="j-flow-signal" cx="120" cy="25" r="2.8" />
        </svg>
        {chapters.map((item, index) => (
          <button
            key={item.stage}
            className={`j-star-node j-star-${index} ${active === index ? "is-current" : ""}`}
            style={{ "--node-index": index } as React.CSSProperties}
            aria-label={`${item.year} ${item.organization} ${item.stage}`}
            aria-expanded={expanded === index}
            aria-controls={`${uid}-detail`}
            onClick={() => setExpanded(expanded === index ? null : index)}
          >
            <span className="j-star-dot" />
            <span className="mono">
              {item.year} / {item.stage}
            </span>
            <span className={`j-star-logo j-star-logo-${item.logo}`}>
              <Image
                src={`/portfolio/logos/${item.logo}.png`}
                width={35}
                height={35}
                alt={`${item.organization} logo`}
              />
            </span>
            <strong>{item.organization}</strong>
            <small>{item.role}</small>
          </button>
        ))}
        {chapter && (
          <aside
            className="j-chapter-panel"
            id={`${uid}-detail`}
            aria-label={`${chapter.organization} chapter`}
          >
            <header>
              <span className="mono">
                {chapter.year} / {chapter.stage}
              </span>
              <button aria-label="Close chapter details" onClick={() => setExpanded(null)}>
                <Icon name="close" size={13} />
              </button>
            </header>
            <h3>{chapter.organization}</h3>
            <p>{chapter.body}</p>
            <Link href={chapter.href}>
              {chapter.href === "/work" ? "Explore work" : "Explore research"}
              <Icon name="arrow" size={12} />
            </Link>
          </aside>
        )}
      </div>
      <div className="j-statusbar mono">
        <span>
          <i />
          JOURNEY / CONNECTED
        </span>
        <span>{String(active + 1).padStart(2, "0")} / 04</span>
      </div>
      {intro !== "done" && !reducedMotion && (
        <div
          ref={ignition}
          className={`j-ignition ${intro === "travel" ? "is-travelling" : ""}`}
          aria-hidden="true"
        >
          <div className="j-ignition-core">
            <span className="j-ignition-seed" />
          </div>
        </div>
      )}
    </div>
  );
}
