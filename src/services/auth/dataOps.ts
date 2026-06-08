import { eq } from 'drizzle-orm';
import type { Database } from '../../../db/client.js';
import {
  activitySets,
  activityItems,
  executionSessions,
  executionRecords,
  dailyAchievements,
} from '../../../db/schema.js';
import type { OwnerId } from '../../types/domain.js';

/** owner_id を持つ全テーブル（子 → 親の順、参照整合のため削除はこの順）。 */
const OWNED_TABLES = [
  executionRecords,
  executionSessions,
  dailyAchievements,
  activityItems,
  activitySets,
] as const;

/**
 * owner 配下の全データをサーバから完全削除する（O54 消去権、セルフサービス削除の非交渉必須）。
 * 匿名ゲストは運営側で特定不能のため、本人がアプリ内でこれを呼んで完結する（concept §9.2）。
 * ローカル（IndexedDB）の削除は local-sync 層が併せて行う。
 */
export async function deleteAllData(db: Database, ownerId: OwnerId): Promise<void> {
  for (const table of OWNED_TABLES) {
    await db.delete(table).where(eq(table.ownerId, ownerId));
  }
}

/**
 * ゲスト → アカウント連携時に、データの所有者をサーバ側で付け替える（[論点-009] 案B）。
 * Clerk が匿名 user の永続化アップグレード（同一 id 維持）を提供する場合は不要だが、
 * 新 id になる場合の移行経路として用意。ローカルの付け替えは local-sync が協調。
 */
export async function reassignOwner(
  db: Database,
  fromOwnerId: OwnerId,
  toOwnerId: OwnerId,
): Promise<void> {
  for (const table of OWNED_TABLES) {
    await db
      .update(table)
      .set({ ownerId: toOwnerId })
      .where(eq(table.ownerId, fromOwnerId));
  }
}
