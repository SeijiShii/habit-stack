import { describe, it, expect, vi } from "vitest";
import { linkWithGoogle, type ExternalAccountLinker } from "./linkWithGoogle.js";

describe("linkWithGoogle", () => {
  it("Google strategy + redirectUrl で外部アカウント連携を開始する", async () => {
    const createExternalAccount = vi.fn(async () => ({
      verification: {
        externalVerificationRedirectURL: new URL("https://clerk.example/oauth"),
      },
    }));
    const navigate = vi.fn();
    const user: ExternalAccountLinker = { createExternalAccount };

    await linkWithGoogle(user, "https://app.example/account", navigate);

    expect(createExternalAccount).toHaveBeenCalledWith({
      strategy: "oauth_google",
      redirectUrl: "https://app.example/account",
    });
    expect(navigate).toHaveBeenCalledWith("https://clerk.example/oauth");
  });

  it("検証リダイレクト URL が無ければ遷移しない（中断時は匿名セッション維持）", async () => {
    const user: ExternalAccountLinker = {
      createExternalAccount: vi.fn(async () => ({ verification: null })),
    };
    const navigate = vi.fn();

    await linkWithGoogle(user, "https://app.example/account", navigate);

    expect(navigate).not.toHaveBeenCalled();
  });

  it("文字列の検証 URL もそのまま遷移先に使う", async () => {
    const user: ExternalAccountLinker = {
      createExternalAccount: vi.fn(async () => ({
        verification: { externalVerificationRedirectURL: "https://clerk.example/x" },
      })),
    };
    const navigate = vi.fn();

    await linkWithGoogle(user, "https://app.example/account", navigate);

    expect(navigate).toHaveBeenCalledWith("https://clerk.example/x");
  });
});
