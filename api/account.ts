import { withOwner, type AuthAdapter } from "../src/services/auth/owner.js";
import { deleteAllData } from "../src/services/auth/dataOps.js";
import type { Database } from "../db/client.js";

/**
 * owner 配下の全データをサーバから完全削除する（O54 消去権、セルフサービス削除）。
 * ルート: `DELETE /api/account`（クライアント selfDelete.ts の fetch 先と一致させる）。
 * owner はサーバ強制（withOwner、SEC-001）。未認証は 401、DELETE 以外のメソッドは 405（誤削除防止）。
 * 匿名ゲストも有効な owner を持つため、本人がアプリ内で自己完結して削除できる（窓口不要）。
 */
export function makeDeleteHandler(adapter: AuthAdapter, db: Database) {
  const owned = withOwner(adapter, async (_req, owner) => {
    await deleteAllData(db, owner);
    return Response.json({ deleted: true });
  });
  return async (req: Request): Promise<Response> => {
    if (req.method !== "DELETE") {
      return new Response(JSON.stringify({ error: "method_not_allowed" }), {
        status: 405,
        headers: { "content-type": "application/json", allow: "DELETE" },
      });
    }
    return owned(req);
  };
}

// Vercel Function エントリ（遅延配線）。ファイルパス api/account.ts → ルート /api/account。
import { serverContext } from "../src/server/context.js";
export default async function (req: Request): Promise<Response> {
  const ctx = serverContext();
  return makeDeleteHandler(ctx.adapter, ctx.db)(req);
}
