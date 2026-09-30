"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apps, profile, sections, type AppId, type WorkspaceId } from "@/lib/portfolio";
import { Icon } from "./ui/icon";
import { CommandPalette } from "./command-palette";
import { Companion } from "./companion";

export type WindowState = { id: AppId; minimized: boolean };
type Workstation = {
  workspace: WorkspaceId;
  setWorkspace: (id: WorkspaceId) => void;
  windows: WindowState[];
  openApp: (id: AppId) => void;
  closeApp: (id: AppId) => void;
  minimizeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  openCommand: () => void;
  reducedMotion: boolean;
  toggleMotion: () => void;
};
const Context = createContext<Workstation | null>(null);
export function useWorkstation() {
  const value = useContext(Context);
  if (!value) throw new Error("Workstation provider missing");
  return value;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspace, updateWorkspace] = useState<WorkspaceId>(0);
  const [windows, setWindows] = useState<WindowState[]>([
    { id: "about", minimized: false },
    { id: "snapshot", minimized: false },
  ]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: profile.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () =>
      setReducedMotion(media.matches || localStorage.getItem("phuoc-motion") === "reduced");
    update();
    syncMotion();
    media.addEventListener("change", syncMotion);
    const interval = setInterval(update, 15000);
    return () => {
      clearInterval(interval);
      media.removeEventListener("change", syncMotion);
    };
  }, []);

  const setWorkspace = useCallback((id: WorkspaceId) => {
    updateWorkspace(id);
    if (id === 1)
      setWindows((previous) =>
        previous.some((w) => w.id === "draw")
          ? previous
          : [...previous, { id: "draw", minimized: false }, { id: "stack", minimized: false }],
      );
  }, []);
  const openApp = useCallback(
    (id: AppId) => {
      setWindows((previous) => [...previous.filter((w) => w.id !== id), { id, minimized: false }]);
      setWorkspace(apps[id].workspace);
      if (pathname !== "/") router.push("/");
    },
    [pathname, router, setWorkspace],
  );
  const closeApp = useCallback(
    (id: AppId) => setWindows((previous) => previous.filter((w) => w.id !== id)),
    [],
  );
  const minimizeApp = useCallback(
    (id: AppId) =>
      setWindows((previous) => previous.map((w) => (w.id === id ? { ...w, minimized: true } : w))),
    [],
  );
  const focusApp = useCallback(
    (id: AppId) =>
      setWindows((previous) => {
        const target = previous.find((w) => w.id === id);
        return target && previous.at(-1)?.id !== id
          ? [...previous.filter((w) => w.id !== id), target]
          : previous;
      }),
    [],
  );
  const openCommand = useCallback(() => setCommandOpen(true), []);
  const toggleMotion = useCallback(
    () =>
      setReducedMotion((previous) => {
        localStorage.setItem("phuoc-motion", !previous ? "reduced" : "full");
        return !previous;
      }),
    [],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }
      if (
        document.querySelector("dialog[open]") ||
        (event.target as HTMLElement).closest("input, textarea, select, [contenteditable]")
      )
        return;
      if (pathname !== "/") return;
      if (event.key === "Escape") {
        const top = windows.findLast((w) => !w.minimized && apps[w.id].workspace === workspace);
        if (top) closeApp(top.id);
      }
      if (
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        !(event.target as HTMLElement).closest("button, a, canvas")
      ) {
        event.preventDefault();
        setWorkspace(
          Math.max(
            0,
            Math.min(2, workspace + (event.key === "ArrowRight" ? 1 : -1)),
          ) as WorkspaceId,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, windows, workspace, closeApp, setWorkspace]);

  const value = useMemo(
    () => ({
      workspace,
      setWorkspace,
      windows,
      openApp,
      closeApp,
      minimizeApp,
      focusApp,
      openCommand,
      reducedMotion,
      toggleMotion,
    }),
    [
      workspace,
      setWorkspace,
      windows,
      openApp,
      closeApp,
      minimizeApp,
      focusApp,
      openCommand,
      reducedMotion,
      toggleMotion,
    ],
  );
  return (
    <Context.Provider value={value}>
      <div className={`os-shell ${reducedMotion ? "reduce-motion" : ""}`}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <header className="topbar">
          <Link href="/" className="wordmark" aria-label="PHUOC.OS home">
            <span className="brand-symbol">
              p<span>_</span>
            </span>
            <span>
              PHUOC<span className="muted">.OS</span>
              <sup>v.01</sup>
            </span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
              Home
            </Link>
            {Object.entries(sections).map(([key, section]) => (
              <Link
                key={key}
                href={`/${key}`}
                aria-current={pathname === `/${key}` ? "page" : undefined}
              >
                {section.label}
              </Link>
            ))}
          </nav>
          <div className="topbar-tools">
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="icon-button social-link"
              aria-label="GitHub"
            >
              <Icon name="github" size={17} />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="icon-button social-link"
              aria-label="LinkedIn"
            >
              <Icon name="linkedin" size={17} />
            </a>
            <span className="topbar-divider" />
            <button className="resume-link" onClick={() => openApp("resume")}>
              Résumé <Icon name="external" size={14} />
            </button>
            <button
              className="command-trigger"
              aria-label="Open command palette"
              onClick={openCommand}
            >
              <Icon name="command" size={13} />
              <span>K</span>
            </button>
          </div>
        </header>
        {children}
        <footer className="statusbar">
          <div>
            <span className="status-dot" /> All systems curious{" "}
            <span className="status-separator">/</span>
            <span className="footer-location">Based in Vietnam</span>
          </div>
          <span className="footer-center">CRAFTED WITH INTENTION. BUILT TO EXPLORE.</span>
          <div>
            <button onClick={toggleMotion} aria-pressed={reducedMotion} className="motion-toggle">
              Motion {reducedMotion ? "off" : "on"}
              <span className={reducedMotion ? "switch" : "switch active"} />
            </button>
            <span className="status-separator">/</span>
            <time suppressHydrationWarning>
              {time} <span className="muted">ICT</span>
            </time>
          </div>
        </footer>
        <Companion />
        {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} />}
      </div>
    </Context.Provider>
  );
}
