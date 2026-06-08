import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  date,
  index,
  unique,
} from 'drizzle-orm/pg-core';

/**
 * 時間帯 enum（活動セットの実施タイミング）。
 */
export const timeOfDay = pgEnum('time_of_day', [
  'morning',
  'noon',
  'evening',
  'night',
]);

/**
 * 実行セッションの状態。
 */
export const sessionStatus = pgEnum('session_status', [
  'running',
  'paused',
  'done',
]);

const ts = (name: string) =>
  timestamp(name, { withTimezone: true });

/**
 * 活動セット（時間帯ごとのルーティン）。owner_id で行レベル分離（SEC-001）。
 */
export const activitySets = pgTable(
  'activity_sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: text('owner_id').notNull(),
    name: text('name').notNull(),
    timeOfDay: timeOfDay('time_of_day').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    deletedAt: ts('deleted_at'),
  },
  (t) => ({
    ownerDeletedIdx: index('activity_sets_owner_deleted_idx').on(
      t.ownerId,
      t.deletedAt,
    ),
  }),
);

/**
 * アイテム（活動セット内の個々の習慣）。
 */
export const activityItems = pgTable(
  'activity_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    setId: uuid('set_id').notNull(),
    ownerId: text('owner_id').notNull(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    deletedAt: ts('deleted_at'),
  },
  (t) => ({
    setDeletedIdx: index('activity_items_set_deleted_idx').on(
      t.setId,
      t.deletedAt,
    ),
    ownerIdx: index('activity_items_owner_idx').on(t.ownerId),
  }),
);

/**
 * 実行セッション（セットを回した 1 回）。client_local_id で冪等同期。
 */
export const executionSessions = pgTable(
  'execution_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: text('owner_id').notNull(),
    setId: uuid('set_id').notNull(),
    startedAt: ts('started_at').notNull(),
    endedAt: ts('ended_at'),
    status: sessionStatus('status').notNull().default('running'),
    clientLocalId: text('client_local_id').notNull(),
    syncedAt: ts('synced_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    ownerStartedIdx: index('execution_sessions_owner_started_idx').on(
      t.ownerId,
      t.startedAt,
    ),
    ownerLocalUnique: unique('execution_sessions_owner_local_unique').on(
      t.ownerId,
      t.clientLocalId,
    ),
  }),
);

/**
 * 実行記録（アイテム単位の時間記録 + 今日メモ）。経過はタイムスタンプ差分の算出値を保存。
 */
export const executionRecords = pgTable(
  'execution_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').notNull(),
    itemId: uuid('item_id').notNull(),
    ownerId: text('owner_id').notNull(),
    startedAt: ts('started_at').notNull(),
    endedAt: ts('ended_at'),
    elapsedSec: integer('elapsed_sec').notNull().default(0),
    pausedTotalSec: integer('paused_total_sec').notNull().default(0),
    note: text('note'),
    clientLocalId: text('client_local_id').notNull(),
    syncedAt: ts('synced_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index('execution_records_session_idx').on(t.sessionId),
    ownerStartedIdx: index('execution_records_owner_started_idx').on(
      t.ownerId,
      t.startedAt,
    ),
    ownerLocalUnique: unique('execution_records_owner_local_unique').on(
      t.ownerId,
      t.clientLocalId,
    ),
  }),
);

/**
 * 達成日キャッシュ（継続率の高速集計用）。正本は execution_records、再計算可能。
 * 継続の定義: セット単位・穴あき許容（1 アイテム以上実行で achieved=true）。
 */
export const dailyAchievements = pgTable(
  'daily_achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: text('owner_id').notNull(),
    setId: uuid('set_id').notNull(),
    date: date('date').notNull(),
    achieved: boolean('achieved').notNull().default(true),
    itemDoneCount: integer('item_done_count').notNull().default(0),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    ownerSetDateUnique: unique('daily_achievements_owner_set_date_unique').on(
      t.ownerId,
      t.setId,
      t.date,
    ),
    ownerDateIdx: index('daily_achievements_owner_date_idx').on(
      t.ownerId,
      t.date,
    ),
  }),
);
