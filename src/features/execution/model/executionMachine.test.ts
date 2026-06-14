import { describe, it, expect } from "vitest";
import {
  startSession,
  endCurrentItem,
  pause,
  resumeSame,
  nextItem,
  endSession,
  doneItemCount,
  type ExecState,
} from "./executionMachine.js";
import { elapsedSec } from "./elapsed.js";

const T = (h: number, m = 0, s = 0) =>
  `2026-06-08T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.000Z`;

const start = (): ExecState => startSession("set_1", ["i1", "i2", "i3"], T(8));

describe("elapsed", () => {
  it("N6: 経過 = 差分 - pause", () => {
    expect(elapsedSec(T(8, 0, 0), T(8, 2, 0), 30)).toBe(90); // 120s - 30
  });
  it("E1: 端末時計戻りは 0 クランプ", () => {
    expect(elapsedSec(T(8, 5), T(8, 0), 0)).toBe(0);
  });
});

describe("executionMachine 遷移", () => {
  it("N1: start で running + 先頭 record", () => {
    const s = start();
    expect(s.status).toBe("running");
    expect(s.records).toHaveLength(1);
    expect(s.records[0].itemId).toBe("i1");
  });

  it("N2: endItem→next で現 record 終了 + 次 record", () => {
    let s = start();
    s = nextItem(s, T(8, 1)); // i1 終了(60s) → i2 開始
    expect(s.index).toBe(1);
    expect(s.records[0].endedAt).toBe(T(8, 1));
    expect(s.records[0].elapsedSec).toBe(60);
    expect(s.records[1].itemId).toBe("i2");
  });

  it("N3: pause→resumeSame で pause 分を経過から除外（1:N period）", () => {
    let s = start(); // i1 start 08:00
    s = pause(s, T(8, 1)); // 1 分後 pause → period[0] を 08:01 で閉じる
    s = resumeSame(s, T(8, 3)); // 2 分後 resume → 新 period[1] 開始
    s = endCurrentItem(s, T(8, 4)); // 08:04 終了 → period[1] を閉じる
    // periods = [{08:00,08:01},{08:03,08:04}] → 60 + 60 = 120（中断 08:01-08:03 は除外）
    expect(s.records[0].periods).toEqual([
      { startedAt: T(8, 0), endedAt: T(8, 1) },
      { startedAt: T(8, 3), endedAt: T(8, 4) },
    ]);
    expect(s.records[0].elapsedSec).toBe(120);
    // 表示開始時刻は最初の period の開始（妥協、R20260614-002）。
    expect(s.records[0].startedAt).toBe(T(8, 0));
  });

  it("N3b: pause したまま再開せず次活動へ → 中断時間を経過に算入しない（R20260614-002 バグ修正）", () => {
    let s = start(); // i1 start 08:00
    s = pause(s, T(8, 1)); // 08:01 で中断（period を閉じる）
    s = nextItem(s, T(8, 5)); // 再開せず 08:05 に次活動へ
    // i1 の経過は 08:00-08:01 = 60s のみ。中断 08:01-08:05（240s）は算入しない。
    expect(s.records[0].elapsedSec).toBe(60);
    expect(s.records[0].periods).toEqual([
      { startedAt: T(8, 0), endedAt: T(8, 1) },
    ]);
    expect(s.records[1].itemId).toBe("i2");
    expect(s.records[1].startedAt).toBe(T(8, 5));
  });

  it("N3c: 複数回の中断（1:N period、無制限）", () => {
    let s = start(); // 08:00
    s = pause(s, T(8, 1)); // [08:00,08:01]
    s = resumeSame(s, T(8, 2)); // [08:02,..
    s = pause(s, T(8, 3)); // [08:02,08:03]
    s = resumeSame(s, T(8, 5)); // [08:05,..
    s = endCurrentItem(s, T(8, 6)); // [08:05,08:06]
    // 60 + 60 + 60 = 180（中断 2 回ぶんを除外）
    expect(s.records[0].periods).toHaveLength(3);
    expect(s.records[0].elapsedSec).toBe(180);
  });

  it("N5/N4: 最終アイテムで nextItem → done", () => {
    let s = start();
    s = nextItem(s, T(8, 1)); // i2
    s = nextItem(s, T(8, 2)); // i3
    s = nextItem(s, T(8, 3)); // 最終 → done
    expect(s.status).toBe("done");
    expect(s.endedAt).toBe(T(8, 3));
  });

  it("endSession で done + 現アイテム終了", () => {
    let s = start();
    s = endSession(s, T(8, 5));
    expect(s.status).toBe("done");
    expect(s.records[0].endedAt).toBe(T(8, 5));
  });
});

describe("達成判定 (穴あき許容、D20260608-003)", () => {
  it("B3: 1 アイテムだけ実行でも doneItemCount ≥ 1", () => {
    let s = start();
    s = endSession(s, T(8, 1)); // i1 のみ実行、i2/i3 未実行
    expect(doneItemCount(s)).toBe(1); // 穴あきでも達成（≥1）
  });

  it("B2: 全アイテム実行で doneItemCount = 全件", () => {
    let s = start();
    s = nextItem(s, T(8, 1));
    s = nextItem(s, T(8, 2));
    s = endSession(s, T(8, 3));
    expect(doneItemCount(s)).toBe(3);
  });
});
