"use client";

import { useRef, useState, type PointerEvent } from "react";
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

export default function DrawToNavigate() {
  const canvas = useRef<HTMLCanvasElement>(null),
    drawing = useRef(false),
    revision = useRef(0);
  const { openApp } = useWorkstation(),
    router = useRouter();
  const [hasInk, setHasInk] = useState(false),
    [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof recognizeDigit>> | null>(null);
  const [message, setMessage] = useState("waiting_for_input...");
  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * 280) / rect.width,
      y: ((event.clientY - rect.top) * 280) / rect.height,
    };
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (busy || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
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
    setMessage("drawing...");
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
    if (hasInk) setMessage("ready_to_recognize");
  }
  function clear() {
    revision.current++;
    canvas.current!.getContext("2d")!.clearRect(0, 0, 280, 280);
    setHasInk(false);
    setResult(null);
    setMessage("waiting_for_input...");
  }
  async function predict() {
    const input = prepareDigit(canvas.current!);
    if (!input) {
      setMessage("Draw a complete number from 1 to 6.");
      return;
    }
    const version = revision.current;
    setBusy(true);
    setMessage("loading_model_and_processing...");
    try {
      const prediction = await recognizeDigit(input);
      if (version !== revision.current) return;
      setResult(prediction);
      setMessage(
        prediction.digit < 1 || prediction.digit > 6
          ? "Try a number from 1 to 6."
          : prediction.confidence < 0.65
            ? "Not quite sure. Try drawing it again."
            : "prediction_ready — your call.",
      );
    } catch {
      setMessage("Model unavailable. Use a destination on the left, or retry.");
    } finally {
      setBusy(false);
    }
  }
  function navigate(digit: number) {
    if (digit === 1 || digit === 2) router.push("/work");
    else if (digit === 3) router.push("/research");
    else if (digit === 4) router.push("/awards");
    else if (digit === 5) openApp("stack");
    else if (digit === 6) openApp("contact");
  }
  const valid = result && result.digit >= 1 && result.digit <= 6 && result.confidence >= 0.65;
  return (
    <div className="draw-content">
      <div className="draw-heading">
        <span className="eyebrow">
          <Icon name="spark" size={13} /> THE HANDWRITTEN SHORTCUT
        </span>
        <h2>A number. A new direction.</h2>
        <p>Draw a digit from 1 to 6. Let a tiny neural network find your way.</p>
      </div>
      <div className="draw-layout">
        <div className="draw-destinations">
          {destinations.map((label, i) => (
            <button key={label} onClick={() => navigate(i + 1)}>
              <span>{i + 1}</span>
              {label}
              <Icon name="external" size={12} />
            </button>
          ))}
          <p className="draw-fallback">You can click a destination, too.</p>
        </div>
        <div className="drawing-area">
          <div className="drawing-canvas">
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
                <span>✎</span>
                <span>DRAW HERE</span>
                <small>mouse or touch</small>
              </div>
            )}
            <span className="canvas-corner corner-tl" />
            <span className="canvas-corner corner-br" />
          </div>
          <div className="drawing-actions">
            <button className="button button-quiet" onClick={clear} disabled={busy}>
              Clear
            </button>
            <button className="button button-light" onClick={predict} disabled={!hasInk || busy}>
              {busy ? "Thinking…" : "Recognize"}
              <Icon name="spark" size={13} />
            </button>
          </div>
        </div>
      </div>
      <div className="inference-output" aria-live="polite">
        <div>
          <span className="accent">❯</span> {message}
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
        <span>
          <span className="status-dot" /> MNIST CNN · ONNX Runtime
        </span>
        <span>In your browser. No data uploaded.</span>
      </div>
    </div>
  );
}
