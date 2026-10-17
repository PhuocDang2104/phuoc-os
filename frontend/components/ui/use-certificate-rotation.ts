"use client";

import { useRef, useState, type PointerEvent } from "react";

export type CertificateRotation = { x: number; y: number };

export function useCertificateRotation() {
  const [rotation, setRotation] = useState<CertificateRotation>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    rotation: CertificateRotation;
  } | null>(null);
  const suppressClick = useRef(false);
  function start(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, rotation };
    suppressClick.current = false;
    setDragging(true);
  }
  function move(event: PointerEvent<HTMLElement>) {
    const origin = pointer.current;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x,
      dy = event.clientY - origin.y;
    if (Math.hypot(dx, dy) > 5) suppressClick.current = true;
    // Intentionally unbounded: repeated drags can turn the paper through any number of revolutions.
    setRotation({ x: origin.rotation.x - dy * 0.65, y: origin.rotation.y + dx * 0.65 });
  }
  function end(event: PointerEvent<HTMLElement>) {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function consumeDrag() {
    const moved = suppressClick.current;
    suppressClick.current = false;
    return moved;
  }
  return {
    rotation,
    setRotation,
    dragging,
    consumeDrag,
    handlers: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: end,
      onLostPointerCapture: () => {
        pointer.current = null;
        setDragging(false);
      },
    },
  };
}
