import { describe, it, expect } from "vitest";
import { summarize, enumerateDates, type AchievementDay } from "./summarize.js";

const ach = (date: string, n = 1): AchievementDay => ({
  date,
  itemDoneCount: n,
});

describe("enumerateDates", () => {
  it("start..end の日付配列", () => {
    expect(enumerateDates("2026-06-06", "2026-06-08")).toEqual([
      "2026-06-06",
      "2026-06-07",
      "2026-06-08",
    ]);
  });
});

describe("summarize", () => {
  const dates = enumerateDates("2026-06-01", "2026-06-10"); // 10 日

  it("N1: 継続率 = 達成日/対象日", () => {
    const s = summarize(
      [
        "2026-06-01",
        "2026-06-02",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-04",
      ].map((d) => ach(d)),
      dates,
    );
    expect(s.achievedDays).toBe(7);
    expect(s.totalDays).toBe(10);
    expect(s.rate).toBeCloseTo(0.7);
  });

  it("N2: currentStreak = 末尾からの連続達成", () => {
    const s = summarize(
      ["2026-06-08", "2026-06-09", "2026-06-10"].map((d) => ach(d)),
      dates,
    );
    expect(s.currentStreak).toBe(3);
  });

  it("B2: 連続途切れ（1 日抜け）で streak リセット、エラー表現なし", () => {
    const s = summarize(
      ["2026-06-08", "2026-06-10"].map((d) => ach(d)),
      dates,
    );
    expect(s.currentStreak).toBe(1); // 末尾 10 のみ連続（9 が抜け）
    // 未達は dots で achieved=false（中立、咎めない）
    expect(s.dots.find((d) => d.date === "2026-06-09")?.achieved).toBe(false);
  });

  it("E1: 達成ゼロは isEmpty=true, rate=0", () => {
    const s = summarize([], dates);
    expect(s.isEmpty).toBe(true);
    expect(s.rate).toBe(0);
    expect(s.achievedDays).toBe(0);
  });

  it("U-ST-01: 末尾(今日)のみ未達なら前日から数える（today-pending 許容）", () => {
    const s = summarize(
      ["2026-06-08", "2026-06-09"].map((d) => ach(d)),
      dates,
    );
    expect(s.currentStreak).toBe(2); // 6/10 未実施でも 0 にしない
  });

  it("U-ST-02: 末尾(今日)達成済みなら今日を含めて数える", () => {
    const s = summarize(
      ["2026-06-08", "2026-06-09", "2026-06-10"].map((d) => ach(d)),
      dates,
    );
    expect(s.currentStreak).toBe(3);
  });

  it("U-ST-03: 末尾未達かつ前日も未達なら 0", () => {
    const s = summarize(
      ["2026-06-05"].map((d) => ach(d)),
      dates,
    );
    expect(s.currentStreak).toBe(0);
  });

  it("U-ST-04: 期間 1 日のみ・未達はスキップで配列外に出ず 0", () => {
    const s = summarize([], enumerateDates("2026-06-10", "2026-06-10"));
    expect(s.currentStreak).toBe(0);
  });

  it("B1: 穴あき日（itemDoneCount=1）も達成カウント", () => {
    const s = summarize(
      [ach("2026-06-10", 1)],
      enumerateDates("2026-06-10", "2026-06-10"),
    );
    expect(s.achievedDays).toBe(1);
    expect(s.rate).toBe(1);
  });
});
