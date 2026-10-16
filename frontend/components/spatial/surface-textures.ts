import * as THREE from "three";

// Small deterministic albedo rasters. No network requests or browser canvas are
// needed, so the same city also builds in headless simulation tests.
export function createSurfaceTextures() {
  let seed = 2718;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function raster(kind: "concrete" | "asphalt" | "brick") {
    const size = 128,
      data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const grit = random(),
          aggregate = random(),
          i = (y * size + x) * 4;
        let r = 0.83 + grit * 0.15,
          g = r,
          b = r;
        if (kind === "asphalt") r = g = b = 0.62 + grit * 0.3 + (aggregate > 0.975 ? 0.13 : 0);
        if (kind === "concrete") {
          const vein = Math.sin(x * 0.09 + Math.sin(y * 0.08) * 2) * Math.sin(y * 0.075);
          r = g = b = 0.82 + grit * 0.12 + vein * 0.035;
        }
        if (kind === "brick") {
          const row = Math.floor(y / 16),
            joint = (x + (row % 2) * 16) % 32;
          const mortar = y % 16 < 1.7 || joint < 1.4;
          r = mortar ? 0.73 : 0.68 + grit * 0.2;
          g = mortar ? 0.72 : 0.43 + grit * 0.12;
          b = mortar ? 0.68 : 0.31 + grit * 0.09;
        }
        data[i] = Math.min(255, r * 255);
        data[i + 1] = Math.min(255, g * 255);
        data[i + 2] = Math.min(255, b * 255);
        data[i + 3] = 255;
      }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }
  const concrete = raster("concrete"),
    asphalt = raster("asphalt"),
    brick = raster("brick");
  return {
    concrete,
    asphalt,
    brick,
    dispose: () => {
      concrete.dispose();
      asphalt.dispose();
      brick.dispose();
    },
  };
}
