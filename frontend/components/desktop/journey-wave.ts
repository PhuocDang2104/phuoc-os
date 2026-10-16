// Isometric voxel ripples follow the very same trajectory as the travelling light.
// A small transparent canvas keeps the portrait window independent of WebGL.
export function createJourneyWave(canvas: HTMLCanvasElement, path: SVGPathElement) {
  const context = canvas.getContext("2d");
  if (!context) return { draw: () => {}, dispose: () => {} };
  const ctx = context;
  let width = 1,
    height = 1,
    cells: { x: number; y: number; distance: number; fraction: number }[] = [];
  function resize() {
    const rect = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 1.5);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const length = path.getTotalLength(),
      samples = Array.from({ length: 161 }, (_, i) => {
        const p = path.getPointAtLength((length * i) / 160);
        return { x: (p.x / 500) * width, y: (p.y / 500) * height, fraction: i / 160 };
      });
    cells = [];
    for (let y = 5; y < height; y += 9)
      for (let x = 5; x < width; x += 9) {
        let distance = Infinity,
          fraction = 0;
        for (const point of samples) {
          const d = Math.hypot(x - point.x, y - point.y);
          if (d < distance) {
            distance = d;
            fraction = point.fraction;
          }
        }
        if (distance < 49) cells.push({ x, y, distance, fraction });
      }
  }
  function polygon(points: number[][], color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return {
    draw(progress: number, time: number, opacity: number) {
      ctx.clearRect(0, 0, width, height);
      const light = document.documentElement.dataset.theme === "light";
      for (const cell of cells) {
        const age = progress - cell.fraction;
        if (age < -0.018 || age > 0.2) continue;
        const envelope = Math.max(0, 1 - Math.abs(age) / 0.2) * (1 - cell.distance / 49);
        const ripple = (Math.sin(cell.distance * 0.2 - age * 54 + time * 0.0018) + 1) * 0.5;
        const lift = (1 + ripple * 9) * envelope;
        if (lift < 0.4) continue;
        const x = cell.x,
          y = cell.y,
          w = 2.3,
          d = 1.4;
        ctx.globalAlpha = envelope * opacity * (light ? 0.35 : 0.5);
        polygon(
          [
            [x - w, y],
            [x, y + d],
            [x, y + d - lift],
            [x - w, y - lift],
          ],
          light ? "#8c74aa" : "#68547f",
        );
        polygon(
          [
            [x, y + d],
            [x + w, y],
            [x + w, y - lift],
            [x, y + d - lift],
          ],
          light ? "#ad94c4" : "#ac8ed2",
        );
        polygon(
          [
            [x - w, y - lift],
            [x, y - d - lift],
            [x + w, y - lift],
            [x, y + d - lift],
          ],
          light ? "#74518d" : "#dcc4f4",
        );
      }
      ctx.globalAlpha = 1;
    },
    dispose() {
      observer.disconnect();
      ctx.clearRect(0, 0, width, height);
    },
  };
}
