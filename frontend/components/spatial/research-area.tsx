import type { ScanMode } from "./config";
import { Icon } from "../ui/icon";

const areas: { mode: ScanMode; label: string; icon: string }[] = [
  { mode: "segments", label: "Segmentation", icon: "shapes" },
  { mode: "normal", label: "3D & Object", icon: "box" },
  { mode: "depth", label: "Depth", icon: "layers" },
  { mode: "lidar", label: "Sensor Fusion", icon: "radar" },
  { mode: "control", label: "Control & SLAM", icon: "route" },
];

function ResearchIllustration({ mode }: { mode: ScanMode }) {
  return (
    <svg
      key={mode}
      className={`research-illustration research-${mode}`}
      viewBox="0 0 96 80"
      role="img"
      aria-label={`${areas.find((area) => area.mode === mode)!.label} illustration`}
    >
      <path
        className="research-art-grid"
        d="m8 49 40-23 40 23-40 23ZM8 39l40 23 40-23M28 37l40 23M48 26v46M68 37 28 60"
      />
      {mode === "normal" && (
        <g>
          <path d="m22 39 25-14 27 15-26 15Z" fill="currentColor" fillOpacity=".5" />
          <path d="m22 39 26 16v13L22 53Z" fill="currentColor" fillOpacity=".24" />
          <path d="m48 55 26-15v13L48 68Z" fill="currentColor" fillOpacity=".7" />
          <path d="m34 38 14-8 14 8-14 8Z" fill="currentColor" fillOpacity=".9" />
          <path
            d="M29 19v-5h10M58 14h10v7M29 60v8h10M59 68h9v-8"
            fill="none"
            stroke="currentColor"
          />
        </g>
      )}
      {mode === "lidar" && (
        <g fill="none" stroke="currentColor">
          <ellipse cx="48" cy="48" rx="31" ry="18" />
          <ellipse cx="48" cy="48" rx="20" ry="12" />
          <path d="M48 48V16m0 32 27-16M48 48 22 33" />
          {Array.from({ length: 18 }, (_, i) => (
            <circle
              key={i}
              cx={18 + ((i * 17) % 60)}
              cy={24 + ((i * 13) % 38)}
              r="1"
              fill="currentColor"
            />
          ))}
        </g>
      )}
      {mode === "segments" && (
        <g stroke="currentColor" strokeWidth="1">
          <path d="m19 43 29-17 29 17-29 17Z" fill="currentColor" fillOpacity=".45" />
          <path d="m19 43 29 17v12L19 55Z" fill="currentColor" fillOpacity=".18" />
          <path d="m48 60 29-17v12L48 72Z" fill="currentColor" fillOpacity=".65" />
          <path d="m31 36 17-10 16 9-17 10Z" fill="currentColor" fillOpacity=".8" />
          <path d="m47 45 17-10 13 8-16 9Z" fill="currentColor" fillOpacity=".3" />
        </g>
      )}
      {mode === "depth" && (
        <g fill="none" stroke="currentColor">
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`m${19 + i * 6} ${48 - i * 6} 29-17 29 17-29 17Z`}
              opacity={0.3 + i * 0.2}
            />
          ))}
          <path d="M48 12v58" strokeDasharray="2 4" />
          <circle cx="48" cy="32" r="3" fill="currentColor" />
        </g>
      )}
      {mode === "control" && (
        <g fill="none" stroke="currentColor">
          <path d="m25 45 16-9 22 13-16 9Zm0 0v7l22 13 16-9v-7M47 58v7" />
          <path
            d="m43 40 26-15m-9 0h9l-4 8M32 52 17 61m3-7-3 7h8M64 59l18 10m-4-8 4 8h-8"
            stroke="currentColor"
          />
          <circle cx="43" cy="40" r="2" fill="currentColor" />
        </g>
      )}
    </svg>
  );
}

export function ResearchArea({
  mode,
  onChange,
}: {
  mode: ScanMode;
  onChange: (mode: ScanMode) => void;
}) {
  return (
    <div className="spatial-controls spatial-mode-controls research-area">
      <header>
        <span className="research-area-mark" aria-hidden="true">
          <Icon name="scan" size={16} />
        </span>
        <h2>My Research Area</h2>
        <span className="research-area-index mono">
          0{areas.findIndex((area) => area.mode === mode) + 1} / 05
        </span>
      </header>
      <div className="research-area-body">
        <ResearchIllustration mode={mode} />
        <div className="research-area-options" role="group" aria-label="Research areas">
          {areas.map((area) => (
            <button
              key={area.mode}
              aria-pressed={mode === area.mode}
              className={area.mode === "control" ? "research-control-option" : undefined}
              onClick={() => onChange(area.mode)}
            >
              <Icon name={area.icon} size={13} />
              {area.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
