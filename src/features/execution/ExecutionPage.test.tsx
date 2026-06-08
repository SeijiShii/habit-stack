// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalStore } from "../../services/sync/localStore.js";
import { ExecutionRepo } from "./model/executionRepo.js";
import { ExecutionPage } from "./ExecutionPage.js";
import { asOwnerId } from "../../types/domain.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const items = [
  { id: "i1", name: "ストレッチ" },
  { id: "i2", name: "英単語" },
];

async function setup() {
  const repo = new ExecutionRepo(await LocalStore.open(), asOwnerId("owner_1"));
  render(
    <ExecutionPage
      repo={repo}
      setId="set_1"
      setName="平日の朝"
      items={items}
      sessionLocalId="sess_1"
    />,
  );
  return repo;
}

describe("ExecutionPage (UC4)", () => {
  it("開始 → 現アイテム表示 → 次へ → 終了で完了 + 達成記録", async () => {
    await setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "開始" }));
    expect(screen.getByTestId("current-item").textContent).toBe("ストレッチ");

    await user.click(screen.getByRole("button", { name: "次へ" }));
    await waitFor(() =>
      expect(screen.getByTestId("current-item").textContent).toBe("英単語"),
    );

    await user.click(screen.getByRole("button", { name: "セット終了" }));
    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());

    // 達成（穴あき許容）が記録されている
    const store = await LocalStore.open();
    const all = await store.getAllByOwner("daily_achievement", "owner_1");
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ achieved: true });
  });

  it("開始後にメモ入力できる", async () => {
    await setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "開始" }));
    await user.type(screen.getByLabelText("今日のメモ"), "5ページ読んだ");
    expect(
      (screen.getByLabelText("今日のメモ") as HTMLTextAreaElement).value,
    ).toBe("5ページ読んだ");
  });
});
