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
  });

  it("未確立は null", () => {
    useAuthMock.mockReturnValue({ isLoaded: true, userId: null });
    const { result } = renderHook(() => useOwner());
    expect(result.current.ownerId).toBeNull();
  });
});
