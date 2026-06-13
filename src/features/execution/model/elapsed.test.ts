import { describe, it, expect } from "vitest";
import {
  elapsedSec,
  diffSec,
  cappedElapsedSec,
  sessionElapsedSec,
  MAX_ACTIVITY_SEC,
} from "./elapsed.js";

const T = (h: number, m = 0, s = 0) =>
  `2026-06-08T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.000Z`;

const rec = (
  startedAt: string,
  endedAt: string | null,
  elapsed: number,
  pausedTotalSec = 0,
) => ({ startedAt, endedAt, elapsedSec: elapsed, pausedTotalSec });

describe("elapsedSec", () => {
  it("差分 - 一時停止累計", () => {
    expect(elapsedSec(T(9), T(10), 0)).toBe(3600);
    expect(elapsedSec(T(9), T(10), 600)).toBe(3000);
  });
  it("端末時計巻き戻しは 0", () => {
    expect(elapsedSec(T(10), T(9), 0)).toBe(0);
  });
});

describe("diffSec", () => {
  it("2 時刻の差（負値 0）", () => {
    expect(diffSec(T(9), T(9, 5))).toBe(300);
    expect(diffSec(T(9, 5), T(9))).toBe(0);
  });
});

describe("cappedElapsedSec (R1: 1活動 最大4H)", () => {
  it("MAX_ACTIVITY_SEC = 14400 (4H)", () => {
    expect(MAX_ACTIVITY_SEC).toBe(4 * 60 * 60);
  });
  it("U-R1-01: 4H 未満はクランプなし", () => {
    expect(cappedElapsedSec(T(9), T(12), 0)).toBe(3 * 3600);
  });
  it("U-R1-02: 5H はクランプ", () => {
    expect(cappedElapsedSec(T(9), T(14), 0)).toBe(MAX_ACTIVITY_SEC);
  });
  it("U-R1-B1: 14399 はそのまま", () => {
    expect(cappedElapsedSec(T(9), T(12, 59, 59), 0)).toBe(14399);
  });
  it("U-R1-B2: 14400 はそのまま", () => {
    expect(cappedElapsedSec(T(9), T(13), 0)).toBe(14400);
  });
  it("U-R1-B3: 14401 は 14400 にクランプ", () => {
    expect(cappedElapsedSec(T(9), T(13, 0, 1), 0)).toBe(14400);
  });
  it("U-R1-E1: 負値は 0", () => {
    expect(cappedElapsedSec(T(13), T(9), 0)).toBe(0);
  });
});

describe("sessionElapsedSec (R20260613-004: セット全体の経過秒)", () => {
  it("U1: 終了済み record の合計", () => {
    const s = {
      status: "running" as const,
      pauseStartedAt: null,
      records: [rec(T(9), T(9, 2), 120), rec(T(9, 2), T(9, 5), 180)],
    };
    expect(sessionElapsedSec(s, T(9, 5))).toBe(300);
  });
  it("U2: 終了済み + 進行中(running, live)", () => {
    const s = {
      status: "running" as const,
      pauseStartedAt: null,
      records: [rec(T(9), T(9, 2), 120), rec(T(9, 2), null, 0)],
    };
    // 確定 120 + live(9:02→9:02:30 = 30) = 150
    expect(sessionElapsedSec(s, T(9, 2, 30))).toBe(150);
  });
  it("U3: paused は進行中分を pauseStartedAt で凍結", () => {
    const s = {
      status: "paused" as const,
      pauseStartedAt: T(9, 2, 30),
      records: [rec(T(9), T(9, 2), 120), rec(T(9, 2), null, 0)],
    };
    // now が進んでも 9:02:30 で凍結 → 120 + 30 = 150
    expect(sessionElapsedSec(s, T(9, 10))).toBe(150);
  });
  it("U6: 巻き戻し（now < startedAt）でも負にならない", () => {
    const s = {
      status: "running" as const,
      pauseStartedAt: null,
      records: [rec(T(9), null, 0)],
    };
    expect(sessionElapsedSec(s, T(8))).toBe(0);
  });
  it("U7: 進行中 record が 4H 超なら 4H にクランプして合算", () => {
    const s = {
      status: "running" as const,
      pauseStartedAt: null,
      records: [rec(T(0), T(0, 1), 60), rec(T(1), null, 0)],
    };
    // 確定 60 + capped(1:00→6:00 = 5H → 4H=14400) = 14460
    expect(sessionElapsedSec(s, T(6))).toBe(60 + MAX_ACTIVITY_SEC);
  });
  it("U8: record 0 本 / 開始直後 0s は 0", () => {
    expect(
      sessionElapsedSec(
        { status: "running", pauseStartedAt: null, records: [] },
        T(9),
      ),
    ).toBe(0);
    expect(
      sessionElapsedSec(
        {
          status: "running",
          pauseStartedAt: null,
          records: [rec(T(9), null, 0)],
        },
        T(9),
      ),
    ).toBe(0);
  });
});
