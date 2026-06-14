import { describe, it, expect } from "vitest";
import { displayEmail } from "./AuthProvider.js";

describe("displayEmail (C20260614-002: 合成ゲスト email を見せない)", () => {
  const SYNTH = "guest_40b6a6f2@guests.habit-stack.givers.work";

  it("Google 連携済み: 外部(Google) email を優先表示", () => {
    expect(displayEmail("me@gmail.com", SYNTH)).toBe("me@gmail.com");
  });

  it("外部 email 無し + primary が合成ゲスト: 表示しない（undefined）", () => {
    expect(displayEmail(undefined, SYNTH)).toBeUndefined();
  });

  it("外部 email 無し + primary が実 email: 実 email を表示", () => {
    expect(displayEmail(undefined, "real@example.com")).toBe(
      "real@example.com",
    );
  });

  it("どちらも無し: undefined", () => {
    expect(displayEmail(undefined, undefined)).toBeUndefined();
  });
});
