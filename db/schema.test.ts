import { describe, it, expect } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import {
  timeOfDay,
  sessionStatus,
  activitySets,
  activityItems,
  executionSessions,
  executionRecords,
  dailyAchievements,
} from './schema.js';

describe('enums', () => {
  it('N1: time_of_day は 4 値', () => {
    expect(timeOfDay.enumValues).toEqual([
      'morning',
      'noon',
      'evening',
      'night',
    ]);
  });

  it('N2: session_status は 3 値', () => {
    expect(sessionStatus.enumValues).toEqual(['running', 'paused', 'done']);
  });
});

describe('tables: 列定義', () => {
  const colNames = (table: Parameters<typeof getTableConfig>[0]) =>
    getTableConfig(table).columns.map((c) => c.name);

  it('activity_sets が必須列を持つ', () => {
    const cols = colNames(activitySets);
    for (const c of [
      'id',
      'owner_id',
      'name',
      'time_of_day',
      'sort_order',
      'created_at',
      'updated_at',
      'deleted_at',
    ]) {
      expect(cols).toContain(c);
    }
  });

  it('execution_records が経過時間・メモ・同期メタを持つ', () => {
    const cols = colNames(executionRecords);
    for (const c of [
      'session_id',
      'item_id',
      'owner_id',
      'elapsed_sec',
      'paused_total_sec',
      'note',
      'client_local_id',
    ]) {
      expect(cols).toContain(c);
    }
  });

  it('daily_achievements が達成フラグと穴あき補助列を持つ', () => {
    const cols = colNames(dailyAchievements);
    for (const c of ['owner_id', 'set_id', 'date', 'achieved', 'item_done_count']) {
      expect(cols).toContain(c);
    }
  });
});

describe('制約・index (SEC-001 owner 分離 + 同期冪等)', () => {
  it('B3: 全テーブルが owner_id を持つ', () => {
    for (const table of [
      activitySets,
      activityItems,
      executionSessions,
      executionRecords,
      dailyAchievements,
    ]) {
      const cols = getTableConfig(table).columns.map((c) => c.name);
      expect(cols).toContain('owner_id');
    }
  });

  it('B1: execution_sessions/records に (owner_id, client_local_id) unique', () => {
    for (const table of [executionSessions, executionRecords]) {
      const uniques = getTableConfig(table).uniqueConstraints.map((u) =>
        u.columns.map((c) => c.name).sort(),
      );
      expect(uniques).toContainEqual(['client_local_id', 'owner_id']);
    }
  });

  it('B2: daily_achievements に (owner_id, set_id, date) unique', () => {
    const uniques = getTableConfig(dailyAchievements).uniqueConstraints.map((u) =>
      u.columns.map((c) => c.name).sort(),
    );
    expect(uniques).toContainEqual(['date', 'owner_id', 'set_id']);
  });

  it('owner 関連 index が定義されている', () => {
    const idx = getTableConfig(activitySets).indexes.map((i) => i.config.name);
    expect(idx).toContain('activity_sets_owner_deleted_idx');
  });
});

describe('型推論 ($inferInsert / $inferSelect)', () => {
  it('N3/N4: 型が期待 shape（コンパイル時 + ランタイム値）', () => {
    const insert: typeof activitySets.$inferInsert = {
      ownerId: 'user_1',
      name: '平日の朝',
      timeOfDay: 'morning',
    };
    expect(insert.name).toBe('平日の朝');

    const rec = {
      elapsedSec: 120,
      pausedTotalSec: 10,
      note: null,
    } satisfies Partial<typeof executionRecords.$inferSelect>;
    expect(rec.elapsedSec).toBe(120);
    expect(rec.note).toBeNull();
  });
});
