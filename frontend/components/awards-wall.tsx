"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { awards, type AwardItem } from "@/lib/awards";
import { Icon } from "./ui/icon";

function AwardImage({ award }: { award: AwardItem }) {
  if (award.src) return <img src={award.src} alt={award.label} />; // eslint-disable-line @next/next/no-img-element
  return (
    <div className="award-placeholder" aria-label={`${award.label}, image pending`}>
      <span className="award-placeholder-mark"><Icon name="award" size={33} /></span>
      <span className="mono">ORIGINAL IMAGE PENDING</span>
      <strong>{award.label}</strong>
      <span className="award-placeholder-rule" />
      <small>Open to inspect this frame</small>
    </div>
  );
}

export function AwardsWall() {
  const [selected, setSelected] = useState<AwardItem | null>(null);
  const [angle, setAngle] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; y: number; ax: number; ay: number } | null>(null);
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") setAngle((old) => ({ ...old, y: old.y - 8 }));
      if (event.key === "ArrowRight") setAngle((old) => ({ ...old, y: old.y + 8 }));
      if (event.key === "ArrowUp") setAngle((old) => ({ ...old, x: old.x + 8 }));
      if (event.key === "ArrowDown") setAngle((old) => ({ ...old, x: old.x - 8 }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);
  function open(award: AwardItem) {
    setSelected(award);
    setAngle({ x: 0, y: 0 });
    setZoom(1);
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ax: angle.x, ay: angle.y };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setAngle({
      x: Math.max(-55, Math.min(55, drag.current.ax - (event.clientY - drag.current.y) * .35)),
      y: Math.max(-65, Math.min(65, drag.current.ay + (event.clientX - drag.current.x) * .35)),
    });
  }
  return (
    <main id="main" className="awards-page">
      <div className="awards-wall-intro">
        <div className="archive-breadcrumb mono"><Link href="/">phuoc@workspace</Link><span>/</span>awards</div>
      </div>
      <h1 className="sr-only">Awards wall</h1>
      <div className="awards-wall" aria-label="Awards wall">
        {awards.map((award, index) => (
          <button className={`award-hanging award-hanging-${index + 1}`} key={award.id} onClick={() => open(award)} aria-label={`Inspect ${award.label}`}>
            <span className="award-wire" /><span className="award-pin" />
            <span className="award-frame"><AwardImage award={award} /></span>
            <span className="award-caption mono"><span>{award.label}</span><small>{award.category} · view in 3D ↗</small></span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="award-inspector-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="award-inspector" role="dialog" aria-modal="true" aria-label={`Inspect ${selected.label}`}>
            <div className="award-inspector-bar mono"><span>INSPECT / {selected.label.toUpperCase()}</span><button onClick={() => setSelected(null)} aria-label="Close award inspector"><Icon name="close" size={17} /></button></div>
            <div className="award-inspector-stage" onPointerDown={start} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
              <div className="award-inspector-object" style={{ transform: `perspective(1100px) rotateX(${angle.x}deg) rotateY(${angle.y}deg) scale(${zoom})` }}><AwardImage award={selected} /></div>
            </div>
            <div className="award-inspector-controls mono"><span>DRAG TO ROTATE · ARROWS TO NUDGE</span><div><button onClick={() => setZoom((value) => Math.max(.65, +(value - .15).toFixed(2)))} aria-label="Zoom out">−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(1.8, +(value + .15).toFixed(2)))} aria-label="Zoom in">+</button><button onClick={() => { setAngle({ x: 0, y: 0 }); setZoom(1); }}>RESET</button></div></div>
          </section>
        </div>
      )}
    </main>
  );
}
