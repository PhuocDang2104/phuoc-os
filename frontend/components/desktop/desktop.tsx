"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { apps, type AppId } from "@/lib/portfolio";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";
import { AppWindow } from "./window";
import { AppContent } from "./app-content";
import { WorkGallery } from "./work-gallery";

const SpatialExperience = dynamic(() => import("../spatial/spatial-experience"), { ssr: false });
const profileApps: AppId[] = ["about", "gallery", "draw", "resume", "journey", "certifications"];
const appOrder = Object.keys(apps);

export function Desktop() {
  const { windows, openApp, hydrated } = useWorkstation();
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const showDesk = () => setFocused(false);
    const showScene = () => setFocused(true);
    window.addEventListener("phuoc:open-app", showDesk);
    window.addEventListener("phuoc:focus-scene", showScene);
    return () => {
      window.removeEventListener("phuoc:open-app", showDesk);
      window.removeEventListener("phuoc:focus-scene", showScene);
    };
  }, []);
  const visible = windows.filter((window) => !window.minimized);
  const galleryOpen = visible.some((window) => window.id === "gallery");
  // Keep DOM order stable while focus changes, preserving pointer capture during drag.
  const renderOrder = visible
    .filter((window) => !["gallery", "draw", "contact"].includes(window.id))
    .sort((a, b) => appOrder.indexOf(a.id) - appOrder.indexOf(b.id));
  const minimized = windows.filter((window) => window.minimized);
  return (
    <main
      id="main"
      className={`desktop workspace-0${galleryOpen && !focused ? " has-gallery" : ""}${focused ? " is-scene-focused" : ""}`}
      tabIndex={0}
    >
      <h1 className="sr-only">Dang Nhu Phuoc — personal engineering workspace</h1>
      <SpatialExperience focused={focused} onToggleFocus={() => setFocused((value) => !value)} />
      <nav className="app-launcher" aria-label="Desktop apps">
        {profileApps.map((id) => (
          <button
            key={id}
            className={`desktop-file ${visible.some((window) => window.id === id) ? "is-open" : ""}`}
            onClick={() => openApp(id)}
            disabled={!hydrated}
            title={`Open ${apps[id].label}`}
          >
            <Icon name={id === "gallery" ? "folder" : "file"} size={14} />
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
            index={windows.findIndex((item) => item.id === window.id)}
            focused={visible.at(-1)?.id === window.id}
          >
            <AppContent id={window.id} />
          </AppWindow>
        ))}
      </div>
      {galleryOpen && !focused && <WorkGallery />}
      {minimized.length > 0 && (
        <div className="minimized-tray" aria-label="Minimized windows">
          {minimized.map((window) => (
            <button key={window.id} onClick={() => openApp(window.id)}>
              <Icon name={apps[window.id].icon} size={12} />
              {apps[window.id].file}
              <Icon name="maximize" size={10} />
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
