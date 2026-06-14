// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { LocalStore } from "../../services/sync/localStore.js";
import { SetsRepo } from "./model/setsRepo.js";
import { SetListPage } from "./SetListPage.js";
import { asOwnerId } from "../../types/domain.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const wrap = (ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

async function makeRepo() {
  return new SetsRepo(await LocalStore.open(), asOwnerId("owner_1"));
}

describe("SetListPage (UC1)", () => {
  it("S1: セット作成 → 朝グループに表示", async () => {
    const repo = await makeRepo();
    const user = userEvent.setup();
    wrap(<SetListPage repo={repo} />);

    await user.type(screen.getByLabelText("セット名"), "平日の朝");
    await user.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "平日の朝" })).toBeTruthy(),
    );
    // 朝グループ見出しが出る
    expect(screen.getByRole("heading", { name: "朝" })).toBeTruthy();
  });

  it("S2: 空 name でバリデーションエラー、保存されない", async () => {
    const repo = await makeRepo();
    const user = userEvent.setup();
    wrap(<SetListPage repo={repo} />);

    await user.click(screen.getByRole("button", { name: "追加" }));
    expect(screen.getByRole("alert").textContent).toContain("名前");
    expect(await repo.listSets()).toHaveLength(0);
  });

  it("S3: 進行中セットに「進行中」を表示し、選択で onOpenSet が呼ばれる (R20260614-001)", async () => {
    const repo = await makeRepo();
    const a = await repo.createSet({ name: "平日の朝", timeOfDay: "morning" });
    await repo.createSet({ name: "夜の読書", timeOfDay: "night" });
    const onOpen = vi.fn();
    const user = userEvent.setup();
    wrap(<SetListPage repo={repo} inProgressSetId={a.id} onOpenSet={onOpen} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /平日の朝/ })).toBeTruthy(),
    );
    // 「進行中」バッジは進行中セット 1 つだけ
    expect(screen.getAllByTestId("in-progress-badge")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /平日の朝/ }).textContent,
    ).toContain("進行中");
    expect(
      screen.getByRole("button", { name: "夜の読書" }).textContent,
    ).not.toContain("進行中");

    await user.click(screen.getByRole("button", { name: /平日の朝/ }));
    expect(onOpen).toHaveBeenCalledWith(a.id);
  });
});
