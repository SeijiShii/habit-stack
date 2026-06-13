import { test, expect } from "@playwright/test";

// R20260613-005: footer の「他のアプリ」back-link → showcase (givers.work)。
// 外部サイトへの実遷移は踏まず href / 属性を検証する。
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

test("E1/E2: footer に「他のアプリ」back-link があり givers.work を新規タブで指す", async ({
  page,
}) => {
  const link = page.getByRole("link", { name: "他のアプリ" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "https://givers.work");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
});

test("R1: 既存の法務リンクは従来どおり footer に存在", async ({ page }) => {
  await expect(page.getByRole("link", { name: "プライバシーポリシー" })).toBeVisible();
  await expect(page.getByRole("link", { name: "利用規約" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "特定商取引法に基づく表記" }),
  ).toBeVisible();
});
