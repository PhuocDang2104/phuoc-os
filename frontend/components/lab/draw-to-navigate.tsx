"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { prepareDigit, recognizeDigit } from "@/lib/digit-recognition";
import { useWorkstation } from "../shell";
import { Icon } from "../ui/icon";

const destinations = [
  "Work experience",
  "Selected projects",
  "Research & papers",
  "Awards & recognition",
  "Skills & stack",
  "Contact & résumé",
];
const shortLabels = ["Work", "Projects", "Research", "Awards", "Stack", "Contact"];

export default function DrawToNavigate() {
  const canvas = useRef<HTMLCanvasElement>(null),
    drawing = useRef(false),
    revision = useRef(0),
    navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { openApp } = useWorkstation(),
    router = useRouter();
  const [hasInk, setHasInk] = useState(false),
    [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof recognizeDigit>> | null>(null);
  const [message, setMessage] = useState("A small gesture. A new destination.");
  useEffect(
    () => () => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    },
    [],
  );
  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * event.currentTarget.width) / rect.width,
      y: ((event.clientY - rect.top) * event.currentTarget.height) / rect.height,
    };
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (busy || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    if (!hasInk) {
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.width = Math.round((rect.width / rect.height) * 280);
      event.currentTarget.height = 280;
    }
    const ctx = event.currentTarget.getContext("2d")!,
      p = point(event);
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
    setHasInk(true);
    setResult(null);
    setMessage("Looking good. Ready when you are.");
    revision.current++;
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const p = point(event),
      ctx = event.currentTarget.getContext("2d")!;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function stop() {
    drawing.current = false;
    if (hasInk) setMessage("Your mark is ready. Let’s read it.");
  }
  function clear() {
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
    revision.current++;
    const element = canvas.current!;
    element.getContext("2d")!.clearRect(0, 0, element.width, element.height);
    setHasInk(false);
    setResult(null);
    setMessage("A small gesture. A new destination.");
  }
  async function predict() {
    const input = prepareDigit(canvas.current!);
    if (!input) {
      setMessage("Draw a complete number from 1 to 6.");
      return;
    }
    const version = revision.current;
    setBusy(true);
    setMessage("Waking up a tiny neural network…");
    try {
      const prediction = await recognizeDigit(input);
      if (version !== revision.current) return;
      setResult(prediction);
      setMessage(
        prediction.digit < 1 || prediction.digit > 6
          ? "Try a number from 1 to 6."
          : prediction.confidence < 0.65
            ? "Not quite sure. Try drawing it again."
            : `Opening ${destinations[prediction.digit - 1]}…`,
      );
      if (prediction.digit >= 1 && prediction.digit <= 6 && prediction.confidence >= 0.65)
        navigationTimer.current = setTimeout(() => {
          if (revision.current === version) navigate(prediction.digit);
        }, 900);
    } catch {
      setMessage("Model unavailable. Pick a destination above, or retry.");
    } finally {
      setBusy(false);
    }
  }
  function navigate(digit: number) {
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
    if (digit === 1) router.push("/work");
    else if (digit === 2) openApp("gallery");
    else if (digit === 3) router.push("/research");
    else if (digit === 4) router.push("/awards");
    else if (digit === 5) openApp("stack");
    else if (digit === 6) openApp("contact");
  }
  const valid = result && result.digit >= 1 && result.digit <= 6 && result.confidence >= 0.65;
  return (
    <div className="draw-content">
      <div className="draw-heading">
        <div className="draw-heading-top">
          <span className="draw-wordmark">
            nav<span>.ai</span>
            <Icon name="spark" size={14} />
          </span>
          <span className="draw-local">
            <span className="status-dot" />
            ON-DEVICE
          </span>
        </div>
        <h2>Where to?</h2>
        <p>Draw a number. Follow your curiosity.</p>
      </div>
      <div className="draw-layout">
        <div className="draw-destinations">
          {destinations.map((label, i) => (
            <button
              key={label}
              onClick={() => navigate(i + 1)}
              aria-label={`${i + 1} ${label}`}
              className={result?.digit === i + 1 ? "is-predicted" : ""}
            >
              <span>{i + 1}</span>
              {shortLabels[i]}
              <Icon name="external" size={12} />
            </button>
          ))}
        </div>
        <div className="drawing-area">
          <div className={`drawing-canvas ${busy ? "is-processing" : ""}`}>
            <canvas
              ref={canvas}
              width={280}
              height={280}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={stop}
              onPointerCancel={stop}
              aria-label="Draw a number from 1 to 6; alternatively use the destination buttons"
            />
            {!hasInk && (
              <div className="canvas-placeholder">
                <svg viewBox="0 0 80 72" fill="none" aria-hidden="true">
                  <path
                    d="M24 20c24-20 51 0 18 16 39-6 26 35-12 20"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="m58 53 9 9m-9 0 9-9"
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity=".35"
                  />
                </svg>
                <span>YOUR TURN</span>
                <small>draw 1–6 · mouse or touch</small>
              </div>
            )}
            <span className="canvas-corner corner-tl" />
            <span className="canvas-corner corner-br" />
            <span className="canvas-grid-label">INPUT / 28 × 28</span>
          </div>
          <div className="drawing-actions">
            <button className="button button-quiet" onClick={clear} disabled={busy}>
              <Icon name="close" size={12} />
              Clear
            </button>
            <button className="button button-light" onClick={predict} disabled={!hasInk || busy}>
              {busy ? "Reading…" : "Recognize"}
              <Icon name="arrow" size={13} />
            </button>
          </div>
        </div>
      </div>
      <div className="inference-output" aria-live="polite">
        <div>
          <span className="accent">{busy ? "◌" : "↳"}</span> {message}
        </div>
        {result && (
          <div className="prediction-row">
            <span>
              prediction <strong>{result.digit}</strong>
            </span>
            <span>
              confidence <strong>{(result.confidence * 100).toFixed(1)}%</strong>
            </span>
            <span>
              inference <strong>{result.latency.toFixed(1)} ms</strong>
            </span>
            {valid && (
              <button onClick={() => navigate(result.digit)}>
                Open {destinations[result.digit - 1]} <Icon name="arrow" size={13} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="model-footer">
        <span>MNIST CNN · ONNX</span>
        <span>Your drawing stays here.</span>
      </div>
    </div>
  );
}
