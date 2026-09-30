"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { apps, type AppId } from "@/lib/portfolio";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";

export function AppWindow({
  id,
  index,
  focused,
  children,
}: {
  id: AppId;
  index: number;
  focused: boolean;
  children: React.ReactNode;
}) {
  const { closeApp, minimizeApp, focusApp, hydrated } = useWorkstation();
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    dx: number;
    dy: number;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (matchMedia("(max-width: 900px)").matches && !["about", "snapshot", "stack"].includes(id)) {
      ref.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [id]);

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest("button") ||
      maximized ||
      matchMedia("(max-width: 900px)").matches
    )
      return;
    const rect = ref.current!.getBoundingClientRect();
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      dx: offset.x,
      dy: offset.y,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (!drag.current) return;
    const start = drag.current;
    const dx = Math.max(
      12 - start.left,
      Math.min(innerWidth - start.width - 12 - start.left, event.clientX - start.x),
    );
    const dy = Math.max(
      (document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 40) - start.top,
      Math.min(innerHeight - 90 - start.top, event.clientY - start.y),
    );
    setOffset({ x: start.dx + dx, y: start.dy + dy });
  }

  const style = {
    "--window-index": index,
    "--drag-x": `${offset.x}px`,
    "--drag-y": `${offset.y}px`,
    zIndex: index + 10,
  } as CSSProperties;
  return (
    <section
      ref={ref}
      className={`app-window window-${id} ${focused ? "is-focused" : ""} ${maximized ? "is-maximized" : ""}`}
      style={style}
      aria-label={apps[id].label}
      onPointerDownCapture={() => focusApp(id)}
      onFocusCapture={() => focusApp(id)}
    >
      <header
        className="window-titlebar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onDoubleClick={(event) => {
          if (!(event.target as HTMLElement).closest("button")) setMaximized((value) => !value);
        }}
      >
        <span className="window-file">
          <Icon name={apps[id].icon} size={14} />
          {apps[id].file}
        </span>
        <div className="window-controls">
          <button onClick={() => minimizeApp(id)} disabled={!hydrated} aria-label={`Minimize ${apps[id].label}`}>
            <Icon name="minus" size={13} />
          </button>
          <button
            className="maximize-control"
            onClick={() => setMaximized((value) => !value)}
            disabled={!hydrated}
            aria-label={`${maximized ? "Restore" : "Maximize"} ${apps[id].label}`}
          >
            <Icon name={maximized ? "minimize" : "maximize"} size={12} />
          </button>
          <button onClick={() => closeApp(id)} disabled={!hydrated} aria-label={`Close ${apps[id].label}`}>
            <Icon name="close" size={14} />
          </button>
        </div>
      </header>
      <div className="window-body">{children}</div>
    </section>
  );
}
