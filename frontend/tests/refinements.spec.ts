import { test, expect } from "@playwright/test";

test("Milo can be dragged without triggering the pet action", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cat = page.locator(".milo");
  await expect(cat).toBeVisible();
  const start = (await cat.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 - 160, start.y + start.height / 2 - 55, {
    steps: 12,
  });
  await expect(cat).toHaveAttribute("data-dragging", "true");
  await page.mouse.up();
  await expect(cat).toHaveAttribute("data-dragging", "false");
  const dropped = (await cat.boundingBox())!;
  expect(dropped.x).toBeLessThan(start.x - 100);
  await expect(cat).not.toHaveAttribute("data-action", "lie");
});

test("theme and social links work across routes and reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "GitHub" })).toBeVisible();
  await expect(page.getByRole("link", { name: "LinkedIn" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).toBe("light");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Work" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
});

test("Work and Research have searchable folders and readable articles", async ({ page }) => {
  for (const [area, folder, query, title] of [
    ["work", "ML experiments", "ONNX", "NAV.AI: draw a route through the site"],
    [
      "research",
      "Computer vision",
      "preprocessing",
      "Why preprocessing changes handwritten recognition",
    ],
  ]) {
    await page.goto(`/${area}`);
    await page
      .getByRole("complementary", { name: `${area} folders` })
      .getByRole("button", { name: new RegExp(folder) })
      .click();
    const search = page.getByRole("searchbox", { name: `Search ${area} articles` });
    await search.fill(query);
    await expect(page.locator(".archive-row")).toHaveCount(1);
    const thumbnail = page.locator(".archive-row .editorial-thumbnail");
    const imageBox = (await thumbnail.boundingBox())!;
    expect(imageBox.width / imageBox.height).toBeCloseTo(16 / 9, 1);
    const sidebar = page.getByRole("complementary", { name: `${area} folders` });
    await expect(sidebar).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await expect(page.locator(".archive-article h2")).toHaveText(title);
    await page.getByRole("button", { name: "BACK TO INDEX" }).click();
    await search.fill("no-note-has-this-phrase");
    await expect(page.getByText("No matching notes.")).toBeVisible();
  }
});

test("About portrait loads and Awards frames open a rotatable inspector", async ({ page, isMobile }) => {
  await page.goto("/");
  const portrait = page.getByRole("img", { name: "Portrait of Dang Nhu Phuoc" });
  await expect(portrait).toBeVisible();
  expect(await portrait.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(400);
  await page.goto("/awards");
  await page.getByRole("button", { name: "Inspect Award / 01" }).click();
  const inspector = page.getByRole("dialog", { name: "Inspect Award / 01" });
  await expect(inspector).toBeVisible();
  const object = inspector.locator(".award-inspector-object");
  const before = await object.evaluate((element) => getComputedStyle(element).transform);
  const stage = inspector.locator(".award-inspector-stage");
  const box = (await stage.boundingBox())!;
  if (!isMobile) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 30, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => object.evaluate((element) => getComputedStyle(element).transform)).not.toBe(before);
  }
  await inspector.getByRole("button", { name: "Zoom in" }).click();
  await expect(inspector).toContainText("115%");
  await inspector.getByRole("button", { name: "Close award inspector" }).click();
  await expect(inspector).toHaveCount(0);
});

test("Milo shows an honest offline chat state and keeps direct navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Talk to Milo, the workspace companion" }).click();
  const dialog = page.getByRole("dialog", { name: "Milo workspace assistant" });
  await expect(dialog).toContainText("GROQ READY WHEN CONFIGURED");
  const input = page.getByRole("textbox", { name: "Ask Milo anything" });
  await input.fill("Hello Milo");
  await input.press("Enter");
  await expect(dialog).toContainText("Milo cannot reach the API yet");
  await dialog.getByRole("button", { name: "Research" }).click();
  await expect(page).toHaveURL(/\/research$/);
});

test("Milo sends a multi-turn chat history to the configured API", async ({ page }) => {
  const requests: Array<{ messages: Array<{ role: string; content: string }> }> = [];
  await page.route("http://localhost:8000/ai/**", async (route) => {
    const request = route.request();
    const headers = {
      "access-control-allow-origin": "http://localhost:3000",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type",
      "content-type": "application/json",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (request.url().endsWith("/status"))
      return route.fulfill({ status: 200, headers, body: JSON.stringify({ ready: true }) });
    requests.push(request.postDataJSON());
    return route.fulfill({
      status: 200,
      headers,
      body: JSON.stringify({
        reply:
          requests.length === 1 ? "NAV.AI reads a drawn digit." : "It uses a local ONNX model.",
      }),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Talk to Milo, the workspace companion" }).click();
  const dialog = page.getByRole("dialog", { name: "Milo workspace assistant" });
  await expect(dialog).toContainText("GROQ CONNECTED");
  const input = page.getByRole("textbox", { name: "Ask Milo anything" });
  await input.fill("What is NAV.AI?");
  await input.press("Enter");
  await expect(dialog).toContainText("NAV.AI reads a drawn digit.");
  await input.fill("What model?");
  await input.press("Enter");
  await expect(dialog).toContainText("It uses a local ONNX model.");
  expect(requests).toHaveLength(2);
  expect(requests[1].messages).toEqual([
    { role: "user", content: "What is NAV.AI?" },
    { role: "assistant", content: "NAV.AI reads a drawn digit." },
    { role: "user", content: "What model?" },
  ]);
});
