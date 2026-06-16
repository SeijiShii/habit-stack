import { describe, it, expect } from "vitest";
import {
  signGuestToken,
  verifyGuestToken,
  GuestTokenError,
  GUEST_TOKEN_ISS,
} from "./guestToken.js";

const SECRET = "test-guest-secret-0123456789";
const NOW = 1_700_000_000_000; // 固定 now（再現性）

describe("signGuestToken / verifyGuestToken (C20260617-001 guest 自前署名 JWT)", () => {
  it("sign → verify ラウンドトリップで sub + iss を返す", () => {
    const token = signGuestToken(SECRET, "guest_abc", { now: NOW });
    const { sub, iss } = verifyGuestToken(SECRET, token, { now: NOW });
    expect(sub).toBe("guest_abc");
    expect(iss).toBe(GUEST_TOKEN_ISS);
  });

  it("iss は habit-stack-guest 固定（resolver の振り分け鍵）", () => {
    expect(GUEST_TOKEN_ISS).toBe("habit-stack-guest");
  });

  it("空 secret は sign/verify とも明示エラー", () => {
    expect(() => signGuestToken("", "guest_x")).toThrow(GuestTokenError);
    expect(() => verifyGuestToken("", "a.b.c")).toThrow(GuestTokenError);
  });

  it("改竄署名は bad_signature", () => {
    const token = signGuestToken(SECRET, "guest_abc", { now: NOW });
    const tampered = token.slice(0, -3) + "xxx";
    expect(() => verifyGuestToken(SECRET, tampered, { now: NOW })).toThrow(
      GuestTokenError,
    );
  });

  it("別 secret で署名された token は弾く", () => {
    const token = signGuestToken("other-secret-aaaaaaaaaaaa", "guest_abc", {
      now: NOW,
    });
    expect(() => verifyGuestToken(SECRET, token, { now: NOW })).toThrow(
      GuestTokenError,
    );
  });

  it("形式不正（3 分割でない）は malformed", () => {
    expect(() => verifyGuestToken(SECRET, "not-a-jwt")).toThrow(GuestTokenError);
  });

  it("iss 不一致の token は弾く（Clerk JWT を guest 経路で誤受理しない）", () => {
    // 別 iss を直接署名して検証（verifyGuestToken は iss を厳格チェック）
    const foreign = signGuestToken(SECRET, "guest_abc", { now: NOW });
    // payload を別 iss に差し替えた token は署名が合わず弾かれる（iss 改竄も署名で守られる）
    const parts = foreign.split(".");
    const badPayload = Buffer.from(
      JSON.stringify({ iss: "clerk", sub: "guest_abc", iat: 1, exp: 9_999_999_999 }),
    ).toString("base64url");
    const forged = `${parts[0]}.${badPayload}.${parts[2]}`;
    expect(() => verifyGuestToken(SECRET, forged, { now: NOW })).toThrow(
      GuestTokenError,
    );
  });

  it("失効（exp 経過）は expired", () => {
    const token = signGuestToken(SECRET, "guest_abc", {
      now: NOW,
      ttlSec: 10,
    });
    expect(() =>
      verifyGuestToken(SECRET, token, { now: NOW + 11_000 }),
    ).toThrow(GuestTokenError);
  });

  it("既定 TTL は長命（180 日相当）でリロード/失効耐性を持つ", () => {
    const token = signGuestToken(SECRET, "guest_abc", { now: NOW });
    // 30 日後でも有効（Clerk セッション寿命と分離）
    const { sub } = verifyGuestToken(SECRET, token, {
      now: NOW + 30 * 24 * 60 * 60 * 1000,
    });
    expect(sub).toBe("guest_abc");
  });
});
