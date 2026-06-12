import { test, expect, type Page } from "@playwright/test";

// 達成日・today はユーザーローカル日付（R20260613-001）。UTC とのズレを再現するため JST 固定。
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

/** セット + アイテムを UI で作成し、セット詳細 URL の setId を返す。 */
async function createSet(page: Page, setName: string, itemName: string) {
  await page.goto("/sets");
  await page.getByLabel("セット名").fill(setName);
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("button", { name: setName }).click();
  await expect(page).toHaveURL(/\/sets\//);
  await page.getByLabel("アイテム名").fill(itemName);
  await page.getByRole("button", { name: "追加" }).click();
  await expect(page.getByText(itemName)).toBeVisible();
  const setId = page.url().split("/sets/")[1]!;
  return setId;
}

/** IndexedDB へレコードを直接注入する（owner はローカルゲスト）。 */
async function injectRecords(
  page: Page,
  records: { store: string; value: Record<string, unknown> }[],
  opts: { clearMigrationFlag?: boolean } = {},
) {
  await page.evaluate(
    async ({ records, clearMigrationFlag }) => {
      const ownerId = localStorage.getItem("habit-stack:guest-owner");
      if (!ownerId) throw new Error("guest owner 未確立");
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("habit-stack", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      for (const r of records) {
        const value = { ownerId, deletedAt: null, ...r.value };
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(r.store, "readwrite");
          tx.objectStore(r.store).put(value);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }
      if (clearMigrationFlag) {
        const keys: string[] = await new Promise((resolve, reject) => {
          const tx = db.transaction("meta", "readonly");
          const req = tx.objectStore("meta").getAllKeys();
          req.onsuccess = () => resolve(req.result as string[]);
          req.onerror = () => reject(req.error);
        });
        for (const k of keys.filter((k) =>
          String(k).startsWith("migration:achievements-local-date"),
        )) {
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("meta", "readwrite");
            tx.objectStore("meta").delete(k);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        }
      }
      db.close();
    },
    { records, clearMigrationFlag: opts.clearMigrationFlag ?? false },
  );
}

/** ブラウザ(JST)のローカル日付 YYYY-MM-DD（オフセット日数指定可）。 */
async function localDate(page: Page, offsetDays = 0): Promise<string> {
  return page.evaluate((off) => {
    const d = new Date();
    d.setDate(d.getDate() + off);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, offsetDays);
}

test("E2E-OV-01/02/03: 継続ナビ → 総覧（ドロップダウン + 折りたたみ + 合計時間）→ 個別サマリ遷移", async ({
  page,
}) => {
  await createSet(page, "平日の朝", "ストレッチ");
  await createSet(page, "夜の読書", "小説");

  // ナビ「継続」→ 行き止まりにならず総覧が出る（旧: 静的文言のみ）
  await page.getByRole("link", { name: "継続", exact: true }).click();
  await expect(page).toHaveURL(/\/summary$/);
  await expect(page.getByRole("heading", { name: "ふりかえり" })).toBeVisible();

  // 折りたたみ（details）2 件 + セット合計時間がヘッダに見える
  const details = page.locator("details");
  await expect(details).toHaveCount(2);
  await expect(page.getByTestId(/set-total-/).first()).toContainText("分");

  // 開くとアイテム名 + アイテム別累計時間
  await details.first().locator("summary").click();
  await expect(page.getByText(/ストレッチ（.*分）/)).toBeVisible();

  // ドロップダウンで個別サマリへ遷移
  await page.getByLabel("セットを選ぶ").selectOption({ label: "夜の読書" });
  await expect(page).toHaveURL(/\/summary\/.+/);
  await expect(
    page.getByRole("heading", { name: /夜の読書 の継続/ }),
  ).toBeVisible();
});

test("E2E-OV-04: セット 0 件は空状態 + 作成導線", async ({ page }) => {
  await page.getByRole("link", { name: "継続", exact: true }).click();
  await expect(page.getByText(/まだセットがありません/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "セットをつくる" }),
  ).toBeVisible();
});

test("E2E-ST-01/02: 昨日までの連続は今日未実施でも保たれ、今日実施で +1", async ({
  page,
}) => {
  const setId = await createSet(page, "読書", "小説");
  const d1 = await localDate(page, -1);
  const d2 = await localDate(page, -2);
  await injectRecords(page, [
    ...[d1, d2].map((date) => ({
      store: "daily_achievement",
      value: {
        id: `ach:${setId}:${date}`,
        clientLocalId: `ach:${setId}:${date}`,
        setId,
        date,
        achieved: true,
        itemDoneCount: 1,
        updatedAt: `${date}T12:00:00.000Z`,
      },
    })),
  ]);

  // 今日未実施でも 2 日（today-pending 許容、0 日にならない）
  await page.goto(`/summary/${setId}`);
  await expect(page.getByTestId("streak")).toContainText("2日");

  // 今日 1 アイテム実行 → 3 日
  await page.goto(`/run/${setId}`);
  await page.getByRole("button", { name: "開始" }).click();
  await page.getByRole("button", { name: "セット終了" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto(`/summary/${setId}`);
  await expect(page.getByTestId("streak")).toContainText("3日");
});

test("E2E-MG-01: UTC 日付でズレた達成が再構築され 2 日連続に補正（冪等）", async ({
  page,
}) => {
  const setId = await createSet(page, "筋トレ", "スクワット");
  // JST 昨日 21:00 と JST 今日 08:00 の 2 回実行 = UTC では同一日に潰れる
  const [run1, run2] = await page.evaluate(() => {
    const mk = (offsetDays: number, hour: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      d.setHours(hour, 0, 0, 0);
      return d.toISOString();
    };
    return [mk(-1, 21), mk(0, 8)];
  });
  const utcCollapsed = run2.slice(0, 10); // 旧コードの UTC slice 達成日（両方これに潰れる）
  await injectRecords(
    page,
    [
      ...[
        { sid: "sess_mg_1", at: run1 },
        { sid: "sess_mg_2", at: run2 },
      ].flatMap(({ sid, at }) => [
        {
          store: "execution_session",
          value: {
            id: sid,
            clientLocalId: sid,
            setId,
            startedAt: at,
            status: "done",
            updatedAt: at,
          },
        },
        {
          store: "execution_record",
          value: {
            id: `${sid}:i1`,
            clientLocalId: `${sid}:i1`,
            sessionId: sid,
            itemId: "i1",
            startedAt: at,
            endedAt: at,
            elapsedSec: 60,
            pausedTotalSec: 0,
            note: "",
            updatedAt: at,
          },
        },
      ]),
      {
        store: "daily_achievement",
        value: {
          id: `ach:${setId}:${utcCollapsed}`,
          clientLocalId: `ach:${setId}:${utcCollapsed}`,
          setId,
          date: utcCollapsed,
          achieved: true,
          itemDoneCount: 2,
          updatedAt: run2,
        },
      },
    ],
    { clearMigrationFlag: true },
  );

  // リロード → migration（fire-and-forget）完了 = META フラグ書き込みを待ってから検証
  // （集計より先に走らなくても次回表示で正しくなる設計、005_REVISE_MIGRATION §2）
  await page.reload();
  await page.waitForFunction(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("habit-stack", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const keys: unknown[] = await new Promise((resolve, reject) => {
      const tx = db.transaction("meta", "readonly");
      const rq = tx.objectStore("meta").getAllKeys();
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    });
    db.close();
    return keys.some((k) =>
      String(k).startsWith("migration:achievements-local-date"),
    );
  });
  await page.goto(`/summary/${setId}`);
  await expect(page.getByTestId("streak")).toContainText("2日");

  // 冪等: 再リロードでも変化しない
  await page.reload();
  await expect(page.getByTestId("streak")).toContainText("2日");
});
