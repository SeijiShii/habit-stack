// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalStore } from "../../services/sync/localStore.js";
import { ExecutionRepo } from "./model/executionRepo.js";
import { ExecutionPage } from "./ExecutionPage.js";
import { asOwnerId } from "../../types/domain.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const items = [
  { id: "i1", name: "ストレッチ" },
  { id: "i2", name: "英単語" },
];

async function setup() {
  const repo = new ExecutionRepo(await LocalStore.open(), asOwnerId("owner_1"));
  render(
    <ExecutionPage
      repo={repo}
      setId="set_1"
      setName="平日の朝"
      items={items}
      sessionLocalId="sess_1"
    />,
  );
  return repo;
}

describe("ExecutionPage (UC4)", () => {
  it("開始 → 現アイテム表示 → 次の活動へ → セット終了で完了 + 達成記録", async () => {
    await setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "開始" }));
    expect(screen.getByTestId("current-item").textContent).toBe("ストレッチ");

    await user.click(screen.getByRole("button", { name: "次の活動へ" }));
    await waitFor(() =>
      expect(screen.getByTestId("current-item").textContent).toBe("英単語"),
    );

    await user.click(screen.getByRole("button", { name: "セット終了" }));
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());

    // 達成（穴あき許容）が記録されている
    const store = await LocalStore.open();
    const all = await store.getAllByOwner("daily_achievement", "owner_1");
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ achieved: true });
  });

  it("U1: running に「終了」ボタンが無く、次の活動へ/一時停止/セット終了がある (R20260610-001)", async () => {
    await setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "開始" }));

    expect(screen.queryByRole("button", { name: "終了" })).toBeNull();
    expect(screen.getByRole("button", { name: "次の活動へ" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "一時停止" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "セット終了" })).toBeTruthy();
  });

  it("U3: 一時停止中の次ボタンも「次の活動へ」(表記統一) (R20260610-001)", async () => {
    await setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "開始" }));
    await user.click(screen.getByRole("button", { name: "一時停止" }));

    expect(screen.getByRole("button", { name: "同じ活動を再開" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "次の活動へ" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "次を開始" })).toBeNull();
  });

  it("開始後にメモ入力できる", async () => {
    await setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "開始" }));
    await user.type(screen.getByLabelText("今日のメモ"), "5ページ読んだ");
    expect(
      (screen.getByLabelText("今日のメモ") as HTMLTextAreaElement).value,
    ).toBe("5ページ読んだ");
  });
});

describe("ExecutionPage 計時中表示 (fix C20260610-001)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // userEvent + fake timers はハングしやすいため fireEvent + act で駆動する。
  // IndexedDB を開くのは実タイマー下で行い、その後 fake timers に切替える。
  async function startTimed(now: () => string, sessionLocalId: string) {
    const repo = new ExecutionRepo(
      await LocalStore.open(),
      asOwnerId("owner_1"),
    );
    vi.useFakeTimers();
    render(
      <ExecutionPage
        repo={repo}
        setId="set_1"
        setName="平日の朝"
        items={items}
        sessionLocalId={sessionLocalId}
        now={now}
      />,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "開始" }));
    });
  }

  it("R1: 計時中に経過時間がライブ更新される (00:00 のまま固まらない)", async () => {
    let clock = Date.parse("2026-06-10T09:00:00.000Z");
    const now = () => new Date(clock).toISOString();
    await startTimed(now, "sess_r1");

    expect(screen.getByTestId("elapsed").textContent).toBe("00:00");

    // 65 秒経過 → tick 発火で再描画
    act(() => {
      clock += 65_000;
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("elapsed").textContent).toBe("01:05");
  });

  it("R5: 一時停止中は経過が凍結する", async () => {
    let clock = Date.parse("2026-06-10T09:00:00.000Z");
    const now = () => new Date(clock).toISOString();
    await startTimed(now, "sess_r5");

    act(() => {
      clock += 30_000;
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("elapsed").textContent).toBe("00:30");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "一時停止" }));
    });
    // 一時停止後にさらに時間が進んでも凍結
    act(() => {
      clock += 60_000;
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("elapsed").textContent).toBe("00:30");
  });

  it("R3/R4: 計時中は開始時刻と現在時刻を表示する", async () => {
    let clock = Date.parse("2026-06-10T09:00:00.000Z");
    const now = () => new Date(clock).toISOString();
    await startTimed(now, "sess_r3");

    const startedAt = screen.getByTestId("started-at");
    const currentTime = screen.getByTestId("current-time");
    expect(startedAt.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(currentTime.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it("R7: 一時停止中も現在時刻はライブ更新される (経過は凍結のまま)", async () => {
    let clock = Date.parse("2026-06-10T09:00:00.000Z");
    const now = () => new Date(clock).toISOString();
    await startTimed(now, "sess_r7");

    act(() => {
      clock += 30_000;
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "一時停止" }));
    });
    const beforeClock = screen.getByTestId("current-time").textContent;

    // 一時停止中に実時間が 2 分進む
    act(() => {
      clock += 120_000;
      vi.advanceTimersByTime(1000);
    });
    // 現在時刻は進む（時計が止まって見えない）
    expect(screen.getByTestId("current-time").textContent).not.toBe(
      beforeClock,
    );
    // 経過時間は一時停止時点で凍結
    expect(screen.getByTestId("elapsed").textContent).toBe("00:30");
  });
});
