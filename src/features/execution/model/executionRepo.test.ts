import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { LocalStore } from "../../../services/sync/localStore.js";
import { ExecutionRepo, localDate } from "./executionRepo.js";
import {
  startSession,
  endSession,
  nextItem,
  pause,
} from "./executionMachine.js";
import { asOwnerId } from "../../../types/domain.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const T = (h: number, m = 0) =>
  `2026-06-08T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`;

const repo = async () =>
  new ExecutionRepo(await LocalStore.open(), asOwnerId("owner_1"), {
    now: () => T(9),
  });

describe("ExecutionRepo", () => {
  it("N7: persist で session + records 保存 + 穴あき達成 upsert", async () => {
    const r = await repo();
    let s = startSession("set_1", ["i1", "i2"], T(8));
    s = endSession(s, T(8, 1)); // i1 のみ実行（穴あき）
    await r.persist("sess_1", s);

    const store = await LocalStore.open();
    expect(await store.get("execution_session", "sess_1")).toMatchObject({
      status: "done",
    });
    expect(await store.get("execution_record", "sess_1:i1")).toMatchObject({
      itemId: "i1",
    });
    // 達成（穴あき許容）
    const ach = await store.get(
      "daily_achievement",
      "owner_1:set_1:2026-06-08",
    );
    expect(ach).toMatchObject({ achieved: true, itemDoneCount: 1 });
  });

  it("B2: 全アイテム実行で itemDoneCount = 全件", async () => {
    const r = await repo();
    let s = startSession("set_1", ["i1", "i2"], T(8));
    s = nextItem(s, T(8, 1)); // i2
    s = endSession(s, T(8, 2));
    await r.persist("sess_2", s);
    const store = await LocalStore.open();
    expect(
      await store.get("daily_achievement", "owner_1:set_1:2026-06-08"),
    ).toMatchObject({
      itemDoneCount: 2,
    });
  });

  it("E3: findInProgress で進行中 session を復元", async () => {
    const r = await repo();
    const s = startSession("set_1", ["i1"], T(8)); // running
    await r.persist("sess_run", s);
    const found = await r.findInProgress();
    expect(found?.id).toBe("sess_run");
  });

  it("localDate", () => {
    expect(localDate("2026-06-08T23:59:00.000Z")).toBe("2026-06-08");
  });

  it("U-REC-05: restoreInProgress は ExecState を損失なく復元 + found id を採用", async () => {
    const r = await repo();
    let s = startSession("set_1", ["i1", "i2"], T(8));
    s = nextItem(s, T(8, 1)); // i2 へ（running, index=1, i1 確定）
    s = pause(s, T(8, 2)); // paused
    await r.persist("sess-set_1-2026-06-08", s, { lastSavedAt: T(8, 2) });

    const restored = await r.restoreInProgress();
    expect(restored?.id).toBe("sess-set_1-2026-06-08"); // 日付スタンプ id を採用
    expect(restored?.lastSavedAt).toBe(T(8, 2));
    expect(restored?.state).toMatchObject({
      setId: "set_1",
      status: "paused",
      index: 1,
      itemIds: ["i1", "i2"],
      pauseStartedAt: T(8, 2),
    });
    expect(restored?.state.records).toHaveLength(2);
  });

  it("U-REC-06: endInProgressNow — 0 秒放置は達成記録しない（strict, R3）", async () => {
    const r = await repo();
    const s = startSession("set_1", ["i1"], T(9)); // running, 経過 0
    await r.persist("sess_idle", s, { lastSavedAt: T(9) });
    const ended = await r.endInProgressNow(T(9)); // now=開始時刻 → 経過0
    expect(ended?.status).toBe("done");
    const store = await LocalStore.open();
    expect(
      await store.get("daily_achievement", "owner_1:set_1:2026-06-08"),
    ).toBeUndefined();
  });

  it("U-REC-07 / R8: endInProgressNow — 有効経過>0 なら done + 達成 + endedAt=now", async () => {
    const r = await repo();
    const s = startSession("set_1", ["i1"], T(9));
    await r.persist("sess_live", s, { lastSavedAt: T(9, 30) });
    const ended = await r.endInProgressNow(T(9, 30)); // 30 分経過
    expect(ended?.status).toBe("done");
    expect(ended?.endedAt).toBe(T(9, 30));
    const store = await LocalStore.open();
    expect(
      await store.get("daily_achievement", "owner_1:set_1:2026-06-08"),
    ).toMatchObject({ achieved: true });
  });

  it("endInProgressNow — 進行中なしは no-op", async () => {
    const r = await repo();
    expect(await r.endInProgressNow(T(9))).toBeUndefined();
  });
});
