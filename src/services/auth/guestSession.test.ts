import { describe, it, expect, vi } from "vitest";
import type { ClerkClient } from "@clerk/backend";
import { issueGuestTicket } from "./guestSession.js";

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
