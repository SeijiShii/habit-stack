import { test, expect, type Page } from "@playwright/test";

// セルフサービス全データ削除（O54 消去権、R20260611-002）の E2E。
// ローカル headless（実キーなし = ローカルゲスト owner、local-first）= Class A。
// サーバ DB の物理削除（deleteAllData）は unit（U-DEL-01）で検証。ここではローカル wipe の
// 実ブラウザ挙動（削除導線到達 → 確認 → データ消失 / キャンセルで残存）を担う。

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

/** セット + 1 アイテムを作る。 */
async function seedSet(page: Page, name: string): Promise<void> {
  await page.getByRole("link", { name: "セットを作る" }).click();
  await page.getByLabel("セット名").fill(name);
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("button", { name }).click();
  await page.getByLabel("アイテム名").fill("ストレッチ");
  await page.getByRole("button", { name: "追加" }).click();
  // セット一覧に戻り、作成を確認
  await page.getByRole("link", { name: "セット", exact: true }).click();
  await expect(page.getByRole("button", { name })).toBeVisible();
}

test("E-DEL-01: 全データ削除 → 確認「削除する」でデータが消える", async ({
  page,
}) => {
  await seedSet(page, "削除テスト");

  await page.getByRole("link", { name: "アカウント" }).click();
  await expect(page).toHaveURL(/\/account/);

  // 削除導線（repos 確立後に表示）
  await page.getByRole("button", { name: "全データを削除" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "削除する" }).click();

  // 削除後はトップへリロード。セット一覧が空（データ消失）
  await page.waitForURL("**/");
  await page.getByRole("link", { name: "セット", exact: true }).click();
  await expect(page.getByRole("button", { name: "削除テスト" })).toHaveCount(0);
});

test("E-DEL-02: 全データ削除 → 「キャンセル」でデータは残る", async ({
  page,
}) => {
  await seedSet(page, "残すテスト");

  await page.getByRole("link", { name: "アカウント" }).click();
  await page.getByRole("button", { name: "全データを削除" }).click();
  await page.getByRole("button", { name: "キャンセル" }).click();

  // データは残っている
  await page.getByRole("link", { name: "セット", exact: true }).click();
  await expect(page.getByRole("button", { name: "残すテスト" })).toBeVisible();
});
