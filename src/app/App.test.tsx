// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { App } from "../App.js";
import { AuthProvider } from "../components/auth/AuthProvider.js";
import { LEGAL_ROUTES } from "../features/legal/content.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
});

const wrap = (initial: string, ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    // publishableKey 無し = ローカルゲスト owner（offline-first）でアプリが動く
    <AuthProvider publishableKey="">
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[initial]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    </AuthProvider>,
  );
};

describe("App 合成 (O57)", () => {
  it("N1/N6: ホームが描画され、入口リード(O41)が常設", () => {
    wrap("/", <App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "つみあげ",
    );
    expect(screen.getByTestId("lead")).toBeTruthy(); // O41
  });

  it("N5: 全ルートに法務フッタ常設(O55)", () => {
    wrap("/", <App />);
    const hrefs = Array.from(document.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain(LEGAL_ROUTES.privacy);
    expect(hrefs).toContain(LEGAL_ROUTES.terms);
    expect(hrefs).toContain(LEGAL_ROUTES.sct);
  });

  it("N2: /legal/privacy がレンダー（O54 文言含む）", () => {
    wrap("/legal/privacy", <App />);
    expect(document.body.textContent).toContain("プライバシーポリシー");
    expect(document.body.textContent).toContain("個人として特定できません");
  });

  it("/sets が repos 確立後にセット管理を描画", async () => {
    wrap("/sets", <App />);
    await waitFor(() => expect(screen.getByLabelText("セット名")).toBeTruthy());
  });

  it("C20260609-002: アカウント動線が常設され /account に到達できる (O55)", () => {
    wrap("/", <App />);
    const hrefs = Array.from(document.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/account"); // nav inbound link
  });

  it("C20260609-002: /account がレンダーされる (keyless=ローカル利用表示)", () => {
    wrap("/account", <App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "アカウント",
    );
  });

  it("未定義ルートは 404 ページ", () => {
    wrap("/nope", <App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "見つかりません",
    );
  });
});
