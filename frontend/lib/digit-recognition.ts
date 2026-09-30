import type { InferenceSession } from "onnxruntime-web";

let sessionPromise: Promise<InferenceSession> | undefined;

// Crop, fit into MNIST's 20px box, then center by intensity-weighted mass.
export function prepareDigit(canvas: HTMLCanvasElement): Float32Array | null {
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  let left = width,
    right = 0,
    top = height,
    bottom = 0,
    ink = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 30) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        ink++;
      }
    }
  if (ink < 35 || right - left + bottom - top < 15) return null;
  const normalized = document.createElement("canvas");
  normalized.width = 28;
  normalized.height = 28;
  const ctx = normalized.getContext("2d", { willReadFrequently: true })!;
  const w = right - left + 1,
    h = bottom - top + 1,
    scale = 20 / Math.max(w, h);
  ctx.drawImage(
    canvas,
    left,
    top,
    w,
    h,
    (28 - w * scale) / 2,
    (28 - h * scale) / 2,
    w * scale,
    h * scale,
  );
  const pixels = ctx.getImageData(0, 0, 28, 28).data;
  let mass = 0,
    cx = 0,
    cy = 0;
  for (let i = 0; i < 784; i++) {
    const value = pixels[i * 4 + 3] / 255;
    mass += value;
    cx += (i % 28) * value;
    cy += Math.floor(i / 28) * value;
  }
  const dx = Math.round(13.5 - cx / mass),
    dy = Math.round(13.5 - cy / mass);
  const input = new Float32Array(784);
  for (let y = 0; y < 28; y++)
    for (let x = 0; x < 28; x++) {
      const sx = x - dx,
        sy = y - dy;
      if (sx >= 0 && sx < 28 && sy >= 0 && sy < 28)
        input[y * 28 + x] = pixels[(sy * 28 + sx) * 4 + 3] / 255;
    }
  return input;
}

export async function recognizeDigit(input: Float32Array) {
  const ort = await import("onnxruntime-web/wasm");
  ort.env.wasm.wasmPaths = "/ort/";
  ort.env.wasm.numThreads = 1;
  if (!sessionPromise)
    sessionPromise = ort.InferenceSession.create("/models/mnist.onnx", {
      executionProviders: ["wasm"],
    }).catch((error) => {
      sessionPromise = undefined;
      throw error;
    });
  const session = await sessionPromise;
  const start = performance.now();
  const output = await session.run({
    [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 1, 28, 28]),
  });
  const latency = performance.now() - start;
  const logits = Array.from(output[session.outputNames[0]].data as Float32Array);
  const max = Math.max(...logits),
    exp = logits.map((value) => Math.exp(value - max)),
    sum = exp.reduce((a, b) => a + b, 0);
  return { digit: logits.indexOf(max), confidence: exp[logits.indexOf(max)] / sum, latency };
}
