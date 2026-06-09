import { test, expect } from "@playwright/test";

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

test("コアジャーニー: セット作成 → アイテム → 実行 → 達成 (offline/キーなし local-first)", async ({
  page,
}) => {
  // 入口リード（O41）
  await expect(page.getByTestId("lead")).toBeVisible();

  // セット作成（UC1）
  await page.getByRole("link", { name: "セットを作る" }).click();
  await expect(page).toHaveURL(/\/sets$/);
  await page.getByLabel("セット名").fill("平日の朝");
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("button", { name: "平日の朝" }).click();

  // アイテム追加（UC2）→ /sets/:id
  await expect(page).toHaveURL(/\/sets\//);
  await page.getByLabel("アイテム名").fill("ストレッチ");
  await page.getByRole("button", { name: "追加" }).click();
  await expect(page.getByText("ストレッチ")).toBeVisible();
  await page.getByLabel("アイテム名").fill("英単語");
  await page.getByRole("button", { name: "追加" }).click();

  // 実行（UC4）
  await page.getByRole("link", { name: "実行する" }).click();
  await expect(page).toHaveURL(/\/run\//);
  await page.getByRole("button", { name: "開始" }).click();
  await expect(page.getByTestId("current-item")).toHaveText("ストレッチ");
  await page.getByRole("button", { name: "次の活動へ" }).click();
  await expect(page.getByTestId("current-item")).toHaveText("英単語");
  await page.getByRole("button", { name: "セット終了" }).click();
  await expect(page.getByRole("status")).toContainText("やれました");
});

test("継続サマリに達成が反映（穴あき許容）", async ({ page }) => {
  // セット + 1 アイテムを作って 1 アイテムだけ実行（穴あき）
  await page.getByRole("link", { name: "セットを作る" }).click();
  await page.getByLabel("セット名").fill("読書");
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("button", { name: "読書" }).click();
  await page.getByLabel("アイテム名").fill("小説");
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("link", { name: "実行する" }).click();
  await page.getByRole("button", { name: "開始" }).click();
  await page.getByRole("button", { name: "セット終了" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  // 継続サマリ
  await page.getByRole("link", { name: "継続を見る" }).click();
  await expect(page).toHaveURL(/\/summary\//);
  await expect(page.getByTestId("streak")).toContainText("1日");
});

test("法務ルート到達性（O55） + O54 文言", async ({ page }) => {
  await page.getByRole("link", { name: "プライバシーポリシー" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "プライバシーポリシー",
  );
  await expect(page.getByText("個人として特定できません")).toBeVisible();
});
