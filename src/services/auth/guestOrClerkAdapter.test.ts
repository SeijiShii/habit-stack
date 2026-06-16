import { describe, it, expect, vi } from "vitest";
import { createGuestOrClerkAuthAdapter } from "./guestOrClerkAdapter.js";
import { signGuestToken } from "./guestToken.js";
import type { AuthAdapter } from "./owner.js";

const SECRET = "adapter-secret-aaaaaaaaaaaa";
const reqWith = (auth?: string) =>
  new Request("https://x/api/sync/pull", {
    headers: auth ? { authorization: auth } : {},
  });

const clerkStub = (owner: string | null): AuthAdapter => ({
  resolveOwnerId: vi.fn(async () => owner),
});

describe("createGuestOrClerkAuthAdapter (C20260617-001 複合 resolver)", () => {
  it("有効な guest JWT Bearer → sub を owner に解決（Clerk は呼ばない）", async () => {
    const clerk = clerkStub("clerk_user");
    const adapter = createGuestOrClerkAuthAdapter({ guestSecret: SECRET, clerk });
    const token = signGuestToken(SECRET, "guest_abc");
    const owner = await adapter.resolveOwnerId(reqWith(`Bearer ${token}`));
    expect(owner).toBe("guest_abc");
    expect(clerk.resolveOwnerId).not.toHaveBeenCalled();
  });

  it("改竄/別 secret の guest JWT は null（Clerk に回さない＝なりすまし阻止、SEC-001）", async () => {
    const clerk = clerkStub("clerk_user");
    const adapter = createGuestOrClerkAuthAdapter({ guestSecret: SECRET, clerk });
    const forged = signGuestToken("WRONG-secret-bbbbbbbb", "guest_evil");
    const owner = await adapter.resolveOwnerId(reqWith(`Bearer ${forged}`));
    expect(owner).toBeNull();
    expect(clerk.resolveOwnerId).not.toHaveBeenCalled();
  });

  it("Bearer なし（cookie 経路）→ Clerk へフォールバック", async () => {
    const clerk = clerkStub("clerk_user");
    const adapter = createGuestOrClerkAuthAdapter({ guestSecret: SECRET, clerk });
    const owner = await adapter.resolveOwnerId(reqWith());
    expect(owner).toBe("clerk_user");
    expect(clerk.resolveOwnerId).toHaveBeenCalledTimes(1);
  });

  it("iss が guest でない Bearer（Clerk JWT 風）→ Clerk へフォールバック", async () => {
    const clerk = clerkStub("clerk_user");
    const adapter = createGuestOrClerkAuthAdapter({ guestSecret: SECRET, clerk });
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
      "base64url",
    );
    const payload = Buffer.from(JSON.stringify({ iss: "https://clerk.x" })).toString(
      "base64url",
    );
    const clerkish = `${header}.${payload}.sig`;
    const owner = await adapter.resolveOwnerId(reqWith(`Bearer ${clerkish}`));
    expect(owner).toBe("clerk_user");
    expect(clerk.resolveOwnerId).toHaveBeenCalledTimes(1);
  });

  it("未認証（Clerk も null）→ null（withOwner が 401）", async () => {
    const clerk = clerkStub(null);
    const adapter = createGuestOrClerkAuthAdapter({ guestSecret: SECRET, clerk });
    const owner = await adapter.resolveOwnerId(reqWith());
    expect(owner).toBeNull();
  });
});
