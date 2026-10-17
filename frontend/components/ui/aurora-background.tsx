"use client";

import { useEffect, useRef } from "react";

// The supplied aurora's layered repeating gradients, difference blend and radial mask,
// expressed in the site's native CSS rather than introducing a second styling system.
export function AuroraBackground({ showRadialGradient = true }: { showRadialGradient?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const visibility = () => {
      if (root.current) root.current.dataset.paused = String(document.hidden);
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  return (
    <div
      ref={root}
      className={`aurora-background${showRadialGradient ? " aurora-masked" : ""}`}
      aria-hidden="true"
    >
      <div className="aurora-field" />
    </div>
  );
}
