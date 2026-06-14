import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { LocalStore, type LocalRecord } from "./localStore.js";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const rec = (over: Partial<LocalRecord> = {}): LocalRecord => ({
  id: over.id ?? "set_1",
  ownerId: over.ownerId ?? "owner_1",
  clientLocalId: over.clientLocalId ?? "cl_1",
  updatedAt: over.updatedAt ?? "2026-06-08T00:00:00Z",
  name: "平日の朝",
  ...over,
});

describe("LocalStore", () => {
  it("N1: put でローカル保存 + outbox に upsert 積む", async () => {
    const store = await LocalStore.open();
    await store.put("activity_set", rec());
    expect(await store.get("activity_set", "set_1")).toMatchObject({
      name: "平日の朝",
    });
    const outbox = await store.drainOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ op: "upsert", entity: "activity_set" });
  });

  it("N2: getAllByOwner は owner の未削除のみ", async () => {
    const store = await LocalStore.open();
    await store.put(
      "activity_set",
      rec({ id: "a", ownerId: "o1", clientLocalId: "c1" }),
    );
    await store.put(
      "activity_set",
      rec({ id: "b", ownerId: "o2", clientLocalId: "c2" }),
    );
    const mine = await store.getAllByOwner("activity_set", "o1");
    expect(mine.map((r) => r.id)).toEqual(["a"]);
  });

  it("N3: softDelete は tombstone + getAll から除外 + outbox delete", async () => {
    const store = await LocalStore.open();
    await store.put("activity_set", rec({ id: "a", clientLocalId: "c1" }));
    await store.softDelete("activity_set", "a", "2026-06-08T03:00:00Z");
    expect(await store.getAllByOwner("activity_set", "owner_1")).toHaveLength(
      0,
    );
    const ops = (await store.drainOutbox()).map((o) => o.op);
    expect(ops).toContain("delete");
  });

  it("B3: オフライン相当（fetch せず）でも put 成功 + outbox 保持", async () => {
    const store = await LocalStore.open();
    await store.put(
      "execution_record",
      rec({ id: "r1", clientLocalId: "cr1" }),
    );
    expect(await store.drainOutbox()).toHaveLength(1);
  });

  it("wipeOwner で owner 配下のローカルを全消去（O54 ローカル側）", async () => {
    const store = await LocalStore.open();
    await store.put(
      "activity_set",
      rec({ id: "a", ownerId: "o1", clientLocalId: "c1" }),
    );
    await store.put(
      "activity_item",
      rec({ id: "i", ownerId: "o1", clientLocalId: "c2" }),
    );
    await store.wipeOwner("o1");
    expect(await store.get("activity_set", "a")).toBeUndefined();
    expect(await store.get("activity_item", "i")).toBeUndefined();
  });

  it("U-15: wipeOtherOwners は current 以外を消し current は残す（既存ログイン上書き, R20260615-001）", async () => {
    const store = await LocalStore.open();
    // current owner = oNew のデータ（account 側）
    await store.put(
      "activity_set",
      rec({ id: "new", ownerId: "oNew", clientLocalId: "cn" }),
    );
    // 旧 guest owner = oGuest のデータ（上書きで消えるべき）
    await store.put(
      "activity_set",
      rec({ id: "g1", ownerId: "oGuest", clientLocalId: "cg1" }),
    );
    await store.put(
      "activity_item",
      rec({ id: "g2", ownerId: "oGuest", clientLocalId: "cg2" }),
    );
    await store.wipeOtherOwners("oNew");
    // current は残る
    expect(await store.get("activity_set", "new")).toMatchObject({
      ownerId: "oNew",
    });
    // 他 owner は消える
    expect(await store.get("activity_set", "g1")).toBeUndefined();
    expect(await store.get("activity_item", "g2")).toBeUndefined();
  });

  it("U-07b: wipeOtherOwners は他 owner が無ければ no-op（保持経路でデータを消さない）", async () => {
    const store = await LocalStore.open();
    await store.put(
      "activity_set",
      rec({ id: "a", ownerId: "oSame", clientLocalId: "c1" }),
    );
    await store.wipeOtherOwners("oSame");
    expect(await store.get("activity_set", "a")).toMatchObject({
      ownerId: "oSame",
    });
  });
});
