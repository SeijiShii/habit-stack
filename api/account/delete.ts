import { withOwner, type AuthAdapter } from "../../src/services/auth/owner.js";
import { deleteAllData } from "../../src/services/auth/dataOps.js";
import type { Database } from "../../db/client.js";

/**
 * owner 配下の全データをサーバから完全削除する（O54 消去権、セルフサービス削除）。
 * owner はサーバ強制（withOwner、SEC-001）。未認証は 401。
 * 匿名ゲストも有効な owner を持つため、本人がアプリ内で自己完結して削除できる（窓口不要）。
 */
export function makeDeleteHandler(adapter: AuthAdapter, db: Database) {
  return withOwner(adapter, async (_req, owner) => {
    await deleteAllData(db, owner);
    return Response.json({ deleted: true });
  });
}

// Vercel Function エントリ（遅延配線）。
import { serverContext } from "../../src/server/context.js";
export default async function (req: Request): Promise<Response> {
  const ctx = serverContext();
  return makeDeleteHandler(ctx.adapter, ctx.db)(req);
}
