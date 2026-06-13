import { test, expect } from "@playwright/test";

// R20260613-002: ヘッダのロゴ + タイトル表示と狭幅でのロゴのみ縮退（004 §1 E1-E3）。
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase("habit-stack");
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  });
  await page.reload();
});

const brandLink = (page: import("@playwright/test").Page) =>
  page.getByRole("link", { name: "つみあげルーティン（ホーム）" });

test("E1: 広幅ではロゴ + アプリ名の両方が表示される", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  const link = brandLink(page);
  await expect(link.locator("svg.brand-logo")).toBeVisible();
  await expect(link.locator(".brand-name")).toBeVisible();
  await expect(link.locator(".brand-name")).toHaveText("つみあげルーティン");
});

test("E2: 狭幅ではロゴのみ表示され、アプリ名は隠れる（エリプシス回避）", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/");
  const link = brandLink(page);
  await expect(link.locator("svg.brand-logo")).toBeVisible();
  await expect(link.locator(".brand-name")).toBeHidden();
});

test("E3: ロゴ/ホームリンクからトップへ遷移する", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto("/sets");
  await expect(page).toHaveURL(/\/sets$/);
  await brandLink(page).click();
  await expect(page).toHaveURL(/\/$/);
});
