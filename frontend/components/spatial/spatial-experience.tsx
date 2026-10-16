"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";
import {
  DEFAULT_SPATIAL_SETTINGS,
  SPATIAL_CONFIG,
  type ActorSnapshot,
  type CameraView,
  type SpatialSettings,
} from "./config";
import { SpatialEngine } from "./engine";
import { BUILDINGS } from "./world";
import { ResearchArea } from "./research-area";

function CityFallback() {
  const point = (x: number, y: number, z: number) =>
    `${500 + (x - z) * 4.3},${345 + (x + z) * 2.05 - y * 4.3}`;
  return (
    <svg
      className="spatial-fallback"
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="1000" height="700" fill="#f3f3ee" />
      <path
        d={`M${point(-90, 0, -7)} ${point(90, 0, -7)} ${point(90, 0, 7)} ${point(-90, 0, 7)}Z M${point(-7, 0, -80)} ${point(7, 0, -80)} ${point(7, 0, 80)} ${point(-7, 0, 80)}Z`}
        fill="#e0e3dc"
      />
      {[...BUILDINGS]
        .sort((a, b) => a[0] + a[1] - b[0] - b[1])
        .map(([x, z, w, d, h], index) => (
          <g key={index} stroke="#d9dcd3" strokeWidth=".6">
            <path
              d={`M${point(x - w / 2, 0, z + d / 2)} ${point(x + w / 2, 0, z + d / 2)} ${point(x + w / 2, h, z + d / 2)} ${point(x - w / 2, h, z + d / 2)}Z`}
              fill="#d9ded4"
            />
            <path
              d={`M${point(x + w / 2, 0, z - d / 2)} ${point(x + w / 2, 0, z + d / 2)} ${point(x + w / 2, h, z + d / 2)} ${point(x + w / 2, h, z - d / 2)}Z`}
              fill="#e7e9e2"
            />
            <path
              d={`M${point(x - w / 2, h, z - d / 2)} ${point(x + w / 2, h, z - d / 2)} ${point(x + w / 2, h, z + d / 2)} ${point(x - w / 2, h, z + d / 2)}Z`}
              fill="#fbfbf7"
            />
          </g>
        ))}
    </svg>
  );
}

