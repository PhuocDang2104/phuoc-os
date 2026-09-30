import { test, expect } from "@playwright/test";

test("first paint tells the story and all main routes are reachable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrated but some attributes/i.test(message.text()))
      errors.push("Hydration mismatch");
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dang Nhu Phuoc." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The path is part of the work." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Currently exploring." })).toBeVisible();
  await expect(page.getByRole("region", { name: "Work gallery", exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  for (const name of ["Work", "Research", "Blog", "Awards"]) {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${name.toLowerCase()}$`));
    await expect(page.locator("main h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("windows minimize, restore, close, and reopen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Minimize About me", exact: true }).click();
  await expect(page.getByRole("region", { name: "About me", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "about.md", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dang Nhu Phuoc." })).toBeVisible();
  await page.getByRole("button", { name: "Close About me", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Desktop apps" })
    .getByRole("button", { name: "About me" })
    .click();
  await expect(page.getByRole("heading", { name: "Dang Nhu Phuoc." })).toBeVisible();
});

test("command palette supports fuzzy search, keyboard selection, and focus return", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open command palette" }).click();
  const input = page.getByRole("combobox");
  await input.fill("cntct");
  await input.press("Enter");
  await expect(page.getByRole("region", { name: "Contact", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "phuoc.dang2104@gmail.com" })).toHaveAttribute(
    "href",
    "mailto:phuoc.dang2104@gmail.com",
  );
  await page.getByRole("button", { name: "Open command palette" }).click();
  await input.press("Escape");
  await expect(page.getByRole("dialog", { name: "Command palette" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open command palette" })).toBeFocused();
});

test("neural core, Milo, and the PDF have working navigation", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Neural core workspace" }).click();
  await expect(page.getByRole("heading", { name: "Follow your curiosity." })).toBeVisible();
  await page.locator(".portal-research").click();
  await expect(page).toHaveURL(/\/research$/);
  await page.getByRole("button", { name: "Talk to Milo, the workspace companion" }).click();
  await page
    .getByRole("dialog", { name: "Milo workspace assistant" })
    .getByRole("button", { name: /^Résumé/ })
    .click();
  await expect(page.getByRole("region", { name: "Resume.pdf" })).toBeVisible();
  const pdf = await request.get("/resume.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
});

test("real local CNN recognizes a drawn one and reports inference", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Draw to navigate", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open Profile desk workspace" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  const canvas = page.getByLabel(
    "Draw a number from 1 to 6; alternatively use the destination buttons",
  );
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  if (isMobile) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + box.width * 0.5, y: box.y + box.height * 0.2 }],
    });
    for (let step = 1; step <= 20; step++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: box.x + box.width * 0.5, y: box.y + box.height * (0.2 + (0.6 * step) / 20) },
        ],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.49, box.y + box.height * 0.8, { steps: 20 });
    await page.mouse.up();
  }
  await page.getByRole("button", { name: "Recognize", exact: true }).click();
  await expect(page.locator(".prediction-row")).toBeVisible({ timeout: 45000 });
  await expect(page.locator(".prediction-row")).toContainText("prediction 1");
  await expect(page.locator(".prediction-row")).toContainText("ms");
  await expect(page).toHaveURL(/\/work$/);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Home" })
    .click();
  await expect(page.getByRole("region", { name: "Draw to navigate", exact: true })).toBeVisible();
});

test("AI failure offers direct navigation and canvas clears", async ({ page }) => {
  await page.route("**/models/mnist.onnx", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Draw to navigate", exact: true }).click();
  const canvas = page.getByLabel(
    "Draw a number from 1 to 6; alternatively use the destination buttons",
  );
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.8, { steps: 10 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Recognize", exact: true }).click();
  await expect(page.locator(".inference-output")).toContainText("Model unavailable", {
    timeout: 45000,
  });
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("button", { name: "Recognize", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "3 Research & papers" }).click();
  await expect(page).toHaveURL(/\/research$/);
});

test("desktop dragging and maximization stay within the workspace", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Mobile uses stacked windows.");
  await page.goto("/");
  const window = page.getByRole("region", { name: "About me", exact: true });
  const before = (await window.boundingBox())!;
  await page.mouse.move(before.x + 140, before.y + 18);
  await page.mouse.down();
  await page.mouse.move(before.x + 210, before.y - 20, { steps: 10 });
  await page.mouse.up();
  const after = (await window.boundingBox())!;
  expect(after.x).toBeGreaterThan(before.x + 40);
  expect(after.y).toBeLessThan(before.y);
  await page.getByRole("button", { name: "Maximize About me", exact: true }).click();
  expect((await window.boundingBox())!.width).toBeGreaterThan(1300);
  await page.getByRole("button", { name: "Restore About me", exact: true }).click();
  expect((await window.boundingBox())!.width).toBeLessThan(700);
});

test("reduced motion preference persists", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Motion off" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".os-shell")).toHaveClass(/reduce-motion/);
});
