"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWorkstation } from "./shell";
import { Icon } from "./ui/icon";

const pixels = [
  "     aa       aa      ",
  "     aba     aba      ",
  "     abbaaaabba       ",
  "     abbbbbbbba       ",
  "    abbbbbbbbbba      ",
  "    abbcbbbcbbba      ",
  "    abbcbbbcbbba      ",
  "    abbbbbbbbbba      ",
  "     abbbdbbbba       ",
  "      abbbbba         ",
  "     abbbbbbba        ",
  "     abbbbbbba        ",
  "    abbbbbbbbba       ",
  "    abbbbbbbbba       ",
  "    abbbbbbbbba       ",
  "     abbbaabba        ",
  "     abba abba        ",
  "     aaaa aaaa        ",
];
const palette: Record<string, string> = { a: "#96929f", b: "#d2cddc", c: "#38313f", d: "#b8a7ff" };

function PixelCat({ sleeping }: { sleeping: boolean }) {
  return (
    <svg viewBox="0 0 28 24" className="pixel-cat" shapeRendering="crispEdges" aria-hidden="true">
      <g className="cat-tail">
        <path d="M18 20h5v-2h2v-6h-2v5h-2v1h-3z" fill="#96929f" />
        <path d="M18 19h4v-2h1v-4h1v5h-2v2h-4z" fill="#d2cddc" />
      </g>
      <g className="cat-body">
        {pixels.flatMap((row, y) =>
          [...row].map((pixel, x) =>
            pixel !== " " ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y + 3}
                width="1"
                height="1"
                fill={
                  sleeping && pixel === "c" ? (y === 5 ? palette.b : palette.c) : palette[pixel]
                }
              />
            ) : null,
          ),
        )}
        <rect className="cat-blink" x="7" y="8" width="8" height="2" fill="#d2cddc" />
      </g>
      {sleeping && (
        <text x="19" y="7" fill="#b8a7ff" fontSize="5">
          z
        </text>
      )}
    </svg>
  );
}

export function Companion() {
  const { workspace, openApp, reducedMotion, windows } = useWorkstation();
  const pathname = usePathname(),
    router = useRouter();
  const [position, setPosition] = useState(83);
  const [facing, setFacing] = useState(1);
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState("");
  const [sleeping, setSleeping] = useState(false);
  const [hop, setHop] = useState(false);
  const [moving, setMoving] = useState(false);
  const [popupLeft, setPopupLeft] = useState(20);
  const button = useRef<HTMLButtonElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const activity = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const scheduled = timers.current;
    activity.current = Date.now();
    const move = (event: PointerEvent) => {
      activity.current = Date.now();
      setSleeping(false);
      const rect = button.current?.getBoundingClientRect();
      if (rect && Math.hypot(event.clientX - rect.left, event.clientY - rect.top) < 150)
        setFacing(event.clientX > rect.left + 25 ? 1 : -1);
    };
    const click = (event: PointerEvent) => {
      if (reducedMotion || event.target === button.current) return;
      const rect = button.current?.getBoundingClientRect();
      if (rect && Math.hypot(event.clientX - rect.left, event.clientY - rect.top) < 110) {
        setHop(true);
        timers.current.push(setTimeout(() => setHop(false), 350));
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click);
    const interval = setInterval(() => {
      if (document.hidden || open || reducedMotion) return;
      if (Date.now() - activity.current > 55000) {
        setSleeping(true);
        return;
      }
      setPosition((previous) => {
        const next = Math.max(65, Math.min(87, previous + (Math.random() - 0.5) * 18));
        setFacing(next > previous ? 1 : -1);
        return next;
      });
      setMoving(true);
      timers.current.push(setTimeout(() => setMoving(false), 5000));
    }, 14000);
    return () => {
      clearInterval(interval);
      scheduled.forEach(clearTimeout);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
    };
  }, [open, reducedMotion]);
  useEffect(() => {
    if (open || reducedMotion) return;
    const hints =
      workspace === 0
        ? [
            "Psst. The windows move.",
            "Need the fast route? Ctrl + K.",
            "A little curious? Visit the AI Lab.",
          ]
        : workspace === 1
          ? ["Draw a number. See where it leads.", "All inference stays on your device."]
          : ["Every idea leads somewhere.", "Pick a cluster. Follow your curiosity."];
    let hide: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      if (document.hidden) return;
      setHint(hints[Math.floor(Math.random() * hints.length)]);
      hide = setTimeout(() => setHint(""), 4500);
    }, 19000);
    return () => {
      clearInterval(interval);
      clearTimeout(hide);
    };
  }, [workspace, open, reducedMotion, pathname]);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      const rect = button.current!.getBoundingClientRect();
      setPopupLeft(Math.max(12, Math.min(innerWidth - 322, rect.left - 220)));
    }
  }, [open]);
  const action = (run: () => void) => {
    run();
    setOpen(false);
  };
  return (
    <div
      className={`companion ${moving && !open ? "is-walking" : ""} ${hop ? "is-hopping" : ""}`}
      style={{ "--cat-position": `${position}%`, "--cat-facing": facing } as CSSProperties}
      data-window-count={windows.length}
    >
      {hint && !open && <div className="cat-hint">{hint}</div>}
      <button
        ref={button}
        className="cat-button"
        onClick={() => {
          setOpen((value) => !value);
          setHint("");
        }}
        aria-label="Talk to Milo, the workspace companion"
        aria-expanded={open}
      >
        <PixelCat sleeping={sleeping} />
        <span className="cat-name">
          milo<span className="accent">.os</span>
        </span>
      </button>
      {open && (
        <dialog
          ref={dialog}
          className="cat-dialog"
          style={{ left: popupLeft }}
          onCancel={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          aria-label="Milo workspace assistant"
        >
          <div className="cat-dialog-content">
            <div className="cat-dialog-header">
              <span>
                <span className="status-dot" /> MILO.OS
              </span>
              <button
                className="icon-button"
                onClick={() => setOpen(false)}
                aria-label="Close Milo"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
            <h3>A little help finding your way?</h3>
            <p>I live here. I know a few shortcuts.</p>
            <button className="cat-overview" onClick={() => action(() => openApp("quick"))}>
              <Icon name="scan" size={17} />
              <span>Give me the quick overview</span>
              <Icon name="arrow" size={14} />
            </button>
            <div className="cat-shortcuts">
              {["Work", "Research", "Blog", "Awards"].map((label) => (
                <button
                  key={label}
                  onClick={() => action(() => router.push(`/${label.toLowerCase()}`))}
                >
                  {label}
                  <Icon name="external" size={13} />
                </button>
              ))}
              <button onClick={() => action(() => openApp("resume"))}>
                Résumé
                <Icon name="file" size={13} />
              </button>
              <button onClick={() => action(() => openApp("contact"))}>
                Contact
                <Icon name="mail" size={13} />
              </button>
            </div>
            <div className="cat-dialog-footer mono">Your local guide. A cat of few words.</div>
          </div>
        </dialog>
      )}
    </div>
  );
}
