"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import Link from "next/link";
import { awards, type AwardItem } from "@/lib/awards";
import { Icon } from "./ui/icon";

function AwardImage({ award }: { award: AwardItem }) {
  if (award.src) return <img src={award.src} alt={award.label} />; // eslint-disable-line @next/next/no-img-element
  return (
    <span className="award-placeholder" aria-label={`${award.label}, image pending`}>
      <Icon name="award" size={28} />
      <span className="mono">DOCUMENT RESERVED</span>
      <strong>{award.label}</strong>
      <small>Original certificate to follow</small>
    </span>
  );
}

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

function preview(event: PointerEvent<HTMLButtonElement>) {
  if (
    event.pointerType === "touch" ||
    event.currentTarget.closest(".reduce-motion") ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const node = event.currentTarget,
    rect = node.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width,
    y = (event.clientY - rect.top) / rect.height;
  node.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
  node.style.setProperty("--tilt-y", `${(x - 0.5) * 7}deg`);
  node.style.setProperty("--pointer-x", `${x * 100}%`);
  node.style.setProperty("--pointer-y", `${y * 100}%`);
}

export function AwardsWall() {
  const [selected, setSelected] = useState<AwardItem | null>(null);
  const [angle, setAngle] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ x: number; y: number; ax: number; ay: number } | null>(null);
  const isOpen = selected !== null;
  useEffect(() => {
    if (!isOpen) return;
    const node = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
      drag.current = null;
    };
  }, [isOpen]);

  function open(award: AwardItem) {
    setSelected(award);
    setAngle({ x: 0, y: 0 });
    setZoom(1);
  }
  function adjacent(direction: number) {
    const index = awards.findIndex((award) => award.id === selected?.id);
    open(awards[(index + direction + awards.length) % awards.length]);
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ax: angle.x, ay: angle.y };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setAngle({
      x: clamp(drag.current.ax - (event.clientY - drag.current.y) * 0.35, 55),
      y: clamp(drag.current.ay + (event.clientX - drag.current.x) * 0.35, 65),
    });
  }
  return (
    <main id="main" className="awards-page">
      <div className="awards-wall-intro">
        <div className="archive-breadcrumb mono">
          <Link href="/">phuoc@workspace</Link>
          <span>/</span>awards
        </div>
        <span className="award-archive-count mono">
          <Icon name="award" size={13} />
          {String(awards.length).padStart(2, "0")} RECORDS
        </span>
      </div>
      <h1 className="sr-only">Awards archive</h1>
      <div className="awards-wall" aria-label="Awards archive">
        {awards.map((award, index) => (
          <button
            className="award-document"
            style={{ "--award-index": index } as CSSProperties}
            key={award.id}
            onClick={() => open(award)}
            aria-label={`Inspect ${award.label}`}
            onPointerMove={preview}
            onPointerLeave={(event) => {
              event.currentTarget.style.setProperty("--tilt-x", "0deg");
              event.currentTarget.style.setProperty("--tilt-y", "0deg");
            }}
          >
            <span className="award-document-index mono">
              <span>/{String(index + 1).padStart(2, "0")}</span>
              <span>{award.src ? "CERTIFICATE" : "AWARD RECORD"}</span>
              <Icon name="external" size={13} />
            </span>
            <span className="award-frame">
              <AwardImage award={award} />
              <span className="award-corners" aria-hidden="true" />
            </span>
            <span className="award-caption">
              <strong>{award.label}</strong>
              <small className="mono">{award.category}</small>
            </span>
            <span className="award-document-foot mono">
              <span>
                <i />
                {award.src ? "ORIGINAL DOCUMENT" : "IMAGE PENDING"}
              </span>
              <span>
                INSPECT <Icon name="arrow" size={12} />
              </span>
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <dialog
          ref={dialog}
          className="award-inspector"
          aria-label={`Inspect ${selected.label}`}
          onCancel={(event) => {
            event.preventDefault();
            setSelected(null);
          }}
          onPointerDown={(event) => {
            if (event.target !== event.currentTarget) return;
            const r = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < r.left ||
              event.clientX > r.right ||
              event.clientY < r.top ||
              event.clientY > r.bottom
            )
              setSelected(null);
          }}
          onKeyDown={(event) => {
            const offsets: Record<string, [number, number]> = {
              ArrowLeft: [0, -8],
              ArrowRight: [0, 8],
              ArrowUp: [8, 0],
              ArrowDown: [-8, 0],
            };
            const offset = offsets[event.key];
            if (offset) {
              event.preventDefault();
              setAngle((old) => ({
                x: clamp(old.x + offset[0], 55),
                y: clamp(old.y + offset[1], 65),
              }));
            }
          }}
        >
          <div className="award-inspector-bar mono">
            <span>
              <Icon name="award" size={14} /> DOCUMENT /{" "}
              {String(awards.indexOf(selected) + 1).padStart(2, "0")}
            </span>
            <button onClick={() => setSelected(null)} aria-label="Close award inspector">
              <Icon name="close" size={17} />
            </button>
          </div>
          <div className="award-inspector-heading">
            <strong>{selected.label}</strong>
            <span className="mono">{selected.category}</span>
          </div>
          <div
            className="award-inspector-stage"
            tabIndex={0}
            aria-label="Certificate preview. Drag or use arrow keys to rotate."
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <div
              className="award-inspector-object"
              style={{
                transform: `perspective(1100px) rotateX(${angle.x}deg) rotateY(${angle.y}deg) scale(${zoom})`,
              }}
            >
              <AwardImage award={selected} />
            </div>
          </div>
          <div className="award-inspector-controls mono">
            <span>DRAG TO ROTATE</span>
            <div>
              <button
                onClick={() => setZoom((value) => Math.max(0.65, +(value - 0.15).toFixed(2)))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span aria-live="polite">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((value) => Math.min(1.8, +(value + 0.15).toFixed(2)))}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => {
                  setAngle({ x: 0, y: 0 });
                  setZoom(1);
                }}
              >
                RESET
              </button>
            </div>
          </div>
          <div className="award-inspector-footer mono">
            <button onClick={() => adjacent(-1)} aria-label="Previous award">
              <Icon name="previous" size={14} />
            </button>
            <span>
              {selected.src ? (
                <a href={selected.src} target="_blank" rel="noreferrer">
                  OPEN ORIGINAL <Icon name="external" size={12} />
                </a>
              ) : (
                "ORIGINAL IMAGE PENDING"
              )}
            </span>
            <button onClick={() => adjacent(1)} aria-label="Next award">
              <Icon name="next" size={14} />
            </button>
          </div>
        </dialog>
      )}
    </main>
  );
}
