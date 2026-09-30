"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { apps, profile, sections, type AppId, type WorkspaceId } from "@/lib/portfolio";
import { Icon } from "./ui/icon";
import { CommandPalette } from "./command-palette";
import { Companion } from "./companion";
import { AppWindow } from "./desktop/window";
import { AppContent } from "./desktop/app-content";

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
  hydrated: boolean;
};
const Context = createContext<Workstation | null>(null);
const subscribeHydration = () => () => {};
const clientHydration = () => true;
const serverHydration = () => false;
export function useWorkstation() {
  const value = useContext(Context);
  if (!value) throw new Error("Workstation provider missing");
  return value;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribeHydration, clientHydration, serverHydration);
  const [workspace, updateWorkspace] = useState<WorkspaceId>(0);
  const [windows, setWindows] = useState<WindowState[]>([
    { id: "about", minimized: false },
    { id: "journey", minimized: false },
    { id: "gallery", minimized: false },
  ]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const storedTheme = () => {
      const saved = localStorage.getItem("phuoc-theme");
      if (saved === "light") setTheme("light");
      document.documentElement.dataset.theme = saved === "light" ? "light" : "dark";
    };
    storedTheme();
  }, []);

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
        previous.some((w) => w.id === "research")
          ? previous
          : [...previous, { id: "research", minimized: false }, { id: "stack", minimized: false }],
      );
  }, []);
  const openApp = useCallback(
    (id: AppId) => {
      setWindows((previous) => [...previous.filter((w) => w.id !== id), { id, minimized: false }]);
      if (id !== "contact") {
        setWorkspace(apps[id].workspace);
        if (pathname !== "/") router.push("/");
      }
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
  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      localStorage.setItem("phuoc-theme", next);
      window.dispatchEvent(new Event("phuoc:theme"));
      setTheme(next);
    };
    if (!reducedMotion && "startViewTransition" in document) document.startViewTransition(apply);
    else apply();
  }, [theme, reducedMotion]);

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
      if (event.key === "Escape") {
        const top = windows.findLast((w) => !w.minimized && (w.id === "contact" || w.id === "draw" || (pathname === "/" && apps[w.id].workspace === workspace)));
        if (top) closeApp(top.id);
      }
      if (pathname !== "/") return;
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
      hydrated,
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
      hydrated,
    ],
  );
  return (
    <Context.Provider value={value}>
      <div
        className={`os-shell ${pathname === "/" ? "is-home" : ""} ${reducedMotion ? "reduce-motion" : ""}`}
        data-hydrated={hydrated}
      >
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <header className="topbar">
          <Link href="/" className="wordmark" aria-label="PHUOC.OS home">
            <span className="brand-symbol">
              p<span>_</span>
            </span>
            <span>Dang Nhu Phuoc</span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation" inert={!hydrated}>
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
            <button className="nav-contact" onClick={() => openApp("contact")} disabled={!hydrated}>
              Contact <Icon name="arrow" size={12} />
            </button>
          </nav>
          <div className="topbar-tools">
            <button
              className="icon-button overview-trigger"
              onClick={() => openApp("certifications")}
              disabled={!hydrated}
              aria-label="Open certifications"
              title="Certifications"
            >
              <Icon name="award" size={14} />
            </button>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="icon-button social-link"
              aria-label="GitHub"
              title="GitHub"
            >
              <Icon name="github" size={14} />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="icon-button social-link"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <Icon name="linkedin" size={14} />
            </a>
            <span className="topbar-divider" />
            <button className="resume-link" onClick={() => openApp("resume")} disabled={!hydrated}>
              <Icon name="file" size={13} /> Résumé
            </button>
            <button
              className="icon-button"
              aria-label="Talk to Milo, the workspace companion"
              title="Ask Milo"
              onClick={() => window.dispatchEvent(new Event("milo:chat"))}
              disabled={!hydrated}
            >
              <Icon name="cat" size={15} />
            </button>
            <button
              className="icon-button theme-toggle"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-pressed={theme === "light"}
              title={`${theme === "dark" ? "Light" : "Dark"} mode`}
              onClick={toggleTheme}
              disabled={!hydrated}
            >
              <Icon name="sun" size={15} className="theme-sun" />
              <Icon name="moon" size={15} className="theme-moon" />
            </button>
            <button
              onClick={toggleMotion}
              aria-pressed={reducedMotion}
              className="icon-button motion-toggle"
              aria-label={`Motion ${reducedMotion ? "off" : "on"}`}
              title={`Motion ${reducedMotion ? "off" : "on"}`}
              disabled={!hydrated}
            >
              <Icon name={reducedMotion ? "play" : "pause"} size={13} />
            </button>
            <button
              className="command-trigger"
              aria-label="Open command palette"
              onClick={openCommand}
              disabled={!hydrated}
            >
              <Icon name="command" size={13} />
              <span>K</span>
            </button>
            <span className="topbar-availability">
              <span className="status-dot" />
              AVAILABLE
            </span>
            <time className="topbar-clock" suppressHydrationWarning>
              {time}
              <span>[VIE]</span>
            </time>
          </div>
        </header>
        {children}
        {windows.some((item) => item.id === "draw" && !item.minimized) && (
          <div className="global-window-layer">
            <AppWindow
              id="draw"
              index={windows.findIndex((item) => item.id === "draw")}
              focused={windows.at(-1)?.id === "draw"}
            >
              <AppContent id="draw" />
            </AppWindow>
          </div>
        )}
        {windows.some((item) => item.id === "contact" && !item.minimized) && (
          <div className="global-window-layer contact-window-layer">
            <AppWindow id="contact" index={windows.findIndex((item) => item.id === "contact")} focused={windows.at(-1)?.id === "contact"}>
              <AppContent id="contact" />
            </AppWindow>
          </div>
        )}
        <Companion />
        {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} />}
      </div>
    </Context.Provider>
  );
}
