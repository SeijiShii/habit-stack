import { describe, it, expect, vi } from "vitest";
import type { ClerkClient } from "@clerk/backend";
import { issueGuestTicket, refreshGuestTicket } from "./guestSession.js";

const mockClient = (): ClerkClient =>
  ({
    users: { createUser: vi.fn(async () => ({ id: "user_g1" })) },
    signInTokens: {
      createSignInToken: vi.fn(async () => ({ token: "tk_123" })),
    },
  }) as unknown as ClerkClient;

describe("issueGuestTicket", () => {
  it("空 secretKey で明示エラー", async () => {
    await expect(
      issueGuestTicket({ secretKey: "", publishableKey: "pk" }),
    ).rejects.toThrow("CLERK_SECRET_KEY が必要です");
  });

  it("ゲストユーザー作成 + サインインチケット発行", async () => {
    const client = mockClient();
    const result = await issueGuestTicket({
      secretKey: "sk_test",
      publishableKey: "pk_test",
      client,
    });
    expect(result).toEqual({ ticket: "tk_123", userId: "user_g1" });
    // Clerk createUser は識別子（email）+ password 必須（CF-20260529-016）。
    const args = vi.mocked(client.users.createUser).mock.calls[0][0];
    expect(args).toEqual(
      expect.objectContaining({
        skipPasswordChecks: true,
        publicMetadata: { guest: true },
      }),
    );
    expect(args.emailAddress?.[0]).toMatch(/^guest_.+@/);
    expect(typeof args.password).toBe("string");
    expect((args.password as string).length).toBeGreaterThan(0);
  });
});

describe("refreshGuestTicket (CF-20260614-002: reverification 回避)", () => {
  it("同一 userId に対しチケットを再発行（createUser しない = userId churn なし）", async () => {
    const client = mockClient();
    const result = await refreshGuestTicket(
      { secretKey: "sk_test", publishableKey: "pk_test", client },
      "user_existing",
    );
    expect(result).toEqual({ ticket: "tk_123", userId: "user_existing" });
    // 既存ユーザーの refresh なので createUser は呼ばない（データ所有を保つ）。
    expect(client.users.createUser).not.toHaveBeenCalled();
    expect(
      vi.mocked(client.signInTokens.createSignInToken).mock.calls[0][0],
    ).toEqual(expect.objectContaining({ userId: "user_existing" }));
  });

  it("空 secretKey で明示エラー", async () => {
    await expect(
      refreshGuestTicket({ secretKey: "", publishableKey: "pk" }, "user_x"),
    ).rejects.toThrow("CLERK_SECRET_KEY が必要です");
  });
});
