import { test, expect } from "@playwright/test";

test("Home opens the three documents with a full-width CV and optional page fit", async ({
  page, request, isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const about = page.getByRole("region", { name: "About me", exact: true });
  const resume = page.getByRole("region", { name: "Resume.pdf", exact: true });
  const journey = page.getByRole("region", { name: "Journey", exact: true });
  await expect(about).toBeVisible();
  await expect(resume).toBeVisible();
  await expect(journey).toBeVisible();
  await expect(page.getByRole("region", { name: "Work gallery", exact: true })).toHaveCount(0);
  await expect(about).not.toContainText("Hardware · Firmware · Edge inference");
  expect(await about.locator(".about-bio").evaluate((n) => parseFloat(getComputedStyle(n).fontSize)))
    .toBeGreaterThanOrEqual(12);
  expect(await about.locator(".window-body").evaluate((n) => n.scrollHeight - n.clientHeight))
    .toBeLessThanOrEqual(1);
  if (!isMobile) {
    const a = (await about.boundingBox())!, r = (await resume.boundingBox())!,
      j = (await journey.boundingBox())!;
    expect(a.x + a.width).toBeLessThan(r.x);
    expect(r.x + r.width).toBeLessThan(j.x);
    expect(a.y).toBeGreaterThan(r.y);
    expect(j.height / j.width).toBeCloseTo(16 / 9, 1);
  }
  const reader = page.getByRole("region", { name: "Resume pages", exact: true });
  await reader.scrollIntoViewIfNeeded();
  const images = reader.getByRole("img");
  await expect(images).toHaveCount(2);
  for (const img of await images.all()) {
    await expect.poll(() => img.evaluate((n: HTMLImageElement) => n.complete && n.naturalWidth > 1000))
      .toBe(true);
  }
  const viewport = (await reader.boundingBox())!, first = (await images.first().boundingBox())!;
  expect(first.width).toBeGreaterThan(viewport.width * 0.88);
  await expect(resume.getByRole("button", { name: "Fit full resume page" })).toHaveAttribute("aria-pressed", "true");
  await reader.focus();
  await page.keyboard.press("PageDown");
  await expect.poll(() => reader.evaluate((n) => n.scrollTop)).toBeGreaterThan(100);
  await resume.getByRole("button", { name: "Fit full resume page" }).click();
  await expect(resume.getByRole("button", { name: "Enlarge resume to fit width" })).toBeVisible();
  await reader.evaluate((node) => { node.scrollTop = 0; });
  const fitted = (await images.first().boundingBox())!;
  expect(fitted.y).toBeGreaterThanOrEqual(viewport.y);
  expect(fitted.y + fitted.height).toBeLessThanOrEqual(viewport.y + viewport.height + 1);
  const downloadEvent = page.waitForEvent("download");
  await resume.getByRole("link", { name: "Download", exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe("Dang_Nhu_Phuoc_CV_OLP_AI.pdf");
  const pdf = await request.get("/resume.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect(pdf.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
});
