import { eq, and, gt } from "drizzle-orm";
import type { Database } from "../../../db/client.js";
import {
  activitySets,
  activityItems,
  executionSessions,
  executionRecords,
  dailyAchievements,
} from "../../../db/schema.js";
import type { SyncEntity, SyncEnvelope } from "../../types/sync.js";
import type { OwnerId } from "../../types/domain.js";

/**
 * サーバ同期リポジトリ（injectable）。owner はサーバが強制注入（SEC-001、クライアント値を信用しない）。
 */
export interface SyncRepo {
  upsert(
    entity: SyncEntity,
    ownerId: OwnerId,
    payload: Record<string, unknown>,
  ): Promise<void>;
  softDelete(entity: SyncEntity, ownerId: OwnerId, id: string): Promise<void>;
  changesSince(
    ownerId: OwnerId,
    since: string,
  ): Promise<SyncEnvelope<Record<string, unknown>>[]>;
}

const TABLE: Record<SyncEntity, typeof activitySets> = {
  activity_set: activitySets,
  activity_item: activityItems as unknown as typeof activitySets,
  execution_session: executionSessions as unknown as typeof activitySets,
  execution_record: executionRecords as unknown as typeof activitySets,
  daily_achievement: dailyAchievements as unknown as typeof activitySets,
};

/**
 * Drizzle 実装。upsert は client_local_id ベースで冪等、全クエリ owner_id 強制。
 */
export class DrizzleSyncRepo implements SyncRepo {
  constructor(private readonly db: Database) {}

  async upsert(
    entity: SyncEntity,
    ownerId: OwnerId,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const table = TABLE[entity];
    // owner はサーバ強制（payload の owner を上書き）
    const row = { ...payload, ownerId } as unknown as typeof table.$inferInsert;
    await this.db
      .insert(table)
      .values(row)
      .onConflictDoUpdate({ target: table.id, set: row });
  }

  async softDelete(
    entity: SyncEntity,
    ownerId: OwnerId,
    id: string,
  ): Promise<void> {
    const table = TABLE[entity];
    const now = new Date().toISOString();
    await this.db
      .update(table)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(table.id, id), eq(table.ownerId, ownerId)));
  }

  async changesSince(
    ownerId: OwnerId,
    since: string,
  ): Promise<SyncEnvelope<Record<string, unknown>>[]> {
    const out: SyncEnvelope<Record<string, unknown>>[] = [];
    for (const entity of Object.keys(TABLE) as SyncEntity[]) {
      const table = TABLE[entity];
      const rows = (await this.db
        .select()
        .from(table)
        .where(
          and(eq(table.ownerId, ownerId), gt(table.updatedAt, since)),
        )) as Record<string, unknown>[];
      for (const r of rows) {
        out.push({
          entity,
          op: r.deletedAt ? "delete" : "upsert",
          payload: r,
          clientLocalId: String(r.clientLocalId ?? r.id),
          updatedAt: String(r.updatedAt),
        });
      }
    }
    return out;
  }
}
