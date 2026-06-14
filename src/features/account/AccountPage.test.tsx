// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { AccountPage, linkErrorMessage } from "./AccountPage.js";
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

  it("C20260614-002: linkGoogle が reverification 403 で失敗したら無言でなくエラー表示する", async () => {
    const linkGoogle = vi.fn(async () => {
      const err = Object.assign(
        new Error(
          "You need to provide additional verification to perform this operation",
        ),
        { status: 403 },
      );
      throw err;
    });
    wrap({ ...base, linkGoogle }, <AccountPage />);

    fireEvent.click(screen.getByRole("button", { name: "Google で引き継ぐ" }));
    // 従来は catch 無しで無言失敗（「押しても何も起きない」）。今は alert を表示する。
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "セッションの再確認",
      ),
    );
  });

  it("C20260614-002: linkErrorMessage — reverification(403) と汎用を区別", () => {
    expect(
      linkErrorMessage(
        Object.assign(new Error("additional verification"), { status: 403 }),
      ),
    ).toContain("セッションの再確認");
    expect(linkErrorMessage(new Error("network down"))).toContain(
      "通信状況を確認",
    );
  });

  it("C20260614-002: 未連携ゲストに「Google でログイン」導線が出て signInWithGoogle を呼ぶ", async () => {
    const linkGoogle = vi.fn(async () => {});
    const signInWithGoogle = vi.fn(async () => {});
    wrap({ ...base, linkGoogle, signInWithGoogle }, <AccountPage />);

    const btn = screen.getByRole("button", { name: "Google でログイン" });
    fireEvent.click(btn);
    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(1));
  });

  it("C20260614-002: signInWithGoogle 未供給（keyless）では「Google でログイン」を出さない", () => {
    const linkGoogle = vi.fn(async () => {});
    wrap({ ...base, linkGoogle }, <AccountPage />);
    expect(
      screen.queryByRole("button", { name: "Google でログイン" }),
    ).toBeNull();
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
    expect(
      screen.queryByRole("button", { name: "Google で引き継ぐ" }),
    ).toBeNull();
    expect(screen.getByText(/ゲストとして利用中/)).toBeTruthy();
  });

  it("未ロード時は読み込み中を表示", () => {
    wrap({ ...base, isLoaded: false }, <AccountPage />);
    expect(screen.getByText("読み込み中…")).toBeTruthy();
  });

  it("U-DEL-04: 削除→確認「削除する」で onDeleteAllData + onDeleted を呼ぶ", async () => {
    const onDeleteAllData = vi.fn(async () => {});
    const onDeleted = vi.fn();
    wrap(
      base,
      <AccountPage onDeleteAllData={onDeleteAllData} onDeleted={onDeleted} />,
    );

    // 一段階目: 削除を開始（即削除しない）
    fireEvent.click(screen.getByRole("button", { name: "全データを削除" }));
    expect(onDeleteAllData).not.toHaveBeenCalled();
    // 確認 UI が出る
    expect(screen.getByRole("alert")).toBeTruthy();
    // 二段階目: 確定
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    await waitFor(() => expect(onDeleteAllData).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
  });

  it("U-DEL-05: 削除→「キャンセル」で onDeleteAllData を呼ばない", () => {
    const onDeleteAllData = vi.fn(async () => {});
    wrap(base, <AccountPage onDeleteAllData={onDeleteAllData} />);

    fireEvent.click(screen.getByRole("button", { name: "全データを削除" }));
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onDeleteAllData).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "全データを削除" })).toBeTruthy();
  });

  it("削除導線は onDeleteAllData 未注入時は表示しない", () => {
    wrap(base, <AccountPage />);
    expect(screen.queryByRole("button", { name: "全データを削除" })).toBeNull();
  });
});
