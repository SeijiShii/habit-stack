import { describe, it, expect } from "vitest";
import { displayEmail, pickOwnerId } from "./AuthProvider.js";

describe("displayEmail (C20260614-002: 合成ゲスト email を見せない)", () => {
  const SYNTH = "guest_40b6a6f2@guests.habit-stack.givers.work";

  it("Google 連携済み: 外部(Google) email を優先表示", () => {
    expect(displayEmail("me@gmail.com", SYNTH)).toBe("me@gmail.com");
  });

  it("外部 email 無し + primary が合成ゲスト: 表示しない（undefined）", () => {
    expect(displayEmail(undefined, SYNTH)).toBeUndefined();
  });

  it("外部 email 無し + primary が実 email: 実 email を表示", () => {
    expect(displayEmail(undefined, "real@example.com")).toBe(
      "real@example.com",
    );
  });

  it("どちらも無し: undefined", () => {
    expect(displayEmail(undefined, undefined)).toBeUndefined();
  });
});

describe("pickOwnerId (C20260617-001: owner churn 根治の不変条件)", () => {
  const local = () => "local-guest-FALLBACK";

  it("サインイン済 = Clerk userId（実アカウント）", () => {
    expect(
      pickOwnerId({
        isSignedIn: true,
        userId: "user_google_1",
        isLoaded: true,
        guestSub: "guest_x",
        getLocalGuestId: local,
      }),
    ).toBe("user_google_1");
  });

  it("RT-1/RT-2: 未サインイン（ゲスト）= 永続 guest sub。Clerk userId が churn しても owner 不変", () => {
    // トークン失効後リロード: isSignedIn=false / userId=null（Clerk guest セッション消滅）。
    // 旧実装は新 Clerk guest userId へ churn したが、新実装は永続 sub を返すため不変。
    const owner1 = pickOwnerId({
      isSignedIn: false,
      userId: null,
      isLoaded: true,
      guestSub: "guest_stable_sub",
      getLocalGuestId: local,
    });
    // 別のリロード（仮に Clerk が別 userId を持っていても未サインインなら無視される）。
    const owner2 = pickOwnerId({
      isSignedIn: false,
      userId: "ignored_churned_clerk_guest",
      isLoaded: true,
      guestSub: "guest_stable_sub",
      getLocalGuestId: local,
    });
    expect(owner1).toBe("guest_stable_sub");
    expect(owner2).toBe("guest_stable_sub"); // churn しても同じ = データ orphan 化しない
  });

  it("guest sub 取得前/失敗 = 永続ローカルゲスト id へ degrade（これも安定）", () => {
    expect(
      pickOwnerId({
        isSignedIn: false,
        userId: null,
        isLoaded: true,
        guestSub: null,
        getLocalGuestId: local,
      }),
    ).toBe("local-guest-FALLBACK");
  });

  it("未ロード = null（owner 未確定、repo を出さない）", () => {
    expect(
      pickOwnerId({
        isSignedIn: false,
        userId: null,
        isLoaded: false,
        guestSub: null,
        getLocalGuestId: local,
      }),
    ).toBeNull();
  });
});
