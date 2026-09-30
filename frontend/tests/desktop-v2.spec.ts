import { test, expect } from "@playwright/test";

test("compact chrome and file launcher leave the desktop free of decorative text", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  const bar = await page.locator(".topbar").boundingBox();
  expect(bar!.height).toBeLessThan(isMobile ? 75 : 42);
  const launcher = await page.getByRole("navigation", { name: "Desktop apps" }).boundingBox();
  expect(launcher!.x).toBeLessThan(25);
  expect(launcher!.y).toBeLessThan(bar!.height + 25);
  await expect(
    page.locator(".desktop-intro, .desktop-watermark, .desktop-note, .workspace-context"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close About me", exact: true }).click();
  await page.getByRole("button", { name: "Close Journey", exact: true }).click();
  await page.getByRole("button", { name: "Close Work gallery", exact: true }).click();
  await expect(page.locator(".app-window")).toHaveCount(0);
  await expect(page.getByText("A little room to think.")).toHaveCount(0);
});

test("gallery opens at the bottom, loops, pauses, drags, and restores", async ({ page }) => {
  await page.goto("/");
  const gallery = page.getByRole("region", { name: "Work gallery", exact: true });
  const box = (await gallery.boundingBox())!;
  expect(box.y + box.height).toBeGreaterThan(page.viewportSize()!.height - 15);
  const rail = page.locator(".gallery-rail");
  await page.mouse.move(5, 5);
  const initial = await rail.evaluate((node) => node.scrollLeft);
  await expect.poll(() => rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(initial + 5);
  await page.getByRole("button", { name: "Pause gallery", exact: true }).click();
  const stopped = await rail.evaluate((node) => node.scrollLeft);
  await page.waitForTimeout(200);
  expect(await rail.evaluate((node) => node.scrollLeft)).toBeCloseTo(stopped, 0);
  await page.getByRole("button", { name: "Next gallery items" }).click();
  await expect.poll(() => rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(stopped + 150);
  const railBox = (await rail.boundingBox())!;
  const beforeDrag = await rail.evaluate((node) => node.scrollLeft);
  await page.mouse.move(railBox.x + 150, railBox.y + 45);
  await page.mouse.down();
  await page.mouse.move(railBox.x + 40, railBox.y + 45, { steps: 10 });
  await page.mouse.up();
  await expect(rail).toBeVisible();
  expect(await rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(beforeDrag + 50);
  await page.getByRole("button", { name: "Minimize Work gallery" }).click();
  await expect(gallery).toHaveCount(0);
  await page.getByRole("navigation", { name: "Desktop apps" }).getByRole("button", { name: "Work gallery" }).click();
  await expect(gallery).toBeVisible();
  await page.getByRole("button", { name: "Close Work gallery" }).click();
  await expect(gallery).toHaveCount(0);
});

test("NAV.AI is a compact Home popup and project shortcut opens the carousel", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Draw to navigate", exact: true }).click();
  const popup = page.getByRole("region", { name: "Draw to navigate", exact: true });
  await expect(popup.getByRole("heading", { name: "Where to?" })).toBeVisible();
  expect((await popup.boundingBox())!.width).toBeLessThanOrEqual(425);
  await expect(page.getByRole("button", { name: "Open Profile desk workspace" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await page.getByRole("button", { name: "2 Selected projects" }).click();
  await expect(page.getByRole("region", { name: "Work gallery" })).toBeVisible();
  const box = (await popup.boundingBox())!,
    gallery = (await page.locator(".work-gallery").boundingBox())!;
  expect(box.y + box.height).toBeLessThan(gallery.y + 2);
  await page.getByRole("button", { name: "Close Draw to navigate", exact: true }).click();
  await expect(popup).toHaveCount(0);
});

test("NAV.AI stays open and in place across navigation until explicitly closed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Draw to navigate", exact: true }).click();
  const popup = page.getByRole("region", { name: "Draw to navigate", exact: true });
  const before = (await popup.boundingBox())!;
  await popup.getByRole("button", { name: "1 Work experience" }).click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(popup).toBeVisible();
  const after = (await popup.boundingBox())!;
  expect(Math.abs(after.x - before.x)).toBeLessThan(4);
  expect(Math.abs(after.y - before.y)).toBeLessThan(4);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Home" }).click();
  await expect(popup).toBeVisible();
  await popup.getByRole("button", { name: "Close Draw to navigate" }).click();
  await expect(popup).toHaveCount(0);
});

test("Milo reacts to clicks, lies down when petted, and keeps shortcuts separate", async ({
  page,
}) => {
  await page.goto("/");
  const cat = page.locator(".milo");
  await expect(cat).toBeVisible();
  expect((await cat.boundingBox())!.width).toBeGreaterThan(100);
  await page.mouse.click(page.viewportSize()!.width - 30, 200);
  await expect(cat).toHaveAttribute("data-action", "hop");
  await page.waitForTimeout(800);
  const rect = (await cat.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.getByRole("button", { name: "Pet or drag Milo" }).click();
  await expect(cat).toHaveAttribute("data-action", "lie");
  await expect(page.getByRole("dialog", { name: "Milo workspace assistant" })).toHaveCount(0);
  await page.getByRole("button", { name: "Talk to Milo, the workspace companion" }).click();
  await expect(page.getByRole("textbox", { name: "Ask Milo anything" })).toBeVisible();
  await page
    .getByRole("dialog", { name: "Milo workspace assistant" })
    .getByRole("button", { name: /^NAV\.AI/ })
    .click();
  await expect(page.getByRole("region", { name: "Draw to navigate", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Milo workspace assistant" })).toHaveCount(0);
});

test("reduced motion stops gallery autoplay and ambient locomotion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Work gallery", exact: true }).click();
  const rail = page.locator(".gallery-rail");
  await expect(rail).toHaveAttribute("data-paused", "true");
  const cat = page.locator(".milo");
  await page.waitForTimeout(150);
  const before = await cat.boundingBox(),
    offset = await rail.evaluate((node) => node.scrollLeft);
  await page.waitForTimeout(350);
  expect(await cat.boundingBox()).toEqual(before);
  expect(await rail.evaluate((node) => node.scrollLeft)).toBe(offset);
  await page.getByRole("button", { name: "Next gallery items" }).click();
  await expect.poll(() => rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(offset);
});
