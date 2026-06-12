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
import { SummaryOverviewPage } from "./SummaryOverviewPage.js";
import { asOwnerId } from "../../types/domain.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const wrap = (ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

interface Seed {
  sets: { id: string; name: string }[];
  itemsBySet?: Record<string, { id: string; name: string }[]>;
  records?: { setId: string; itemId: string; elapsedSec: number }[];
  foreignOwnerRecord?: boolean;
}

async function seed({
  sets,
  itemsBySet = {},
  records = [],
  foreignOwnerRecord,
}: Seed) {
  const store = await LocalStore.open();
  const put = (
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

  for (const [i, s] of sets.entries()) {
    await put("activity_set", {
      id: s.id,
      name: s.name,
      timeOfDay: "any",
      sortOrder: i,
    });
    for (const [j, it] of (itemsBySet[s.id] ?? []).entries()) {
      await put("activity_item", {
        id: it.id,
        setId: s.id,
        name: it.name,
        sortOrder: j,
      });
    }
  }
  for (const [k, r] of records.entries()) {
    const sessId = `sess_${r.setId}_${k}`;
    await put("execution_session", {
      id: sessId,
      setId: r.setId,
      startedAt: "2026-06-13T00:00:00.000Z",
      status: "done",
    });
    await put("execution_record", {
      id: `${sessId}:${r.itemId}`,
      sessionId: sessId,
      itemId: r.itemId,
      startedAt: "2026-06-13T00:00:00.000Z",
      elapsedSec: r.elapsedSec,
    });
  }
  if (foreignOwnerRecord) {
    await store.applyRemote("execution_session", {
      id: "sess_foreign",
      ownerId: "owner_2",
      clientLocalId: "sess_foreign",
      setId: sets[0]!.id,
      startedAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:00:00.000Z",
      deletedAt: null,
    } as LocalRecord);
    await store.applyRemote("execution_record", {
      id: "sess_foreign:ix",
      ownerId: "owner_2",
      clientLocalId: "sess_foreign:ix",
      sessionId: "sess_foreign",
      itemId: "ix",
      startedAt: "2026-06-13T00:00:00.000Z",
      elapsedSec: 99999,
      updatedAt: "2026-06-13T00:00:00.000Z",
      deletedAt: null,
    } as LocalRecord);
  }
  return store;
}

function repos(store: LocalStore) {
  const owner = asOwnerId("owner_1");
  const summary = new SummaryRepo(store, owner);
  const setsRepo = {
    listSets: async () =>
      (await store.getAllByOwner("activity_set", "owner_1"))
        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
        .map((s) => ({ id: s.id, name: s.name })),
    listItems: async (setId: string) =>
      (await store.getAllByOwner("activity_item", "owner_1"))
        .filter((i) => i.setId === setId)
        .map((i) => ({ id: i.id, name: i.name })),
  };
  return { summary, setsRepo };
}

describe("SummaryOverviewPage (UC6-OV)", () => {
  it("U-PG-01: セットを折りたたみで一覧、合計時間とアイテム別時間を表示", async () => {
    const store = await seed({
      sets: [
        { id: "set_a", name: "平日の朝" },
        { id: "set_b", name: "夜の読書" },
      ],
      itemsBySet: {
        set_a: [{ id: "i1", name: "ストレッチ" }],
        set_b: [{ id: "i9", name: "読書" }],
      },
      records: [
        { setId: "set_a", itemId: "i1", elapsedSec: 3660 }, // 1時間1分
        { setId: "set_b", itemId: "i9", elapsedSec: 600 }, // 10分
      ],
    });
    const { summary, setsRepo } = repos(store);
    wrap(
      <SummaryOverviewPage
        setsRepo={setsRepo}
        summaryRepo={summary}
        onSelectSet={() => {}}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByText("平日の朝").length).toBeGreaterThan(0),
    );
    const groups = screen.getAllByRole("group"); // details 要素
    expect(groups.length).toBe(2);
    // セットヘッダの合計時間（セット計とアイテム行の両方に出るので testid で特定）
    expect(screen.getByTestId("set-total-set_a").textContent).toBe("1時間1分");
    expect(screen.getByTestId("set-total-set_b").textContent).toBe("10分");
    // 開いた中身: アイテム名 + アイテム別累計
    expect(screen.getByText(/ストレッチ/).textContent).toContain("1時間1分");
  });

  it("U-PG-02: ドロップダウンでセットを選ぶと onSelectSet が呼ばれる", async () => {
    const store = await seed({
      sets: [
        { id: "set_a", name: "平日の朝" },
        { id: "set_b", name: "夜の読書" },
      ],
    });
    const { summary, setsRepo } = repos(store);
    const onSelect = vi.fn();
    wrap(
      <SummaryOverviewPage
        setsRepo={setsRepo}
        summaryRepo={summary}
        onSelectSet={onSelect}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("セットを選ぶ")).toBeTruthy(),
    );
    fireEvent.change(screen.getByLabelText("セットを選ぶ"), {
      target: { value: "set_b" },
    });
    expect(onSelect).toHaveBeenCalledWith("set_b");
  });

  it("U-PG-03: セット 0 件は空状態メッセージ + セット作成導線", async () => {
    const store = await seed({ sets: [] });
    const { summary, setsRepo } = repos(store);
    wrap(
      <SummaryOverviewPage
        setsRepo={setsRepo}
        summaryRepo={summary}
        onSelectSet={() => {}}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(/まだセットがありません/)).toBeTruthy(),
    );
    expect(screen.getByRole("link", { name: /セットをつくる/ })).toBeTruthy();
  });

  it("U-PG-04 / U-OV-02: 記録ゼロのセットは 0分、他 owner の記録は集計しない", async () => {
    const store = await seed({
      sets: [{ id: "set_a", name: "平日の朝" }],
      foreignOwnerRecord: true,
    });
    const { summary, setsRepo } = repos(store);
    wrap(
      <SummaryOverviewPage
        setsRepo={setsRepo}
        summaryRepo={summary}
        onSelectSet={() => {}}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByText("平日の朝").length).toBeGreaterThan(0),
    );
    expect(screen.getByText("0分")).toBeTruthy(); // owner_2 の 99999 秒は混入しない
  });
});
