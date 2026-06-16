import { describe, it, expect, vi } from "vitest";
import {
  GUEST_TOKEN_KEY,
  getStoredGuestToken,
  storeGuestToken,
  clearGuestToken,
  fetchGuestToken,
  buildEnsureGuestToken,
  GuestTokenRateLimitedError,
  GuestTokenFetchError,
} from "./guestClient.js";

function memStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    _map: m,
  };
}

const ok = (body: unknown) =>
  ({ status: 200, ok: true, json: async () => body }) as Response;

describe("guestClient localStorage 永続 (C20260617-001)", () => {
  it("key は habit-stack.guestToken", () => {
    expect(GUEST_TOKEN_KEY).toBe("habit-stack.guestToken");
  });

  it("未保持なら getStored は null、store 後は再取得できる", () => {
    const s = memStorage();
    expect(getStoredGuestToken(s)).toBeNull();
    storeGuestToken("tok_1", s);
    expect(getStoredGuestToken(s)).toBe("tok_1");
  });

  it("clear で破棄（連携成功時に Clerk セッションへ切替）", () => {
    const s = memStorage({ [GUEST_TOKEN_KEY]: "tok_1" });
    clearGuestToken(s);
    expect(getStoredGuestToken(s)).toBeNull();
  });

  it("fetchGuestToken は {guestToken} を返す", async () => {
    const fetchFn = vi.fn(async () => ok({ guestToken: "gjwt_xyz" }));
    const tok = await fetchGuestToken(fetchFn as unknown as typeof fetch);
    expect(tok).toBe("gjwt_xyz");
    expect(fetchFn).toHaveBeenCalledWith(
      "/api/auth/guest",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("429 は RateLimited", async () => {
    const fetchFn = vi.fn(
      async () =>
        ({ status: 429, ok: false, json: async () => ({}) }) as Response,
    );
    await expect(
      fetchGuestToken(fetchFn as unknown as typeof fetch),
    ).rejects.toBeInstanceOf(GuestTokenRateLimitedError);
  });

  it("5xx は FetchError", async () => {
    const fetchFn = vi.fn(
      async () =>
        ({ status: 503, ok: false, json: async () => ({}) }) as Response,
    );
    await expect(
      fetchGuestToken(fetchFn as unknown as typeof fetch),
    ).rejects.toBeInstanceOf(GuestTokenFetchError);
  });

  it("guestToken 欠落レスポンスは FetchError", async () => {
    const fetchFn = vi.fn(async () => ok({}));
    await expect(
      fetchGuestToken(fetchFn as unknown as typeof fetch),
    ).rejects.toBeInstanceOf(GuestTokenFetchError);
  });

  it("buildEnsureGuestToken: 未保持なら 1 度取得して保持", async () => {
    const s = memStorage();
    const fetchToken = vi.fn(async () => "gjwt_new");
    const ensure = buildEnsureGuestToken({
      fetchToken,
      getStored: () => getStoredGuestToken(s),
      store: (t) => storeGuestToken(t, s),
    });
    await ensure();
    expect(fetchToken).toHaveBeenCalledTimes(1);
    expect(getStoredGuestToken(s)).toBe("gjwt_new");
  });

  it("buildEnsureGuestToken: 保持済なら no-op（再 fetch しない = 同一 sub 維持）", async () => {
    const s = memStorage({ [GUEST_TOKEN_KEY]: "gjwt_existing" });
    const fetchToken = vi.fn(async () => "gjwt_new");
    const ensure = buildEnsureGuestToken({
      fetchToken,
      getStored: () => getStoredGuestToken(s),
      store: (t) => storeGuestToken(t, s),
    });
    await ensure();
    expect(fetchToken).not.toHaveBeenCalled();
    expect(getStoredGuestToken(s)).toBe("gjwt_existing");
  });

  it("localStorage 不可環境（null storage）でも例外で停止しない", () => {
    expect(getStoredGuestToken(null)).toBeNull();
    expect(() => storeGuestToken("x", null)).not.toThrow();
    expect(() => clearGuestToken(null)).not.toThrow();
  });
});
