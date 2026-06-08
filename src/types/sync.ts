/**
 * local-first 同期エンベロープ（offline-critical）。
 */
import type { Iso8601 } from './domain.js';

export type SyncEntity =
  | 'activity_set'
  | 'activity_item'
  | 'execution_session'
  | 'execution_record'
  | 'daily_achievement';

export type SyncOp = 'upsert' | 'delete';

/** ローカル変更 1 件分の同期単位。client_local_id で冪等、updated_at で last-write-wins。 */
export interface SyncEnvelope<T> {
  entity: SyncEntity;
  op: SyncOp;
  payload: T;
  clientLocalId: string;
  updatedAt: Iso8601;
}

export interface SyncPushResult {
  applied: number;
  conflicts: number;
}

export interface SyncPullResult<T = unknown> {
  changes: SyncEnvelope<T>[];
  serverTime: Iso8601;
}
