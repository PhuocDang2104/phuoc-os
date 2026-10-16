import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";

test("Segmentation keeps its outer layer while the cursor core shows surface normals", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop two-layer hover; the mobile mode renderer is checked separately.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?spatialDebug=1");
  await expect(page.locator(".spatial-experience")).toHaveAttribute("data-ready", "true", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Focus scene", exact: true }).click();
  const canvas = page.locator(".spatial-canvas");
  const box = (await canvas.boundingBox())!;
  const x = box.x + box.width * 0.59,
    y = box.y + box.height * 0.45;
  const pixels = () =>
    canvas.evaluate(
      (node: HTMLCanvasElement, point) => {
        const rect = node.getBoundingClientRect(),
          image = document.createElement("canvas");
        image.width = 40;
        image.height = 80;
        const context = image.getContext("2d")!;
        for (let i = 0; i < 2; i++)
          context.drawImage(
            node,
            ((point.x - rect.x - 20) / rect.width) * node.width,
            ((point.y - rect.y - 20 + i * 110) / rect.height) * node.height,
            (40 / rect.width) * node.width,
            (40 / rect.height) * node.height,
            0,
            i * 40,
            40,
            40,
          );
        return Array.from(context.getImageData(0, 0, 40, 80).data);
      },
      { x, y },
    );
  await page.mouse.move(x, y);
  await page.waitForTimeout(250);
  const centered = await pixels();
  await page.mouse.move(x + 110, y);
  await page.waitForTimeout(250);
  const shifted = await pixels();
  const difference = (start: number, end: number) => {
    let sum = 0;
    for (let i = start; i < end; i += 4)
      sum +=
        Math.abs(centered[i] - shifted[i]) +
        Math.abs(centered[i + 1] - shifted[i + 1]) +
        Math.abs(centered[i + 2] - shifted[i + 2]);
    return sum / (((end - start) / 4) * 3);
  };
  expect(difference(0, 40 * 40 * 4)).toBeGreaterThan(8);
  expect(difference(40 * 40 * 4, centered.length)).toBeLessThan(1);
  await expect(page.locator(".spatial-renderer")).toHaveAttribute("data-visible-point-count", "0");
});

