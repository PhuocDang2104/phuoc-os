"use client";

import dynamic from "next/dynamic";
import { useRef, type TouchEvent, type WheelEvent } from "react";
import { apps, workspaces, type AppId, type WorkspaceId } from "@/lib/portfolio";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";
import { AppWindow } from "./window";
import { AppContent } from "./app-content";
import { NeuralField } from "./neural-field";
import { WorkGallery } from "./work-gallery";

const NeuralCore = dynamic(() => import("./neural-core"), {
  ssr: false,
  loading: () => <span className="sr-only">Opening neural core</span>,
});
const profileApps: AppId[] = [
  "about",
  "gallery",
  "draw",
  "resume",
  "journey",
  "certifications",
  "current",
  "contact",
];
const labApps: AppId[] = ["draw", "research", "stack", "experiments", "notes"];
const appOrder = Object.keys(apps);

export function Desktop() {
  const { workspace, setWorkspace, windows, openApp, hydrated } = useWorkstation();
  const lastWheel = useRef(0);
  const wheelTotal = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const visible = windows.filter((w) => !w.minimized && apps[w.id].workspace === workspace);
  const galleryOpen = visible.some((w) => w.id === "gallery");
  // Stable DOM order preserves pointer capture while the focused window's z-index changes.
  const renderOrder = visible
    .filter((w) => w.id !== "gallery" && w.id !== "draw")
    .sort((a, b) => appOrder.indexOf(a.id) - appOrder.indexOf(b.id));
  const minimized = windows.filter((w) => w.minimized && apps[w.id].workspace === workspace);

  function onWheel(event: WheelEvent) {
    if (
      Math.abs(event.deltaX) < Math.abs(event.deltaY) ||
      Math.abs(event.deltaX) < 8 ||
      (event.target as HTMLElement).closest(".app-window, .work-gallery, button, dialog")
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
    if ((event.target as HTMLElement).closest("canvas, .app-window, .work-gallery, button, a"))
      return;
    touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  function onTouchEnd(event: TouchEvent) {
    if (!touch.current) return;
    const dx = event.changedTouches[0].clientX - touch.current.x;
    const dy = event.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)
      setWorkspace(Math.min(2, Math.max(0, workspace + (dx < 0 ? 1 : -1))) as WorkspaceId);
    touch.current = null;
  }
  return (
    <main
      id="main"
      className={`desktop workspace-${workspace}${galleryOpen ? " has-gallery" : ""}`}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h1 className="sr-only">Dang Nhu Phuoc — personal engineering workspace</h1>
      {workspace !== 2 ? (
        <>
          <NeuralField />
          <nav className="app-launcher" aria-label="Desktop apps">
            {(workspace === 0 ? profileApps : labApps).map((id) => (
              <button
                key={id}
                className={`desktop-file ${visible.some((w) => w.id === id) ? "is-open" : ""}`}
                onClick={() => openApp(id)}
                disabled={!hydrated}
                title={`Open ${apps[id].label}`}
              >
                <Icon
                  name={id === "gallery" || id === "experiments" ? "folder" : "file"}
                  size={14}
                />
                <span>{apps[id].label}</span>
                <span className="file-open-indicator" />
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
          </div>
        </>
      ) : (
        <NeuralCore />
      )}
      {galleryOpen && <WorkGallery />}
      {minimized.length > 0 && (
        <div className="minimized-tray" aria-label="Minimized windows">
          {minimized.map((w) => (
            <button key={w.id} onClick={() => openApp(w.id)}>
              <Icon name={apps[w.id].icon} size={12} />
              {apps[w.id].file}
              <Icon name="maximize" size={10} />
            </button>
          ))}
        </div>
      )}
      <nav className="workspace-dock" aria-label="Workspaces">
        {workspaces.map((item, index) => (
          <button
            key={item.name}
            onClick={() => setWorkspace(index as WorkspaceId)}
            disabled={!hydrated}
            aria-current={workspace === index ? "step" : undefined}
            aria-label={`Open ${item.name} workspace`}
            title={item.name}
          >
            <span className={index === 2 ? "dock-diamond" : "dock-dot"} />
          </button>
        ))}
      </nav>
      <span className="sr-only" aria-live="polite">
        {workspaces[workspace].name} workspace
      </span>
    </main>
  );
}
