"use client";

import dynamic from "next/dynamic";
import { useRef, type TouchEvent, type WheelEvent } from "react";
import { apps, workspaces, type AppId, type WorkspaceId } from "@/lib/portfolio";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";
import { AppWindow } from "./window";
import { AppContent } from "./app-content";
import { NeuralField } from "./neural-field";

const NeuralCore = dynamic(() => import("./neural-core"), {
  ssr: false,
  loading: () => <div className="core-loading mono">Assembling the core…</div>,
});
const profileApps: AppId[] = ["about", "journey", "current", "gallery", "resume", "contact"];
const labApps: AppId[] = ["draw", "research", "stack", "experiments", "notes"];

export function Desktop() {
  const { workspace, setWorkspace, windows, openApp, openCommand } = useWorkstation();
  const lastWheel = useRef(0);
  const wheelTotal = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const visible = windows.filter((w) => !w.minimized && apps[w.id].workspace === workspace);
  // Keep DOM order stable while z-index changes, otherwise pointer capture and
  // in-progress clicks are lost when React moves a window to the front.
  const appOrder = Object.keys(apps);
  const renderOrder = [...visible].sort((a, b) => appOrder.indexOf(a.id) - appOrder.indexOf(b.id));
  const minimized = windows.filter((w) => w.minimized && apps[w.id].workspace === workspace);
  function onWheel(event: WheelEvent) {
    if (
      Math.abs(event.deltaX) < Math.abs(event.deltaY) ||
      Math.abs(event.deltaX) < 8 ||
      (event.target as HTMLElement).closest(".app-window, button, dialog")
    )
      return;
    if (Date.now() - lastWheel.current > 350) wheelTotal.current += event.deltaX;
    if (Math.abs(wheelTotal.current) > 75 && Date.now() - lastWheel.current > 900) {
      setWorkspace(
        Math.min(2, Math.max(0, workspace + Math.sign(wheelTotal.current))) as WorkspaceId,
      );
      lastWheel.current = Date.now();
      wheelTotal.current = 0;
    }
  }
  function onTouchStart(event: TouchEvent) {
    if ((event.target as HTMLElement).closest("canvas, .app-window, button, a")) return;
    touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  function onTouchEnd(event: TouchEvent) {
    if (!touch.current) return;
    const dx = event.changedTouches[0].clientX - touch.current.x,
      dy = event.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)
      setWorkspace(Math.min(2, Math.max(0, workspace + (dx < 0 ? 1 : -1))) as WorkspaceId);
    touch.current = null;
  }
  return (
    <main
      id="main"
      className={`desktop workspace-${workspace}`}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {workspace !== 2 && <NeuralField />}
      <div className="workspace-context">
        <div className="context-path">
          <Icon name="terminal" size={14} />
          <span>phuoc@workspace</span>
          <span className="muted">~ /</span>
          <strong>{workspace === 0 ? "home" : workspace === 1 ? "lab" : "core"}</strong>
        </div>
        <button className="quick-view" onClick={() => openApp("quick")}>
          <Icon name="scan" size={15} /> Here for the overview?{" "}
          <span>
            Start here <Icon name="external" size={13} />
          </span>
        </button>
      </div>
      {workspace !== 2 ? (
        <>
          <div className="desktop-intro">
            <div>
              <div className="intro-eyebrow">
                <span className="accent-line" />
                <span>{workspaces[workspace].label}</span>
              </div>
              <h1>
                {workspace === 0 ? (
                  <>
                    Building intelligence,
                    <br />
                    <span>from models to machines.</span>
                  </>
                ) : (
                  <>
                    A workspace for <span className="accent">what if.</span>
                    <br />
                    <span>Draw. Explore. Discover.</span>
                  </>
                )}
              </h1>
            </div>
            <div className="intro-aside">
              <span className="tiny-label">PERSONAL ENGINEERING WORKSTATION</span>
              <p>
                {workspace === 0 ? (
                  <>
                    Part engineer. Part researcher.
                    <br />
                    Always building.
                  </>
                ) : (
                  <>
                    Small experiments.
                    <br />
                    Real things happening.
                  </>
                )}
              </p>
              <span className="mono muted">
                {workspace === 0 ? "EST. IN CURIOSITY ↗" : "LOCAL INFERENCE / ZERO UPLOADS"}
              </span>
            </div>
          </div>
          <nav className="app-launcher" aria-label="Desktop apps">
            {(workspace === 0 ? profileApps : labApps).map((id) => (
              <button
                key={id}
                className={`desktop-icon ${visible.some((w) => w.id === id) ? "is-open" : ""}`}
                onClick={() => openApp(id)}
                title={`Open ${apps[id].label}`}
              >
                <span className="desktop-icon-art">
                  <Icon name={apps[id].icon} size={25} />
                  <span className="file-fold" />
                </span>
                <span>{apps[id].label}</span>
                {visible.some((w) => w.id === id) && <i />}
              </button>
            ))}
          </nav>
          <div className="window-stage">
            {renderOrder.map((window) => (
              <AppWindow
                key={window.id}
                id={window.id}
                index={windows.findIndex((w) => w.id === window.id)}
                focused={visible.at(-1)?.id === window.id}
              >
                <AppContent id={window.id} />
              </AppWindow>
            ))}
            {visible.length === 0 && (
              <div className="empty-desktop">
                <Icon name="terminal" size={30} />
                <h2>A little room to think.</h2>
                <p>Open an app from the left, or pick up where you left off.</p>
                <button
                  className="button"
                  onClick={() => openApp(workspace === 0 ? "about" : "draw")}
                >
                  Open {workspace === 0 ? "About me" : "Draw to navigate"}{" "}
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            )}
          </div>
          <div className="desktop-watermark" aria-hidden="true">
            PHUOC.OS
          </div>
          <div className="desktop-note">
            <span className="crosshair">+</span>
            <span>
              A living workspace.
              <br />
              <span className="muted">Make yourself at home.</span>
            </span>
          </div>
        </>
      ) : (
        <NeuralCore />
      )}
      {minimized.length > 0 && (
        <div className="minimized-tray" aria-label="Minimized windows">
          {minimized.map((w) => (
            <button key={w.id} onClick={() => openApp(w.id)}>
              <Icon name={apps[w.id].icon} size={13} />
              {apps[w.id].file}
              <Icon name="maximize" size={11} />
            </button>
          ))}
        </div>
      )}
      <div className="workspace-bottom">
        <div className="workspace-counter mono">
          <span>{workspaces[workspace].number}</span> / 03 <span className="counter-line" />{" "}
          {workspaces[workspace].name}
        </div>
        <nav className="workspace-dock" aria-label="Workspaces">
          {workspaces.map((item, index) => (
            <button
              key={item.name}
              onClick={() => setWorkspace(index as WorkspaceId)}
              aria-current={workspace === index ? "step" : undefined}
              aria-label={`Open ${item.name} workspace`}
            >
              <span className={index === 2 ? "dock-diamond" : "dock-dot"} />
              <span>{item.name}</span>
              <small>0{index + 1}</small>
            </button>
          ))}
        </nav>
        <button className="navigation-hint" onClick={openCommand}>
          <kbd>⌘</kbd>
          <kbd>K</kbd>
          <span>Find your way</span>
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {workspaces[workspace].name} workspace
      </span>
    </main>
  );
}
