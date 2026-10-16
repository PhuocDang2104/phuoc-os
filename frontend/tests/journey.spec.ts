import { test, expect } from "@playwright/test";

test("Journey keeps four chapters on one descending trajectory and opens chapter details", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const log = page.locator(".journey-log-experience");
  await expect(log).toHaveAttribute("data-intro", "done");
  await expect(log.locator(".j-view-switch,.j-network-soft,.j-orbit,.j-scroll")).toHaveCount(0);
  const chapters = log.locator(".j-star-node");
  await expect(chapters).toHaveCount(4);
  for (const chapter of await chapters.all()) await expect(chapter).toBeVisible();
  const viewport = (await log.locator(".j-constellation").boundingBox())!;
  const firstNode = (await chapters.first().boundingBox())!;
  expect(firstNode.y - viewport.y).toBeLessThan(viewport.height * 0.09);
  const lastNode = (await chapters.last().boundingBox())!;
  expect(lastNode.y + lastNode.height).toBeLessThanOrEqual(viewport.y + viewport.height + 2);
  const window = page.getByRole("region", { name: "Journey", exact: true }),
    bounds = (await window.boundingBox())!;
  expect(bounds.width / bounds.height).toBeCloseTo(9 / 16, 2);
  const trajectory = log.locator(".j-trajectory");
  await expect(trajectory).toHaveCount(1);
  expect(
    await trajectory.evaluate((node: SVGPathElement) => {
      const length = node.getTotalLength();
      let last = -Infinity;
      for (let i = 0; i <= 80; i++) {
        const point = node.getPointAtLength((length * i) / 80);
        if (point.y < last - 0.01) return false;
        last = point.y;
      }
      return true;
    }),
  ).toBe(true);
  await log.getByRole("button", { name: "2023 HCMUT FOUNDATION", exact: true }).click();
  const details = log.getByRole("complementary", { name: "HCMUT chapter" });
  await expect(details).toContainText("Ho Chi Minh City University of Technology");
  const logo = log.getByRole("img", { name: "HCMUT logo" });
  expect(await logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(30);
  await log.getByRole("button", { name: "Close chapter details" }).click();
  await log.getByRole("button", { name: "2026 MLIoT Lab RESEARCH", exact: true }).click();
  await log.getByRole("link", { name: "Explore research", exact: true }).click();
  await expect(page).toHaveURL(/\/research$/);
});

test("Journey ignition is contained, flows down the path, and supports replay", async ({
  page,
}) => {
  await page.goto("/");
  const log = page.locator(".journey-log-experience");
  await expect(log).toHaveAttribute("data-intro", "done", { timeout: 15000 });
  const head = log.locator(".j-flow-signal"),
    first = await head.getAttribute("cy");
  await expect.poll(() => head.getAttribute("cy")).not.toBe(first);
  await expect
    .poll(() =>
      log.locator(".j-wave-field").evaluate((node: HTMLCanvasElement) => {
        const data = node.getContext("2d")!.getImageData(0, 0, node.width, node.height).data;
        let visible = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) visible++;
        return visible;
      }),
    )
    .toBeGreaterThan(10);
  expect(
    parseFloat((await log.locator(".j-trajectory-lit").getAttribute("stroke-dasharray"))!),
  ).toBeGreaterThan(0);
  await log.getByRole("button", { name: "Replay journey intro" }).click();
  await expect(log).toHaveAttribute("data-intro", "orbit");
  const overlay = (await log.locator(".j-ignition").boundingBox())!,
    bounds = (await log.boundingBox())!;
  expect(overlay.x).toBeGreaterThanOrEqual(bounds.x);
  expect(overlay.y).toBeGreaterThanOrEqual(bounds.y);
  expect(overlay.width).toBeLessThanOrEqual(bounds.width);
  expect(overlay.height).toBeLessThanOrEqual(bounds.height);
  await expect(log).toHaveAttribute("data-intro", "travel");
  await expect(log).toHaveAttribute("data-intro", "done");
  await log.getByRole("button", { name: "Replay journey intro" }).click();
  await log.getByRole("button", { name: "Skip intro" }).click();
  await expect(log).toHaveAttribute("data-intro", "done");
  await expect(log.locator(".j-ignition")).toHaveCount(0);
});

