import { test, expect, type Page } from "@playwright/test";

// 計時状態の永続化・復帰（R20260611-001）の E2E。
// ローカル headless（実キー不要 = ローカルゲスト owner、local-first）= Class A。
// 4H 放置自動終了 / 4H キャップ / 15秒 push の時刻依存ケースは unit（now 注入）で網羅。
// ここでは実ブラウザで堅牢に検証できるユーザージャーニー（リロード復元 / ログイン遷移終了 /
// ふりかえり遷移は継続）を担う。

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

/** セット + 2 アイテムを作り、実行画面で開始 → 2 つ目の活動へ進めた状態にする。 */
async function startTimingOnSecondItem(page: Page): Promise<string> {
  await page.getByRole("link", { name: "セットを作る" }).click();
  await page.getByLabel("セット名").fill("計時テスト");
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("button", { name: "計時テスト" }).click();

  await page.getByLabel("アイテム名").fill("ストレッチ");
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByLabel("アイテム名").fill("英単語");
  await page.getByRole("button", { name: "追加" }).click();

  // セット詳細「開始」で中間ページを挟まず計時開始（R20260614-001）
  await page.getByRole("button", { name: "開始" }).click();
  await expect(page).toHaveURL(/\/run\//);
  await expect(page.getByTestId("current-item")).toHaveText("ストレッチ");
  await page.getByRole("button", { name: "次の活動へ" }).click();
  await expect(page.getByTestId("current-item")).toHaveText("英単語");

  return page.url();
}

test("E-RESUME: リロードで計時中セッションが復元される（開始に戻らない）", async ({
  page,
}) => {
  const runUrl = await startTimingOnSecondItem(page);

  // タブ切替/スリープ後のリロード相当
  await page.goto(runUrl);

  // 開始ボタンに戻らず、2 つ目の活動の計時が継続している
  await expect(page.getByTestId("current-item")).toHaveText("英単語");
  await expect(page.getByRole("button", { name: "開始" })).toHaveCount(0);
});

test("E-01: 計時中に /account を閲覧してもセッションは終了しない（R20260615-001 停止条件緩和）", async ({
  page,
}) => {
  const runUrl = await startTimingOnSecondItem(page);

  // アカウント画面へ遷移（旧仕様では LoginEndGuard が即終了させていた）。
  // 新仕様: /account を見ただけでは止めない。停止は明示的なアカウント切替（ログイン/サインアウト）時のみ。
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account/);
  // 旧 LoginEndGuard 相当の終了処理が走らないことを確認するため十分待つ
  await page.waitForTimeout(500);

  // 実行画面に戻ると計時が継続している（開始に戻らない = 終了していない）
  await page.goto(runUrl);
  await expect(page.getByTestId("current-item")).toHaveText("英単語");
  await expect(page.getByRole("button", { name: "開始" })).toHaveCount(0);
});

test("E-01b: 計時中に /account 閲覧後セット一覧に戻っても『進行中』バッジが残る（継続の可視化）", async ({
  page,
}) => {
  await startTimingOnSecondItem(page);

  // アカウント画面を経由してもセッションは生き続ける
  await page.goto("/account");
  await page.waitForTimeout(300);
  await page.goto("/sets");

  // 一覧に進行中バッジが残る（R20260614-001 の可視化が /account 閲覧で消えない）
  await expect(page.getByTestId("in-progress-badge")).toBeVisible();
});

test("E-SUMMARY: ふりかえり(/summary)へ遷移しても計時は終了しない（継続）", async ({
  page,
}) => {
  const runUrl = await startTimingOnSecondItem(page);

  // ふりかえり画面を見てから実行画面へ戻る（ログインではないので終了しない）
  await page.getByRole("link", { name: "継続を見る" }).click();
  await expect(page).toHaveURL(/\/summary\//);

  await page.goto(runUrl);

  // 計時が継続している（開始に戻らない）
  await expect(page.getByTestId("current-item")).toHaveText("英単語");
  await expect(page.getByRole("button", { name: "開始" })).toHaveCount(0);
});