export default function SpatialExperience({
  focused,
  onToggleFocus,
}: {
  focused: boolean;
  onToggleFocus: () => void;
}) {
  const { reducedMotion } = useWorkstation();
  const host = useRef<HTMLDivElement>(null),
    labels = useRef<HTMLDivElement>(null),
    inspector = useRef<HTMLDivElement>(null),
    engine = useRef<SpatialEngine | null>(null);
  const [settings, setSettings] = useState<SpatialSettings>(DEFAULT_SPATIAL_SETTINGS);
  const settingsRef = useRef(settings);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [snapshot, setSnapshot] = useState<ActorSnapshot | null>(null);
  const select = useCallback(
    (id: string | null) => setSettings((previous) => ({ ...previous, selected: id })),
    [],
  );
  const view = useCallback((view: CameraView) => {
    engine.current?.resetCamera(view);
    setSettings((previous) => ({ ...previous, view }));
  }, []);
  const togglePause = useCallback(
    () => setSettings((previous) => ({ ...previous, paused: !previous.paused })),
    [],
  );
  useEffect(() => {
    try {
      const events = host.current!.closest<HTMLElement>(".desktop")!;
      const instance = new SpatialEngine(
        host.current!,
        events,
        labels.current!,
        inspector.current!,
        {
          onReady: () => setReady(true),
          onError: setError,
          onSelect: select,
          onSnapshot: setSnapshot,
          onView: view,
          onPause: togglePause,
        },
      );
      engine.current = instance;
      instance.setSettings(settingsRef.current);
      return () => {
        instance.dispose();
        engine.current = null;
      };
    } catch {
      queueMicrotask(() =>
        setError("WebGL is unavailable on this device. Your workspace is still ready."),
      );
    }
  }, [retry, select, view, togglePause]);
  useEffect(() => {
    settingsRef.current = settings;
    engine.current?.setSettings({ ...settings, reducedMotion });
  }, [settings, reducedMotion, ready]);
  return (
    <section
      className={`spatial-experience ${focused ? "is-focused" : ""} ${error ? "has-fallback" : ""}`}
      aria-label="Interactive spatial intelligence scene"
      data-ready={ready && !error}
      data-mode={settings.mode}
      data-boxes={settings.boxes}
    >
      {(!ready || error) && <CityFallback />}
      <div className="spatial-renderer" ref={host} />
      <div className="spatial-label-layer" ref={labels} />
      <ResearchArea
        mode={settings.mode}
        onChange={(mode) =>
          setSettings((previous) => ({
            ...previous,
            mode,
            labels: mode === "normal" || mode === "control" || mode === "lidar",
          }))
        }
      />
      <div className="spatial-controls spatial-camera-controls">
        <div role="group" aria-label="Camera view">
          {(["isometric", "top", "street"] as CameraView[]).map((item, index) => (
            <button
              key={item}
              aria-label={`${item} view`}
              aria-pressed={settings.view === item}
              onClick={() => view(item)}
            >
              <small>{index + 1}</small>
              {item === "isometric" ? "ISO" : item.toUpperCase()}
            </button>
          ))}
        </div>
        <button className="spatial-focus-button" aria-pressed={focused} onClick={onToggleFocus}>
          <Icon name={focused ? "minimize" : "maximize"} size={12} />
          {focused ? "Return to desk" : "Focus scene"}
        </button>
      </div>
      <div ref={inspector} className="spatial-inspector-anchor">
        {snapshot && settings.selected && (
          <aside className="spatial-inspector" aria-label="Scene object inspector">
            <header>
              <span>
                <i />
                {snapshot.status.toUpperCase()}
              </span>
              <span>{snapshot.id}</span>
              <button
                aria-label="Clear scene selection"
                onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
                onClick={() => select(null)}
              >
                <Icon name="close" size={14} />
              </button>
            </header>
            <div className="spatial-inspector-title">
              <small>SCENE TRACK / {snapshot.subtype.toUpperCase()}</small>
              <h2>
                {snapshot.status === "waiting"
                  ? "Holding at the signal"
                  : snapshot.status === "crossing"
                    ? "Crossing the junction"
                    : snapshot.category === "pedestrian"
                      ? "Following the sidewalk"
                      : "Moving through the city"}
              </h2>
            </div>
            <dl>
              {[
                ["SPEED", `${snapshot.speed} km/h`],
                ["ACCEL", `${snapshot.acceleration} m/s²`],
                ["STEER", `${snapshot.steering}° / ${snapshot.turn}`],
                ["HEADING", `${snapshot.heading}°`],
                ["PATH", snapshot.lane],
                ["SIGNAL", snapshot.signal],
                ["NEAREST", `${snapshot.nearest} m`],
                ["FROM JUNCTION", `${snapshot.range} m`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <footer className="mono">SCRIPTED MOTION / COMPUTED DISTANCES</footer>
          </aside>
        )}
      </div>
      <div className="spatial-footer">
        <span className="spatial-source mono">
          <i />
          {error ? "FALLBACK VIEW" : "SIMULATED SCENE"}
        </span>
        <span className="spatial-hint mono">
          {ready && !error ? (
            <>
              <span className="spatial-hint-desktop">
                Move to scan · Click to inspect · Drag to orbit · Ctrl + wheel to zoom
              </span>
              <span className="spatial-hint-touch">
                Touch to scan · Tap a subject · Use views above
              </span>
            </>
          ) : (
            "Preparing the spatial world"
          )}
        </span>
        <div className="spatial-footer-actions">
          <label className="spatial-actor-picker">
            <Icon name="user" size={12} />
            <select
              aria-label="Inspect scene actor"
              value={settings.selected ?? ""}
              onChange={(event) => select(event.target.value || null)}
            >
              <option value="">Inspect subject</option>
              {Array.from(
                {
                  length: SPATIAL_CONFIG.world.vehicleCount + SPATIAL_CONFIG.world.pedestrianCount,
                },
                (_, index) => {
                  const pedestrian = index >= SPATIAL_CONFIG.world.vehicleCount,
                    id = `${pedestrian ? "PED" : "CAR"}_${String(pedestrian ? index - SPATIAL_CONFIG.world.vehicleCount + 1 : index + 1).padStart(3, "0")}`;
                  return (
                    <option value={id} key={id}>
                      {id}
                    </option>
                  );
                },
              )}
            </select>
          </label>
          <button
            aria-label={settings.paused ? "Play traffic" : "Pause traffic"}
            onClick={togglePause}
            aria-pressed={settings.paused}
          >
            <Icon name={settings.paused ? "play" : "pause"} size={13} />
          </button>
        </div>
      </div>
      {error && (
        <div className="spatial-error mono">
          <span>{error}</span>
          <button
            onClick={() => {
              setError("");
              setReady(false);
              setRetry((value) => value + 1);
            }}
          >
            Retry 3D <Icon name="arrow" size={12} />
          </button>
        </div>
      )}
    </section>
  );
}
