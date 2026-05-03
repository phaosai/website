// Visual regression: catches unintended styling/layout changes for the
// Workflow Teardown popup across mobile, tablet, and desktop breakpoints.
import { test, expect } from "../playwright-fixture";

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const bp of BREAKPOINTS) {
  test(`workflow teardown popup — ${bp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/");
    // Popup auto-opens after 5s on the home page.
    await page.waitForSelector("text=Send Us Your Messiest", { timeout: 10000 });
    const dialog = page.locator("text=Send Us Your Messiest").locator("xpath=ancestor::div[contains(@class,'rounded-3xl')]").first();
    await expect(dialog).toHaveScreenshot(`teardown-${bp.name}.png`, {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
    });
  });
}

test("workflow teardown popup — does NOT appear on /pricing", async ({ page }) => {
  await page.goto("/pricing");
  await page.waitForTimeout(7000);
  await expect(page.locator("text=Send Us Your Messiest")).toHaveCount(0);
});
