import { describe, it, expect } from "vitest";
import {
  markDeviceOverwrite,
  consumeDeviceOverwrite,
} from "./deviceOverwrite.js";

/** sessionStorage 非依存に検証するためのインメモリ storage。 */
function memStorage() {
  const m = new Map<string, string>();
  return {
    setItem: (k: string, v: string) => void m.set(k, v),
    getItem: (k: string) => m.get(k) ?? null,
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("deviceOverwrite (R20260615-001 / spec-review R2)", () => {
  it("mark→consume で true を返し 1 回限りで消費される", () => {
    const s = memStorage();
    markDeviceOverwrite(s);
    expect(consumeDeviceOverwrite(s)).toBe(true);
    // 2 回目は false（消費済み）
    expect(consumeDeviceOverwrite(s)).toBe(false);
  });

  it("mark していなければ consume は false（ゲスト churn 等では wipe しない）", () => {
    const s = memStorage();
    expect(consumeDeviceOverwrite(s)).toBe(false);
  });

  it("storage が null（利用不可）でも例外を投げない", () => {
    expect(() => markDeviceOverwrite(null)).not.toThrow();
    expect(consumeDeviceOverwrite(null)).toBe(false);
  });
});
