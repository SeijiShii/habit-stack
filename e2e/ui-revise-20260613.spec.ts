import { test, expect, type Page } from "@playwright/test";

// R20260613-003 (ドット廃止) / R20260613-004 (計時画面のセット合計時間) の E2E。
test.use({ timezoneId: "Asia/Tokyo" });

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

async function createSetWithItem(
  page: Page,
  setName: string,
  itemName: string,
) {
  await page.goto("/sets");
  await page.getByLabel("セット名").fill(setName);
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("button", { name: setName }).click();
  await expect(page).toHaveURL(/\/sets\//);
  await page.getByLabel("アイテム名").fill(itemName);
  await page.getByRole("button", { name: "追加" }).click();
  await expect(page.getByText(itemName)).toBeVisible();
}

test("R20260613-004 E1: 計時中にセット合計時間（合計時間）が表示される", async ({
  page,
}) => {
  await createSetWithItem(page, "平日の朝", "ストレッチ");
  // セット詳細「開始」で中間ページを挟まず計時開始（R20260614-001）
  await page.getByRole("button", { name: "開始" }).click();
  await expect(page).toHaveURL(/\/run\//);
  const setElapsed = page.getByTestId("set-elapsed");
  await expect(setElapsed).toBeVisible();
  await expect(setElapsed).toContainText("合計時間");
});

test("R20260613-003 E1: ふりかえり（個別）に達成日ドットが表示されない", async ({
  page,
}) => {
  await createSetWithItem(page, "平日の朝", "ストレッチ");
  // 実行して達成日を 1 日作る
  await page.getByRole("button", { name: "開始" }).click();
  await expect(page.getByTestId("current-item")).toBeVisible();
  await page.getByRole("button", { name: "セット終了" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  // 継続（個別サマリ）へ: 総覧でセットを選ぶ
  await page.goto("/summary");
  await page.getByLabel("セットを選ぶ").selectOption({ label: "平日の朝" });
  await expect(page).toHaveURL(/\/summary\//);

  // 連続日数テキストは出る / 達成日ドット（丸）は無い
  await expect(page.getByTestId("streak")).toBeVisible();
  await expect(page.getByLabel("達成日")).toHaveCount(0);
});