test("Milo enters the actual city, traverses its platforms, and remains draggable", async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    "Rooftop roaming is checked with desktop space; touch dragging has separate coverage.",
  );
  await page.goto("/");
  await expect(page.locator(".spatial-experience")).toHaveAttribute("data-ready", "true", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Focus scene", exact: true }).click();
  const cat = page.locator(".milo");
  await expect(cat).toHaveAttribute("data-in-city", "true", { timeout: 20000 });
  await expect(cat).toHaveAttribute("data-city-surface", "roof");
  const start = (await cat.boundingBox())!;
  expect(start.height).toBeGreaterThan(80);
  await expect
    .poll(
      async () => {
        const rect = (await cat.boundingBox())!;
        return Math.hypot(rect.x - start.x, rect.y - start.y);
      },
      { timeout: 12000 },
    )
    .toBeGreaterThan(35);
  const pet = page.getByRole("button", { name: "Pet or drag Milo" });
  await expect(pet).toBeVisible();
  await pet.hover();
  const rect = (await pet.boundingBox())!;
  await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(650, 400, { steps: 12 });
  await page.mouse.up();
  await expect(cat).toHaveAttribute("data-dragging", "false");
  await page.getByRole("button", { name: "Open Milo chat", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Milo workspace assistant" })).toBeVisible();
});

test("Milo dissolves into real city geometry and returns to the 2D companion", async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    "The full round trip is checked on desktop; mobile scene and touch interactions have separate coverage.",
  );
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?spatialDebug=1");
  await expect(page.locator(".spatial-experience")).toHaveAttribute("data-ready", "true", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Focus scene", exact: true }).click();
  const cat = page.locator(".milo"),
    rendered = page.locator(".spatial-renderer");
  const history = await cat.evaluateHandle((node) => {
    const events: Array<{ action: string; activity: string; surface: string }> = [];
    const observer = new MutationObserver(() => {
      const element = node as HTMLElement;
      events.push({
        action: element.dataset.action ?? "",
        activity: element.dataset.cityActivity ?? "",
        surface: element.dataset.citySurface ?? "",
      });
    });
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["data-action", "data-city-activity"],
    });
    return { events, observer };
  });
  await expect(cat).toHaveAttribute("data-dimension", "3d", { timeout: 20000 });
  await expect(rendered).toHaveAttribute("data-milo3d", "true");
  await expect(page.locator(".milo-art")).toHaveCSS("opacity", "0");
  // Inspect native WebGL pixels, which cannot contain the hidden SVG illustration.
  expect(
    await page.locator(".spatial-canvas").evaluate((canvas: HTMLCanvasElement) => {
      const rect = document.querySelector(".milo")!.getBoundingClientRect(),
        bounds = canvas.getBoundingClientRect(),
        target = document.createElement("canvas");
      target.width = target.height = 64;
      const context = target.getContext("2d")!;
      context.drawImage(
        canvas,
        ((rect.x - bounds.x) / bounds.width) * canvas.width,
        ((rect.y - bounds.y) / bounds.height) * canvas.height,
        (rect.width / bounds.width) * canvas.width,
        (rect.height / bounds.height) * canvas.height,
        0,
        0,
        64,
        64,
      );
      const data = context.getImageData(0, 0, 64, 64).data;
      let bright = 0;
      for (let i = 0; i < data.length; i += 4) if (data[i] > 145 && data[i + 2] > 145) bright++;
      return bright;
    }),
  ).toBeGreaterThan(30);
  await page.waitForFunction(
    () => {
      const cat = document.querySelector<HTMLElement>(".milo");
      return cat?.dataset.inCity === "false" && cat?.dataset.dimension === "morphing";
    },
    {},
    { timeout: 75000 },
  );
  await expect(cat).toHaveAttribute("data-dimension", "2d");
  await expect(rendered).toHaveAttribute("data-milo3d", "false");
  await expect(page.locator(".milo-art")).toHaveCSS("opacity", "1");
  const events = await history.evaluate((log) => {
    log.observer.disconnect();
    return log.events;
  });
  expect(events.some((event) => event.action === "walk" && event.surface === "roof")).toBe(true);
  expect(events.some((event) => event.action === "walk" && event.surface === "street")).toBe(true);
  expect(events.some((event) => event.action === "sleep")).toBe(true);
  expect(events.some((event) => event.activity === "crouching")).toBe(true);
  expect(events.some((event) => event.activity === "roof-jump")).toBe(true);
  expect(events.some((event) => event.action === "climb")).toBe(false);
  await history.dispose();
  expect(errors).toEqual([]);
});
