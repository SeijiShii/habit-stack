// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AccountPage } from "./AccountPage.js";
import {
  OwnerContext,
  type OwnerState,
} from "../../services/auth/ownerContext.js";
import { asOwnerId } from "../../types/domain.js";

const base: OwnerState = {
  ownerId: asOwnerId("guest_1"),
  isLoaded: true,
  isLocalGuest: true,
  isLinked: false,
};

const wrap = (value: OwnerState, ui: ReactNode) =>
  render(<OwnerContext.Provider value={value}>{ui}</OwnerContext.Provider>);

describe("AccountPage", () => {
  it("ゲスト（Clerk あり・未連携）: Google 引き継ぎ導線を表示し linkGoogle を呼ぶ", async () => {
    const linkGoogle = vi.fn(async () => {});
    wrap({ ...base, linkGoogle }, <AccountPage />);

    const btn = screen.getByRole("button", { name: "Google で引き継ぐ" });
    fireEvent.click(btn);
    await waitFor(() => expect(linkGoogle).toHaveBeenCalledTimes(1));
  });

  it("連携済み: メール表示 + サインアウト導線", async () => {
    const signOut = vi.fn(async () => {});
    wrap(
      {
        ...base,
        isLocalGuest: false,
        isLinked: true,
        email: "user@example.com",
        signOut,
      },
      <AccountPage />,
    );

    expect(screen.getByText("user@example.com")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "サインアウト" }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it("keyless（linkGoogle 無し）: 連携ボタンを出さずローカル利用の旨を表示", () => {
    wrap(base, <AccountPage />);
    expect(screen.queryByRole("button", { name: "Google で引き継ぐ" })).toBeNull();
    expect(screen.getByText(/ゲストとして利用中/)).toBeTruthy();
  });

  it("未ロード時は読み込み中を表示", () => {
    wrap({ ...base, isLoaded: false }, <AccountPage />);
    expect(screen.getByText("読み込み中…")).toBeTruthy();
  });
});
