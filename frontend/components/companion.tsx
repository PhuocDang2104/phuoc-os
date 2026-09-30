"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWorkstation } from "./shell";
import { Icon } from "./ui/icon";
import { CatArt } from "./milo/cat-art";
import { useCatMotion } from "./milo/use-cat-motion";
import { askMilo, checkMiloConnection, type ChatLine } from "@/lib/milo-chat";

const suggestions = ["What is Phuoc building?", "Tell me about NAV.AI", "How can I contact Phuoc?"];

export function Companion() {
  const { workspace, openApp, reducedMotion, windows } = useWorkstation();
  const pathname = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState<"checking" | "ready" | "offline">("checking");
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressPet = useRef(false);
  const gallery =
    pathname === "/" && workspace === 0 && windows.some((w) => w.id === "gallery" && !w.minimized);
  const { body, action, speech } = useCatMotion({
    reducedMotion,
    paused: open,
    context: `${pathname}:${workspace}:${gallery}`,
  });

  function show() {
    returnFocus.current = document.activeElement as HTMLElement;
    setOpen(true);
  }
  useEffect(() => {
    const listener = () => {
      returnFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
    };
    window.addEventListener("milo:chat", listener);
    return () => window.removeEventListener("milo:chat", listener);
  }, []);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    checkMiloConnection(controller.signal).then((ready) => {
      if (!controller.signal.aborted) setConnection(ready ? "ready" : "offline");
    });
    return () => controller.abort();
  }, [open]);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);
  useLayoutEffect(() => {
    if (!open) return;
    const element = dialog.current!;
    const place = () => {
      const anchor = body.current!.getBoundingClientRect();
      element.style.left = `${Math.max(12, Math.min(innerWidth - element.offsetWidth - 12, anchor.left + anchor.width / 2 - element.offsetWidth / 2))}px`;
      const above = anchor.top - element.offsetHeight - 12;
      const below = anchor.bottom + 8;
      element.style.top = `${Math.max(45, Math.min(innerHeight - element.offsetHeight - 12, above > 42 ? above : below))}px`;
    };
    element.showModal();
    place();
    input.current?.focus();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      element.close();
      requestAnimationFrame(() => {
        if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
      });
    };
  }, [open, body]);

  function navigate(run: () => void) {
    run();
    setOpen(false);
  }
  async function send(value = prompt) {
    const content = value.trim();
    if (!content || busy) return;
    setPrompt("");
    const next: ChatLine[] = [...messages.filter((line) => !line.error), { role: "user", content }];
    setMessages(next);
    setBusy(true);
    try {
      const reply = await askMilo(next);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      setConnection("ready");
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: (error as Error).message, error: true },
      ]);
      setConnection("offline");
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }
  function dragStart(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    suppressPet.current = false;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function dragMove(event: PointerEvent<HTMLButtonElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    if (!start.moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) {
      start.moved = true;
      suppressPet.current = true;
      window.dispatchEvent(
        new CustomEvent("milo:drag-start", { detail: { x: start.x, y: start.y } }),
      );
    }
    if (start.moved)
      window.dispatchEvent(
        new CustomEvent("milo:drag-move", { detail: { x: event.clientX, y: event.clientY } }),
      );
  }
  function dragEnd(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id !== event.pointerId) return;
    if (drag.current.moved) window.dispatchEvent(new Event("milo:drag-end"));
    drag.current = null;
  }

  return (
    <>
      <div
        ref={body}
        className={`milo action-${action}${open ? " milo-paused" : ""}`}
        data-action={action}
      >
        <span className="milo-shadow" aria-hidden="true" />
        <button
          className="milo-pet"
          aria-label="Pet or drag Milo"
          onPointerDown={dragStart}
          onPointerMove={dragMove}
          onPointerUp={dragEnd}
          onPointerCancel={dragEnd}
          onClick={() => {
            if (suppressPet.current) {
              suppressPet.current = false;
              return;
            }
            window.dispatchEvent(new Event("milo:pet"));
          }}
          title="Click to pet · drag to move"
        >
          <span className="milo-orientation">
            <span className="milo-direction">
              <CatArt action={action} />
            </span>
          </span>
        </button>
        {speech && !open && (
          <button
            className="milo-bubble"
            onClick={show}
            aria-label={`Milo says: ${speech} Open assistant`}
          >
            <span className="milo-bubble-name">milo.os</span>
            {speech}
            <Icon name="external" size={10} />
          </button>
        )}
        <button
          className="milo-chat-handle"
          onClick={show}
          aria-label="Open Milo chat"
          title="Ask Milo"
        >
          <span>···</span>
        </button>
      </div>
      {open && (
        <dialog
          ref={dialog}
          className="milo-dialog milo-chat"
          aria-label="Milo workspace assistant"
          onCancel={() => setOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="milo-dialog-header">
            <span>
              <Icon name="cat" size={15} />
              milo.os <small>resident intelligence</small>
            </span>
            <button className="icon-button" onClick={() => setOpen(false)} aria-label="Close Milo">
              <Icon name="close" size={14} />
            </button>
          </div>
          <div className="milo-chat-status mono" data-ready={connection === "ready"}>
            <span className="status-dot" />
            {connection === "ready" ? "GROQ CONNECTED" : "GROQ READY WHEN CONFIGURED"}
          </div>
          <div className="milo-transcript" ref={transcript} aria-live="polite">
            <div className="milo-message assistant">
              <span>milo</span>
              <p>Hi, I’m Milo. Ask me about Phuoc’s work, research, or this little workspace.</p>
            </div>
            {messages.map((line, index) => (
              <div
                key={index}
                className={`milo-message ${line.role}${line.error ? " is-error" : ""}`}
              >
                <span>{line.role === "user" ? "you" : line.error ? "connection" : "milo"}</span>
                <p>{line.content}</p>
              </div>
            ))}
            {busy && (
              <div className="milo-message assistant milo-typing">
                <span>milo</span>
                <p aria-label="Milo is thinking">···</p>
              </div>
            )}
          </div>
          {messages.length === 0 && (
            <div className="milo-prompts" aria-label="Suggested questions">
              {suggestions.map((suggestion) => (
                <button key={suggestion} onClick={() => send(suggestion)}>
                  {suggestion} <Icon name="arrow" size={11} />
                </button>
              ))}
            </div>
          )}
          <div className="milo-chat-links">
            <button onClick={() => navigate(() => router.push("/work"))}>Work ↗</button>
            <button onClick={() => navigate(() => router.push("/research"))}>Research ↗</button>
            <button onClick={() => navigate(() => openApp("draw"))}>NAV.AI ↗</button>
            <button onClick={() => navigate(() => openApp("resume"))}>Résumé ↗</button>
          </div>
          <form
            className="milo-command"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <span>❯</span>
            <input
              ref={input}
              aria-label="Ask Milo anything"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask Milo anything…"
              maxLength={1800}
              autoComplete="off"
            />
            <button
              type="submit"
              aria-label="Send Milo a message"
              disabled={!prompt.trim() || busy}
            >
              <Icon name="arrow" size={14} />
            </button>
          </form>
          <div className="milo-chat-note mono">
            Responses use Groq when the backend is connected.
          </div>
        </dialog>
      )}
    </>
  );
}
