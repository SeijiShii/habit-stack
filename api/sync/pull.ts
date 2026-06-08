import { withOwner, type AuthAdapter } from "../../src/services/auth/owner.js";
import type { SyncRepo } from "../../src/services/sync/syncRepo.js";

/**
 * サーバ差分を返す（withOwner、owner で絞る、SEC-001）。
 */
export function makePullHandler(adapter: AuthAdapter, repo: SyncRepo) {
  return withOwner(adapter, async (req, owner) => {
    const since =
      new URL(req.url).searchParams.get("since") ?? "1970-01-01T00:00:00.000Z";
    const changes = await repo.changesSince(owner, since);
    return Response.json({ changes, serverTime: new Date().toISOString() });
  });
}

// Vercel Function エントリ（遅延配線）
import { serverContext } from "../../src/server/context.js";
export default async function (req: Request): Promise<Response> {
  const ctx = serverContext();
  return makePullHandler(ctx.adapter, ctx.syncRepo)(req);
}
