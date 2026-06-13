// TZ 依存の境界を検証するため Asia/Tokyo に固定（UTC slice との乖離を再現する）。
process.env.TZ = "Asia/Tokyo";

import { describe, it, expect } from "vitest";
import { localDateOf, formatDuration, formatDateLabel } from "./localDate.js";

describe("localDateOf", () => {
  it("U-LD-01: ローカル日付コンポーネントで YYYY-MM-DD を返す", () => {
    expect(localDateOf(new Date(2026, 5, 13, 8, 0))).toBe("2026-06-13");
  });

  it("U-LD-01b: UTC 日付とズレるケース（JST 早朝 = UTC 前日）でローカル日付を返す", () => {
    // 2026-06-12T23:30:00Z = JST 2026-06-13 08:30
    const d = new Date("2026-06-12T23:30:00.000Z");
    expect(d.toISOString().slice(0, 10)).toBe("2026-06-12"); // UTC slice は前日
    expect(localDateOf(d)).toBe("2026-06-13"); // ローカルでは当日
  });

  it("U-LD-03: ローカル日付境界（00:00 / 23:59）は同一ローカル日付", () => {
    expect(localDateOf(new Date(2026, 5, 13, 0, 0))).toBe("2026-06-13");
    expect(localDateOf(new Date(2026, 5, 13, 23, 59))).toBe("2026-06-13");
  });

  it("U-LD-04: 月・日のゼロ埋め", () => {
    expect(localDateOf(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("formatDuration", () => {
  it("U-LD-02: 0 / 分のみ / 時間+分 / ちょうど時間", () => {
    expect(formatDuration(0)).toBe("0分");
    expect(formatDuration(90)).toBe("1分");
    expect(formatDuration(3661)).toBe("1時間1分");
    expect(formatDuration(7200)).toBe("2時間");
  });
});

describe("formatDateLabel", () => {
  it("U-LD-05: ISO をローカルの「M/D(曜)」表示にする", () => {
    // 2026-06-12T16:00:00Z = JST 2026-06-13(土) 01:00
    expect(formatDateLabel("2026-06-12T16:00:00.000Z")).toBe("6/13(土)");
  });

  it("U-LD-06: 空文字 / 不正値は空文字", () => {
    expect(formatDateLabel("")).toBe("");
    expect(formatDateLabel("not-a-date")).toBe("");
  });
});
