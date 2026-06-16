import { createClerkAuthAdapter } from "../services/auth/clerkOwnerAdapter.js";
import { createGuestOrClerkAuthAdapter } from "../services/auth/guestOrClerkAdapter.js";
import type { AuthAdapter } from "../services/auth/owner.js";
import { createDb, type Database } from "../../db/client.js";
import { DrizzleSyncRepo } from "../services/sync/syncRepo.js";

export interface ServerContext {
  db: Database;
  adapter: AuthAdapter;
  syncRepo: DrizzleSyncRepo;
}

let cached: ServerContext | null = null;

/**
 * サーバ実行時の依存を env から遅延構築（モジュール読込時には作らない = build/test で env 不要）。
 */
export function serverContext(): ServerContext {
  if (!cached) {
    const db = createDb(process.env.DATABASE_URL ?? "");
    const clerk = createClerkAuthAdapter({
      secretKey: process.env.CLERK_SECRET_KEY ?? "",
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
    });
    // guest 自前署名 JWT（Bearer）を iss で振り分け、無ければ Clerk へフォールバック（C20260617-001）。
    const adapter = createGuestOrClerkAuthAdapter({
      guestSecret: process.env.GUEST_TOKEN_SECRET ?? "",
      clerk,
    });
    cached = { db, adapter, syncRepo: new DrizzleSyncRepo(db) };
  }
  return cached;
}
