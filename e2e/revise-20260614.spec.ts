import { test, expect, type Page } from "@playwright/test";

// R20260614-001 (計時中セッションの可視化と導線) / R20260614-002 (活動 1:N period 化) の E2E。
// ローカル headless（実キー不要 = ローカルゲスト owner、local-first）= Class A。
// R20260614-003 (ふりかえり 10件/ページ ページネーション) は date ベースの sessionLocalId 制約で
// 同日 11 セッションを UI から作れないため unit (SM-S8) で網羅し、E2E は対象外（103 に明記）。

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

/** セットを作りアイテムを 1 つ追加してセット詳細に留まる。 */
async function newSetWithItem(page: Page, setName: string, itemName: string) {
  await page.goto("/sets");
  await page.getByLabel("セット名").fill(setName);
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("button", { name: setName }).click();
  await expect(page).toHaveURL(/\/sets\//);
  await page.getByLabel("アイテム名").fill(itemName);
  await page.getByRole("button", { name: "追加" }).click();
  await expect(page.getByText(itemName)).toBeVisible();
}

test("R20260614-001 E1: セット詳細「開始」で中間ページを挟まず計時開始する", async ({
  page,
}) => {
  await newSetWithItem(page, "朝の習慣", "ストレッチ");
  await page.getByRole("button", { name: "開始" }).click();
  await expect(page).toHaveURL(/\/run\//);
  // 中間の「開始 / 継続を見る」ページを経ず、いきなり活動画面（計時中）になる
  await expect(page.getByTestId("current-item")).toHaveText("ストレッチ");
});

test("R20260614-001 E2: 計時中はセット一覧で「進行中」表示 + 選択で活動画面へ復帰", async ({
  page,
}) => {
  await newSetWithItem(page, "朝の習慣", "ストレッチ");
  await page.getByRole("button", { name: "開始" }).click();
  await expect(page.getByTestId("current-item")).toBeVisible();

  // セット一覧へ移ると当該セットに「進行中」が出る
  await page.goto("/sets");
  const setBtn = page.getByRole("button", { name: /朝の習慣/ });
  await expect(setBtn).toContainText("進行中");

  // 進行中セットを選ぶと計時中の活動画面へ戻れる（幽霊セッション化しない）
  await setBtn.click();
  await expect(page).toHaveURL(/\/run\//);
  await expect(page.getByTestId("current-item")).toHaveText("ストレッチ");
});

test("R20260614-001 E3: 別セット計時中は二重開始を防ぎ計時中セットへ誘導", async ({
  page,
}) => {
  await newSetWithItem(page, "朝の習慣", "ストレッチ");
  await page.getByRole("button", { name: "開始" }).click();
  await expect(page.getByTestId("current-item")).toBeVisible();

  // 別セットを作って開始しようとする
  await newSetWithItem(page, "夜の習慣", "読書");
  await page.getByRole("button", { name: "開始" }).click();

  // 二重開始は防がれ、計時中セットへの誘導が出る
  await expect(page.getByText(/計時中です/)).toBeVisible();
  await page.getByRole("link", { name: "計時中のセットへ" }).click();
  await expect(page.getByTestId("current-item")).toHaveText("ストレッチ");
});

test("R20260614-002 E1: 一時停止して再開せず次の活動へ進める（中断フロー）", async ({
  page,
}) => {
  await newSetWithItem(page, "朝の習慣", "ストレッチ");
  // 2 つ目のアイテムを追加
  await page.getByLabel("アイテム名").fill("英単語");
  await page.getByRole("button", { name: "追加" }).click();
  await expect(page.getByText("英単語")).toBeVisible();

  await page.getByRole("button", { name: "開始" }).click();
  await expect(page.getByTestId("current-item")).toHaveText("ストレッチ");

  // 一時停止 → 同じ活動を再開せず次の活動へ（中断区間は経過に算入されない。精密値は unit N3b/N3c）
  await page.getByRole("button", { name: "一時停止" }).click();
  await expect(
    page.getByRole("button", { name: "同じ活動を再開" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "次の活動へ" }).click();
  await expect(page.getByTestId("current-item")).toHaveText("英単語");

  await page.getByRole("button", { name: "セット終了" }).click();
  await expect(page.getByRole("status")).toBeVisible();
});
