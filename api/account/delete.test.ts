import { describe, it, expect, vi } from "vitest";
import type { AuthAdapter } from "../../src/services/auth/owner.js";
import { makeDeleteHandler } from "./delete.js";

const adapter = (owner: string | null): AuthAdapter => ({
  resolveOwnerId: async () => owner,
});

/** deleteAllData は db.delete(table).where(...) を OWNED_TABLES 分呼ぶ。db をスパイ。 */
const mockDb = () => {
  const where = vi.fn(async () => {});
  const del = vi.fn(() => ({ where }));
  // deleteAllData は `db.delete(table).where(eq(...))` を await する
  return { obj: { delete: del } as never, del, where };
};

const req = () =>
  new Request("https://app.test/api/account", { method: "DELETE" });

describe("makeDeleteHandler", () => {
  it("U-DEL-01: 認証済み owner で deleteAllData を実行し 200 {deleted:true}", async () => {
    const db = mockDb();
    const handler = makeDeleteHandler(adapter("real_owner"), db.obj);
    const res = await handler(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ deleted: true });
    // OWNED_TABLES（5 テーブル）分 delete が呼ばれる
    expect(db.del).toHaveBeenCalledTimes(5);
  });

  it("U-DEL-07: 未認証は 401、削除を実行しない", async () => {
    const db = mockDb();
    const handler = makeDeleteHandler(adapter(null), db.obj);
    const res = await handler(req());
    expect(res.status).toBe(401);
    expect(db.del).not.toHaveBeenCalled();
  });
});
