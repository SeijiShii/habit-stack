// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { SummaryOverviewPage } from "./SummaryOverviewPage.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const wrap = (ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

function setsRepoOf(sets: { id: string; name: string }[]) {
  return { listSets: async () => sets };
}

describe("SummaryOverviewPage (継続タブ入口)", () => {
  it("U-OV-01: 初期表示はドロップダウンだけ（全セット一覧は出さない）", async () => {
    wrap(
      <SummaryOverviewPage
        setsRepo={setsRepoOf([
          { id: "set_a", name: "平日の朝" },
          { id: "set_b", name: "夜の読書" },
        ])}
        onSelectSet={() => {}}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("セットを選ぶ")).toBeTruthy(),
    );
    // 全セットの折りたたみ一覧（details=group）は撤去済み
    expect(screen.queryAllByRole("group")).toHaveLength(0);
    // セット名はドロップダウンの option としてのみ存在
    expect(screen.getByRole("option", { name: "平日の朝" })).toBeTruthy();
  });

  it("U-OV-02: ドロップダウンでセットを選ぶと onSelectSet が呼ばれる", async () => {
    const onSelect = vi.fn();
    wrap(
      <SummaryOverviewPage
        setsRepo={setsRepoOf([
          { id: "set_a", name: "平日の朝" },
          { id: "set_b", name: "夜の読書" },
        ])}
        onSelectSet={onSelect}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("セットを選ぶ")).toBeTruthy(),
    );
    fireEvent.change(screen.getByLabelText("セットを選ぶ"), {
      target: { value: "set_b" },
    });
    expect(onSelect).toHaveBeenCalledWith("set_b");
  });

  it("U-OV-03: セット 0 件は空状態メッセージ + セット作成導線", async () => {
    wrap(<SummaryOverviewPage setsRepo={setsRepoOf([])} onSelectSet={() => {}} />);

    await waitFor(() =>
      expect(screen.getByText(/まだセットがありません/)).toBeTruthy(),
    );
    expect(screen.getByRole("link", { name: /セットをつくる/ })).toBeTruthy();
  });
});