test("the real 3D scene renders distinct perception modes and retains the desk", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?spatialDebug=1");
  const experience = page.getByRole("region", { name: "Interactive spatial intelligence scene" });
  await expect(experience).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  await expect(experience).toHaveAttribute("data-mode", "segments");
  await page.getByRole("button", { name: "Focus scene", exact: true }).click();
  const modes = page.getByRole("group", { name: "Research areas" }).getByRole("button");
  await expect(modes.nth(0)).toHaveText("Segmentation");
  await expect(modes.nth(1)).toHaveText("3D & Object");
  await expect(page.getByRole("region", { name: "About me", exact: true })).toBeHidden();
  const rendered = page.locator(".spatial-renderer"),
    canvas = page.locator(".spatial-canvas");
  await expect(rendered).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Full analysis", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Boxes", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "LiDAR", exact: true })).toHaveCount(0);
  const sample = () =>
    canvas.evaluate((node: HTMLCanvasElement) => {
      const target = document.createElement("canvas");
      target.width = 100;
      target.height = 70;
      const context = target.getContext("2d")!;
      context.drawImage(node, 0, 0, 100, 70);
      const pixels = context.getImageData(0, 0, 100, 70).data;
      let sum = 0;
      for (let i = 0; i < pixels.length; i += 4)
        sum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      return sum / (100 * 70);
    });
  await page.mouse.move(10, 10);
  const dark = await sample();
  expect(dark).toBeLessThan(100);
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(rendered).toHaveAttribute("data-theme", "light");
  await expect.poll(sample).toBeGreaterThan(dark + 90);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(rendered).toHaveAttribute("data-theme", "dark");
  const hashes = new Set<string>();
  for (const [name, mode] of [
    ["3D & Object", "normal"],
    ["Segmentation", "segments"],
    ["Depth", "depth"],
    ["Sensor Fusion", "lidar"],
    ["Control & SLAM", "control"],
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(rendered).toHaveAttribute("data-mode", mode);
    await expect(page.getByRole("img", { name: `${name} illustration` })).toBeVisible();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.52);
    await page.waitForTimeout(100);
    hashes.add(
      createHash("sha256")
        .update(await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()))
        .digest("hex"),
    );
    if (mode === "normal") expect(await sample()).toBeGreaterThan(dark + 1);
    if (mode === "lidar") await expect(rendered).toHaveAttribute("data-sensor-count", "40");
    if (mode === "normal") {
      await expect(rendered).toHaveAttribute("data-visible-point-count", "0");
      expect(
        await page.locator('.spatial-projected-object[data-category="building"]').count(),
      ).toBe(0);
    }
    if (mode === "control") {
      await expect
        .poll(async () => +(await rendered.getAttribute("data-vector-count"))!)
        .toBeGreaterThan(0);
      expect(+(await rendered.getAttribute("data-vector-count"))!).toBeLessThanOrEqual(40);
    }
  }
  expect(hashes.size).toBe(5);
  await page.getByRole("button", { name: "3D & Object", exact: true }).click();
  await expect(rendered).toHaveAttribute("data-vector-count", "0");
  await page.getByRole("button", { name: "Return to desk", exact: true }).click();
  await expect(page.getByRole("region", { name: "About me", exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("pointer reveal fades back to clay, geometry is pickable, and context loss can recover", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Desktop hover; touch mode and mobile controls are checked separately.");
  await page.goto("/?spatialDebug=1");
  await expect(page.locator(".spatial-experience")).toHaveAttribute("data-ready", "true", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Focus scene", exact: true }).click();
  await page.getByRole("button", { name: "Pause traffic", exact: true }).click();
  const canvas = page.locator(".spatial-canvas");
  await page.mouse.move(10, 10);
  await page.waitForTimeout(2100);
  const pixels = () =>
    canvas.evaluate((node: HTMLCanvasElement) => {
      const image = document.createElement("canvas");
      image.width = 240;
      image.height = 150;
      const context = image.getContext("2d")!;
      context.drawImage(node, 0, 0, 240, 150);
      return Array.from(context.getImageData(0, 0, 240, 150).data);
    });
  const difference = (a: number[], b: number[]) => {
    let sum = 0;
    for (let i = 0; i < a.length; i += 4)
      sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    return sum / ((a.length / 4) * 3);
  };
  const clay = await pixels();
  await page.mouse.move(900, 400, { steps: 8 });
  await page.waitForTimeout(250);
  const revealed = difference(clay, await pixels());
  expect(revealed).toBeGreaterThan(2);
  await page.mouse.move(10, 10);
  await page.waitForTimeout(2100);
  // Milo now belongs to WebGL and can move between captures. Its small silhouette
  // may differ; the much larger perception region must return to the clay view.
  expect(difference(clay, await pixels())).toBeLessThan(Math.min(1.8, revealed * 0.3));
  await page.getByRole("button", { name: "Control & SLAM", exact: true }).click();
  await page.mouse.move(720, 460, { steps: 6 });
  const captions = page.locator(".spatial-object-caption");
  await expect
    .poll(() =>
      captions.evaluateAll(
        (nodes) =>
          nodes.filter(
            (node) =>
              node.textContent?.startsWith("CAR_") &&
              Number(getComputedStyle(node.parentElement!).opacity) > 0.5 &&
              getComputedStyle(node).display !== "none",
          ).length,
      ),
    )
    .toBeGreaterThan(0);
  const target = await captions.evaluateAll((nodes) => {
    const node = nodes.find(
      (node) =>
        node.textContent?.startsWith("CAR_") &&
        Number(getComputedStyle(node.parentElement!).opacity) > 0.5 &&
        getComputedStyle(node).display !== "none",
    )!;
    const rect = node.parentElement!.getBoundingClientRect();
    return {
      id: node.textContent!.split(" · ")[0],
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  });
  await page.mouse.click(target.x + target.width / 2, target.y + target.height * 0.65);
  await expect(page.getByRole("complementary", { name: "Scene object inspector" })).toContainText(
    target.id,
  );
  const lost = await canvas.evaluate((node: HTMLCanvasElement) => {
    const extension = node.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    extension?.loseContext();
    return !!extension;
  });
  if (lost) {
    await expect(page.locator(".spatial-error")).toContainText("unavailable");
    await page.getByRole("button", { name: "Retry 3D" }).click();
    await expect(page.locator(".spatial-experience")).toHaveAttribute("data-ready", "true", {
      timeout: 30000,
    });
  }
});

test("actor inspection keeps its identity through camera changes and supports pause", async ({
  page,
}) => {
  await page.goto("/?spatialDebug=1");
  await expect(page.locator(".spatial-experience")).toHaveAttribute("data-ready", "true", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Focus scene", exact: true }).click();
  await page.getByLabel("Inspect scene actor").selectOption("CAR_004");
  const inspector = page.getByRole("complementary", { name: "Scene object inspector" });
  await expect(inspector).toContainText("CAR_004");
  await expect(inspector).toContainText("COMPUTED DISTANCES");
  for (const view of ["top", "street", "isometric"]) {
    await page.getByRole("button", { name: `${view} view`, exact: true }).click();
    await expect(page.locator(".spatial-renderer")).toHaveAttribute("data-view", view);
    await expect(inspector).toContainText("CAR_004");
  }
  await page.getByRole("button", { name: "Pause traffic", exact: true }).click();
  await expect(page.locator(".spatial-renderer")).toHaveAttribute("data-paused", "true");
  await page.getByRole("button", { name: "Play traffic", exact: true }).click();
  await expect(page.locator(".spatial-renderer")).toHaveAttribute("data-paused", "false");
  await page.getByRole("button", { name: "Clear scene selection" }).click();
  await expect(inspector).toHaveCount(0);
});

test("WebGL failure preserves navigation and shows an honest fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2" || type === "webgl") return null;
      return original.apply(this, [type, ...args] as never);
    } as typeof original;
  });
  await page.goto("/?spatialDebug=1");
  await expect(page.locator(".spatial-error")).toContainText("WebGL is unavailable", {
    timeout: 30000,
  });
  await expect(page.getByRole("button", { name: "Retry 3D" })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Research", exact: true })
    .click();
  await expect(page).toHaveURL(/\/research$/);
  await expect(page.getByRole("searchbox", { name: "Search research articles" })).toBeVisible();
});
