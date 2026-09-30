import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mkdir, readdir, copyFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("onnxruntime-web"));
const target = new URL("../public/ort/", import.meta.url);
await mkdir(target, { recursive: true });
for (const name of await readdir(dist)) {
  if (/^ort-wasm-simd-threaded\.(wasm|mjs)$/.test(name)) {
    await copyFile(join(dist, name), new URL(name, target));
  }
}
