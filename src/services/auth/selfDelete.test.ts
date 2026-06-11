import "fake-indexeddb/auto";
import { describe, it, expect, vi } from "vitest";
import { LocalStore } from "../sync/localStore.js";
import { asOwnerId } from "../../types/domain.js";
import { purgeAllData } from "./selfDelete.js";

const owner = asOwnerId("guest_self_delete");

async function seedOwnerData(store: LocalStore) {
  await store.put("activity_set", {
    id: "s1",
    ownerId: owner,
    clientLocalId: "s1",
    updatedAt: "t",
  });
  await store.put("activity_item", {
    id: "i1",
    ownerId: owner,
    clientLocalId: "i1",
    setId: "s1",
    updatedAt: "t",
  });
}

describe("purgeAllData", () => {
  it("U-DEL-02: remote 成功時 wipeOwner + DELETE /api/account を実行", async () => {
    const store = await LocalStore.open();
    await seedOwnerData(store);
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));

    const res = await purgeAllData({ store, ownerId: owner, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/account",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(res).toEqual({ local: true, remote: true });
    expect(await store.getAllByOwner("activity_set", owner)).toHaveLength(0);
    expect(await store.getAllByOwner("activity_item", owner)).toHaveLength(0);
  });

  it("U-DEL-08: remote 失敗（fetch reject）でもローカルは確実に wipe、remote=false", async () => {
    const store = await LocalStore.open();
    await seedOwnerData(store);
    const fetchImpl = vi.fn(async () => {
      throw new Error("offline");
    });

    const res = await purgeAllData({ store, ownerId: owner, fetchImpl });

    expect(res).toEqual({ local: true, remote: false });
    expect(await store.getAllByOwner("activity_set", owner)).toHaveLength(0);
  });

  it("U-DEL-08b: remote が非 2xx（401 ゲスト）でも local wipe、remote=false", async () => {
    const store = await LocalStore.open();
    await seedOwnerData(store);
    const fetchImpl = vi.fn(async () => new Response(null, { status: 401 }));

    const res = await purgeAllData({ store, ownerId: owner, fetchImpl });

    expect(res.remote).toBe(false);
    expect(res.local).toBe(true);
    expect(await store.getAllByOwner("activity_set", owner)).toHaveLength(0);
  });

  it("U-DEL-06: wipeOwner は owner の outbox 残骸も消す", async () => {
    const store = await LocalStore.open();
    await seedOwnerData(store);
    // put で outbox に積まれている前提。wipe 後は drain しても owner 分が残らない。
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    await purgeAllData({ store, ownerId: owner, fetchImpl });

    const outbox = await store.drainOutbox();
    const ownerLeftover = outbox.filter(
      (it) => (it.payload as { ownerId?: string }).ownerId === owner,
    );
    expect(ownerLeftover).toHaveLength(0);
  });
});
