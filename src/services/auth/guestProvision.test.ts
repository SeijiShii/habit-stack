import { describe, it, expect, vi } from "vitest";
import { provisionGuest, defaultGenSub } from "./guestProvision.js";
import { signGuestToken, verifyGuestToken } from "./guestToken.js";

describe("provisionGuest (C20260617-001 guest 自前署名 JWT 発行)", () => {
  it("genSub の sub を署名した guestToken を返す（Clerk createUser しない）", () => {
    const signToken = vi.fn((sub: string) => `signed:${sub}`);
    const { guestToken, sub } = provisionGuest({
      signToken,
      genSub: () => "guest_fixed",
    });
    expect(sub).toBe("guest_fixed");
    expect(guestToken).toBe("signed:guest_fixed");
    expect(signToken).toHaveBeenCalledWith("guest_fixed");
  });

  it("実 signGuestToken と組み合わせると verify できる（往復）", () => {
    const SECRET = "prov-secret-aaaaaaaaaaaa";
    const { guestToken, sub } = provisionGuest({
      signToken: (s) => signGuestToken(SECRET, s),
      genSub: () => "guest_roundtrip",
    });
    const v = verifyGuestToken(SECRET, guestToken);
    expect(v.sub).toBe(sub);
    expect(v.sub).toBe("guest_roundtrip");
  });

  it("defaultGenSub は guest_ プレフィックスの一意 id", () => {
    const a = defaultGenSub();
    const b = defaultGenSub();
    expect(a).toMatch(/^guest_[0-9a-f-]{36}$/);
    expect(a).not.toBe(b);
  });
});
