// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LocalStore,
  type LocalRecord,
} from "../../services/sync/localStore.js";
import { SummaryRepo } from "./model/summaryRepo.js";
import { SummaryPage } from "./SummaryPage.js";
import { asOwnerId } from "../../types/domain.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const wrap = (ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

async function seedAchievements(dates: string[]) {
  const store = await LocalStore.open();
  for (const date of dates) {
    const rec: LocalRecord = {
      id: `owner_1:set_1:${date}`,
      ownerId: "owner_1",
      clientLocalId: `owner_1:set_1:${date}`,
      setId: "set_1",
      date,
      achieved: true,
      itemDoneCount: 1,
      updatedAt: `${date}T09:00:00.000Z`,
      deletedAt: null,
    };
    await store.applyRemote("daily_achievement", rec);
  }
  return new SummaryRepo(store, asOwnerId("owner_1"));
}

const put = (
  store: LocalStore,
  entity: Parameters<LocalStore["applyRemote"]>[0],
  r: Partial<LocalRecord>,
) =>
  store.applyRemote(entity, {
    ownerId: "owner_1",
    updatedAt: "2026-06-13T00:00:00.000Z",
    deletedAt: null,
    clientLocalId: String(r.id),
    ...r,
  } as LocalRecord);

describe("SummaryPage (UC6)", () => {
  it("SM-S1: 達成記録があれば継続率・連続日数を表示（ドットは廃止）", async () => {
    const repo = await seedAchievements([
      "2026-06-08",
      "2026-06-07",
      "2026-06-06",
    ]);
    wrap(
      <SummaryPage
        repo={repo}
        setId="set_1"
        setName="平日の朝"
        today="2026-06-08"
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("streak").textContent).toContain("3日"),
    );
    // 7 日中 3 日 → 43%
    expect(screen.getByLabelText("継続率").textContent).toContain("3 日");
    // 達成日ドット（丸）は廃止済み（R20260613-003）
    expect(screen.queryByLabelText("達成日")).toBeNull();
  });

  it("SM-S4: 記録なしは前向きな空状態（咎めない）", async () => {
    const repo = await seedAchievements([]);
    wrap(
      <SummaryPage
        repo={repo}
        setId="set_1"
        setName="平日の朝"
        today="2026-06-08"
      />,
    );
    await waitFor(() =>
      expect(screen.getByText(/ひとつから始めましょう/)).toBeTruthy(),
    );
  });

  it("SM-S5: 全期間ボタンで最古の達成日からの遂行率を出す", async () => {
    // 6/01 と 6/08 のみ達成（最古=6/01 → 6/08 まで 8 日中 2 日）
    const repo = await seedAchievements(["2026-06-08", "2026-06-01"]);
    wrap(
      <SummaryPage
        repo={repo}
        setId="set_1"
        setName="平日の朝"
        today="2026-06-08"
      />,
    );

    await waitFor(() => expect(screen.getByLabelText("継続率")).toBeTruthy());
    // 既定 7 日 = 6/02..6/08 → 1 日のみ達成
    expect(screen.getByLabelText("継続率").textContent).toContain(
      "7 日中 1 日",
    );

    fireEvent.click(screen.getByRole("button", { name: "全期間" }));
    await waitFor(() =>
      expect(screen.getByLabelText("継続率").textContent).toContain(
        "8 日中 2 日",
      ),
    );
  });

  it("SM-S6: 活動の記録テーブル — セッション単位の行、開くと item 別の時間とメモ", async () => {
    const store = await LocalStore.open();
    await put(store, "activity_item", {
      id: "i1",
      setId: "set_1",
      name: "腕立て",
    });
    await put(store, "activity_item", {
      id: "i2",
      setId: "set_1",
      name: "腹筋",
    });
    await put(store, "execution_session", {
      id: "sess_1",
      setId: "set_1",
      startedAt: "2026-06-08T01:00:00.000Z",
      status: "done",
    });
    await put(store, "execution_record", {
      id: "sess_1:i1",
      sessionId: "sess_1",
      itemId: "i1",
      startedAt: "2026-06-08T01:00:00.000Z",
      elapsedSec: 600,
      note: "きつかった",
    });
    await put(store, "execution_record", {
      id: "sess_1:i2",
      sessionId: "sess_1",
      itemId: "i2",
      startedAt: "2026-06-08T01:10:00.000Z",
      elapsedSec: 480,
    });
    const repo = new SummaryRepo(store, asOwnerId("owner_1"));

    wrap(
      <SummaryPage
        repo={repo}
        setId="set_1"
        setName="平日の朝"
        today="2026-06-08"
      />,
    );

    await waitFor(() => expect(screen.getByText("活動の記録")).toBeTruthy());
    // 1 セッション = 1 行（合計 18 分）
    expect(screen.getByTestId("activity-total-sess_1").textContent).toContain(
      "18分",
    );
    // 開くと item 別の時間とメモが見える
    expect(screen.getByText(/腕立て/).textContent).toContain("10分");
    expect(screen.getByText(/きつかった/)).toBeTruthy();
    expect(screen.getByText(/腹筋/).textContent).toContain("8分");
  });

  it("SM-S8: 活動の記録は 10 件/ページでページネーションする（R20260614）", async () => {
    const store = await LocalStore.open();
    await put(store, "activity_item", {
      id: "i1",
      setId: "set_1",
      name: "腕立て",
    });
    // 11 セッションを古い→新しいで投入（newest=sess_10）。
    for (let n = 0; n <= 10; n++) {
      const hh = String(n).padStart(2, "0");
      await put(store, "execution_session", {
        id: `sess_${hh}`,
        setId: "set_1",
        startedAt: `2026-06-08T${hh}:00:00.000Z`,
        status: "done",
      });
      await put(store, "execution_record", {
        id: `sess_${hh}:i1`,
        sessionId: `sess_${hh}`,
        itemId: "i1",
        startedAt: `2026-06-08T${hh}:00:00.000Z`,
        elapsedSec: 60,
      });
    }
    const repo = new SummaryRepo(store, asOwnerId("owner_1"));

    wrap(
      <SummaryPage
        repo={repo}
        setId="set_1"
        setName="平日の朝"
        today="2026-06-08"
      />,
    );

    // 1 ページ目: 最新 10 件（sess_10..sess_01）。最古 sess_00 は出ない。
    await waitFor(() =>
      expect(screen.getByTestId("activity-total-sess_10")).toBeTruthy(),
    );
    expect(screen.queryByTestId("activity-total-sess_00")).toBeNull();
    expect(screen.getByTestId("page-indicator").textContent).toContain("1 / 2");

    // 次へ → 2 ページ目に sess_00、sess_10 は消える。
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    await waitFor(() =>
      expect(screen.getByTestId("activity-total-sess_00")).toBeTruthy(),
    );
    expect(screen.queryByTestId("activity-total-sess_10")).toBeNull();
    expect(screen.getByTestId("page-indicator").textContent).toContain("2 / 2");
  });

  it("SM-S7: setsRepo を渡すとセット切替ドロップダウンが出て onSelectSet が呼ばれる", async () => {
    const repo = await seedAchievements(["2026-06-08"]);
    const onSelect = vi.fn();
    wrap(
      <SummaryPage
        repo={repo}
        setId="set_1"
        setName="平日の朝"
        setsRepo={{
          listSets: async () => [
            { id: "set_1", name: "平日の朝" },
            { id: "set_2", name: "夜の読書" },
          ],
        }}
        onSelectSet={onSelect}
        today="2026-06-08"
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("セットを選ぶ")).toBeTruthy(),
    );
    fireEvent.change(screen.getByLabelText("セットを選ぶ"), {
      target: { value: "set_2" },
    });
    expect(onSelect).toHaveBeenCalledWith("set_2");
  });
});
