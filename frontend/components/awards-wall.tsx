"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { awards, type AwardItem } from "@/lib/awards";
import { Icon } from "./ui/icon";
import { AuroraBackground } from "./ui/aurora-background";
import { useCertificateRotation, type CertificateRotation } from "./ui/use-certificate-rotation";

function AwardImage({ award }: { award: AwardItem }) {
  if (!award.src)
    return (
      <span className="award-placeholder" aria-label={`${award.label}, image pending`}>
        <Icon name="award" size={32} />
        <strong>{award.label}</strong>
        <small className="mono">ORIGINAL CERTIFICATE TO FOLLOW</small>
      </span>
    );
  return (
    <span className="certificate-paper">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="certificate-front" src={award.src} alt={award.label} draggable={false} />
      {/* A faint reverse print simulates paper translucency; it is not an extra document. */}
      <span className="certificate-back" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={award.src} alt="" draggable={false} />
      </span>
    </span>
  );
}

function FloatingCertificate({
  award,
  index,
  onInspect,
}: {
  award: AwardItem;
  index: number;
  onInspect: (award: AwardItem, rotation: CertificateRotation) => void;
}) {
  const spin = useCertificateRotation();
  return (
    <button
      className="award-document"
      aria-label={`Inspect ${award.label}`}
      style={{ "--award-index": index } as CSSProperties}
      {...spin.handlers}
      data-dragging={spin.dragging}
      data-rotation-x={spin.rotation.x}
      data-rotation-y={spin.rotation.y}
      onClick={(event) => {
        if (spin.consumeDrag()) {
          event.preventDefault();
          return;
        }
        onInspect(award, spin.rotation);
      }}
    >
      <span className="award-float">
        <span
          className="award-orientation"
          style={{
            transform: `perspective(1200px) rotateX(${spin.rotation.x}deg) rotateY(${spin.rotation.y}deg)`,
          }}
        >
          <AwardImage award={award} />
        </span>
      </span>
      <span className="award-caption">
        <strong>{award.label}</strong>
        <small className="mono">{award.category}</small>
      </span>
    </button>
  );
}

export function AwardsWall() {
  const [selected, setSelected] = useState<AwardItem | null>(null),
    [zoom, setZoom] = useState(1);
  const spin = useCertificateRotation();
  const dialog = useRef<HTMLDialogElement>(null),
    isOpen = selected !== null;
  useEffect(() => {
    if (!isOpen) return;
    const node = dialog.current!,
      previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, [isOpen]);
  function open(award: AwardItem, rotation: CertificateRotation = { x: 0, y: 0 }) {
    setSelected(award);
    spin.setRotation(rotation);
    setZoom(1);
  }
  function adjacent(direction: number) {
    const i = awards.findIndex((a) => a.id === selected?.id);
    open(awards[(i + direction + awards.length) % awards.length]);
  }
  return (
    <main id="main" className="awards-page">
      <AuroraBackground />
      <div className="awards-wall-intro">
        <div className="archive-breadcrumb mono">
          <Link href="/">phuoc@workspace</Link>
          <span>/</span>awards
        </div>
        <span className="award-hint mono">DRAG TO TURN · CLICK TO INSPECT</span>
      </div>
      <h1 className="sr-only">Awards archive</h1>
      <div className="awards-wall" aria-label="Awards archive">
        {awards.map((award, index) => (
          <FloatingCertificate key={award.id} award={award} index={index} onInspect={open} />
        ))}
      </div>
      {selected && (
        <dialog
          ref={dialog}
          className="award-inspector"
          aria-label={`Inspect ${selected.label}`}
          onCancel={(e) => {
            e.preventDefault();
            setSelected(null);
          }}
          onPointerDown={(e) => {
            if (e.target !== e.currentTarget) return;
            setSelected(null);
          }}
          onKeyDown={(e) => {
            const offsets: Record<string, [number, number]> = {
                ArrowLeft: [0, -12],
                ArrowRight: [0, 12],
                ArrowUp: [12, 0],
                ArrowDown: [-12, 0],
              },
              offset = offsets[e.key];
            if (offset) {
              e.preventDefault();
              spin.setRotation((old) => ({ x: old.x + offset[0], y: old.y + offset[1] }));
            }
          }}
        >
          <div className="award-inspector-bar">
            <span>
              <strong>{selected.label}</strong>
              <small className="mono">{selected.category}</small>
            </span>
            <button onClick={() => setSelected(null)} aria-label="Close award inspector">
              <Icon name="close" size={20} />
            </button>
          </div>
          <div
            className="award-inspector-stage"
            tabIndex={0}
            aria-label="Certificate preview. Drag or use arrow keys to rotate through 360 degrees."
            {...spin.handlers}
            data-dragging={spin.dragging}
            data-rotation-x={spin.rotation.x}
            data-rotation-y={spin.rotation.y}
          >
            <div
              className="award-inspector-object"
              style={{
                transform: `perspective(1400px) rotateX(${spin.rotation.x}deg) rotateY(${spin.rotation.y}deg) scale(${zoom})`,
              }}
            >
              <AwardImage award={selected} />
            </div>
          </div>
          <div className="award-inspector-controls mono">
            <button onClick={() => adjacent(-1)} aria-label="Previous award">
              <Icon name="previous" size={16} />
            </button>
            <div>
              <button
                onClick={() => setZoom((v) => Math.max(0.65, +(v - 0.15).toFixed(2)))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span aria-live="polite">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((v) => Math.min(1.8, +(v + 0.15).toFixed(2)))}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => {
                  spin.setRotation({ x: 0, y: 0 });
                  setZoom(1);
                }}
              >
                RESET
              </button>
              {selected.src && (
                <a
                  href={selected.src}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open original certificate"
                >
                  <Icon name="external" size={15} />
                </a>
              )}
            </div>
            <button onClick={() => adjacent(1)} aria-label="Next award">
              <Icon name="next" size={16} />
            </button>
          </div>
        </dialog>
      )}
    </main>
  );
}
