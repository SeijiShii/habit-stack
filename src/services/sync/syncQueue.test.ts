import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { LocalStore, type LocalRecord } from "./localStore.js";
import { SyncQueue } from "./syncQueue.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const rec = (over: Partial<LocalRecord> = {}): LocalRecord => ({
  id: over.id ?? "set_1",
  ownerId: "owner_1",
  clientLocalId: over.clientLocalId ?? "cl_1",
  updatedAt: over.updatedAt ?? "2026-06-08T00:00:00Z",
  name: "x",
  ...over,
});

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("SyncQueue.push", () => {
  it("N4: outbox をサーバへ送り outbox をクリア", async () => {
    const store = await LocalStore.open();
    await store.put("activity_set", rec({ id: "a", clientLocalId: "c1" }));
    await store.put("activity_set", rec({ id: "b", clientLocalId: "c2" }));
    const fetcher = vi.fn(async () => okJson({ applied: 2, conflicts: 0 }));
    const q = new SyncQueue(store, fetcher as unknown as typeof fetch);
    const r = await q.push();
    expect(r.pushed).toBe(2);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/sync/push",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await store.drainOutbox()).toHaveLength(0);
  });

  it("outbox 空なら pushed 0（fetch しない）", async () => {
    const store = await LocalStore.open();
    const fetcher = vi.fn();
    const q = new SyncQueue(store, fetcher as unknown as typeof fetch);
    expect((await q.push()).pushed).toBe(0);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("E1: push 失敗で throw + outbox 保持（リトライ）", async () => {
    const store = await LocalStore.open();
    await store.put("activity_set", rec({ id: "a", clientLocalId: "c1" }));
    const fetcher = vi.fn(async () => new Response("err", { status: 500 }));
    const q = new SyncQueue(store, fetcher as unknown as typeof fetch);
    await expect(q.push()).rejects.toThrow("sync push failed");
    expect(await store.drainOutbox()).toHaveLength(1);
  });
});

describe("SyncQueue.pull", () => {
  it("N5: サーバ差分をローカルへ反映", async () => {
    const store = await LocalStore.open();
    const fetcher = vi.fn(async () =>
      okJson({
        changes: [
          {
            entity: "activity_set",
            op: "upsert",
            payload: rec({ id: "s1", updatedAt: "2026-06-08T05:00:00Z" }),
            clientLocalId: "c1",
            updatedAt: "2026-06-08T05:00:00Z",
          },
        ],
      }),
    );
    const q = new SyncQueue(store, fetcher as unknown as typeof fetch);
    const r = await q.pull("2026-06-08T00:00:00Z");
    expect(r.pulled).toBe(1);
    expect(await store.get("activity_set", "s1")).toMatchObject({ id: "s1" });
  });

  it("E2: 競合 — local が新しければ local を保持", async () => {
    const store = await LocalStore.open();
    // local: applyRemote で直接（outbox 経由しない）新しい版を置く
    await store.applyRemote(
      "activity_set",
      rec({ id: "s1", updatedAt: "2026-06-08T10:00:00Z", name: "local-new" }),
    );
    const fetcher = vi.fn(async () =>
      okJson({
        changes: [
          {
            entity: "activity_set",
            op: "upsert",
            payload: rec({
              id: "s1",
              updatedAt: "2026-06-08T05:00:00Z",
              name: "server-old",
            }),
            clientLocalId: "c1",
            updatedAt: "2026-06-08T05:00:00Z",
          },
        ],
      }),
    );
    const q = new SyncQueue(store, fetcher as unknown as typeof fetch);
    await q.pull("2026-06-08T00:00:00Z");
    expect(await store.get("activity_set", "s1")).toMatchObject({
      name: "local-new",
    });
  });
});
