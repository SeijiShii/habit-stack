import { describe, it, expect, afterEach } from "vitest";
import { handleGuestProvision } from "./guest.js";
import { verifyGuestToken } from "../../src/services/auth/guestToken.js";

const post = () =>
  new Request("https://app.test/api/auth/guest", { method: "POST" });

afterEach(() => {
  delete process.env.GUEST_TOKEN_SECRET;
});

describe("handleGuestProvision (C20260617-001 guest 自前署名 JWT)", () => {
  it("GUEST_TOKEN_SECRET 未設定で 503 degrade（offline 継続）", async () => {
    const res = await handleGuestProvision(post());
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toBe(
      "guest_unavailable",
    );
  });

  it("secret 設定時は verify 可能な guestToken を返す（Clerk createUser しない）", async () => {
    process.env.GUEST_TOKEN_SECRET = "endpoint-secret-aaaaaaaaaaaa";
    const res = await handleGuestProvision(post());
    expect(res.status).toBe(200);
    const { guestToken } = (await res.json()) as { guestToken: string };
    const { sub } = verifyGuestToken(process.env.GUEST_TOKEN_SECRET, guestToken);
    expect(sub).toMatch(/^guest_/);
  });

  it("POST 以外は 405", async () => {
    process.env.GUEST_TOKEN_SECRET = "endpoint-secret-aaaaaaaaaaaa";
    const res = await handleGuestProvision(
      new Request("https://app.test/api/auth/guest", { method: "GET" }),
    );
    expect(res.status).toBe(405);
  });
});
