// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const useAuthMock = vi.fn();
vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => useAuthMock(),
}));

import { useOwner } from "./useOwner.js";

beforeEach(() => useAuthMock.mockReset());

describe("useOwner", () => {
  it("認証済み userId を OwnerId として返す", () => {
    useAuthMock.mockReturnValue({ isLoaded: true, userId: "user_42" });
    const { result } = renderHook(() => useOwner());
    expect(result.current.ownerId).toBe("user_42");
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isLocalGuest).toBe(false);
  });

  it("未ロードは null", () => {
    useAuthMock.mockReturnValue({ isLoaded: false, userId: null });
    const { result } = renderHook(() => useOwner());
    expect(result.current.ownerId).toBeNull();
    expect(result.current.isLoaded).toBe(false);
  });

  it("Clerk 未確立（オフライン/キー無）はローカルゲストにフォールバック（offline-first）", () => {
    localStorage.clear();
    useAuthMock.mockReturnValue({ isLoaded: true, userId: null });
    const { result } = renderHook(() => useOwner());
    expect(result.current.ownerId).toMatch(/^local-guest-/);
    expect(result.current.isLocalGuest).toBe(true);
    // 同一端末では安定（永続）
    const { result: r2 } = renderHook(() => useOwner());
    expect(r2.current.ownerId).toBe(result.current.ownerId);
  });
});
