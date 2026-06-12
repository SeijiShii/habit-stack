// TZ 固定で「UTC 日付でズレて記録された達成」を再現する。
process.env.TZ = 'Asia/Tokyo';

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { LocalStore, type LocalRecord } from '../localStore.js';
import { rebuildAchievements } from './rebuildAchievements.js';

const OWNER = 'owner_1';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

async function seed(store: LocalStore) {
  // セッション: set_1 に属する sess_a / sess_b
  const session = (id: string, startedAt: string): LocalRecord => ({
    id,
    ownerId: OWNER,
    clientLocalId: id,
    setId: 'set_1',
    startedAt,
    status: 'done',
    updatedAt: startedAt,
    deletedAt: null,
  });
  // JST 6/12 21:00 (UTC 6/12) と JST 6/13 08:00 (UTC 6/12!) の 2 日連続実行
  await store.applyRemote('execution_session', session('sess_a', '2026-06-12T12:00:00.000Z'));
  await store.applyRemote('execution_session', session('sess_b', '2026-06-12T23:00:00.000Z'));

  const record = (sessionId: string, startedAt: string, elapsedSec: number): LocalRecord => ({
    id: `${sessionId}:i1`,
    ownerId: OWNER,
    clientLocalId: `${sessionId}:i1`,
    sessionId,
    itemId: 'i1',
    startedAt,
    endedAt: startedAt,
    elapsedSec,
    pausedTotalSec: 0,
    note: '',
    updatedAt: startedAt,
    deletedAt: null,
  });
  await store.applyRemote('execution_record', record('sess_a', '2026-06-12T12:00:00.000Z', 60));
  await store.applyRemote('execution_record', record('sess_b', '2026-06-12T23:00:00.000Z', 120));

  // 旧コードが UTC slice で記録した達成: 両方 2026-06-12 に潰れている
  const ach: LocalRecord = {
    id: `${OWNER}:set_1:2026-06-12`,
    ownerId: OWNER,
    clientLocalId: `${OWNER}:set_1:2026-06-12`,
    setId: 'set_1',
    date: '2026-06-12',
    achieved: true,
    itemDoneCount: 2,
    updatedAt: '2026-06-12T23:00:00.000Z',
    deletedAt: null,
  };
  await store.applyRemote('daily_achievement', ach);
}

async function achievedDates(store: LocalStore): Promise<string[]> {
  const all = await store.getAllByOwner('daily_achievement', OWNER);
  return all.map((a) => String(a.date)).sort();
}

describe('rebuildAchievements', () => {
  it('U-MG-01: UTC 日付の達成をローカル日付で再構築し、余剰を tombstone', async () => {
    const store = await LocalStore.open();
    await seed(store);

    const result = await rebuildAchievements(store, OWNER);

    // JST では 6/12 と 6/13 の 2 日分になる
    expect(await achievedDates(store)).toEqual(['2026-06-12', '2026-06-13']);
    expect(result).not.toBeNull();
    expect(result!.rebuilt).toBe(2);
  });

  it('U-MG-02: 冪等（2 回目はフラグで no-op）', async () => {
    const store = await LocalStore.open();
    await seed(store);
    await rebuildAchievements(store, OWNER);
    const before = await achievedDates(store);

    const second = await rebuildAchievements(store, OWNER);

    expect(second).toBeNull(); // フラグ済みで実行されない
    expect(await achievedDates(store)).toEqual(before);
  });

  it('U-MG-03: execution_record 0 件なら達成を消さず no-op', async () => {
    const store = await LocalStore.open();
    // 達成だけある（同期で達成だけ pull した owner 等）→ 消してはいけない
    await store.applyRemote('daily_achievement', {
      id: `${OWNER}:set_1:2026-06-10`,
      ownerId: OWNER,
      clientLocalId: `${OWNER}:set_1:2026-06-10`,
      setId: 'set_1',
      date: '2026-06-10',
      achieved: true,
      itemDoneCount: 1,
      updatedAt: '2026-06-10T09:00:00.000Z',
      deletedAt: null,
    } as LocalRecord);

    await rebuildAchievements(store, OWNER);

    expect(await achievedDates(store)).toEqual(['2026-06-10']);
  });

  it('U-OV-03 相当: session に紐づかない record は無視して継続', async () => {
    const store = await LocalStore.open();
    await seed(store);
    await store.applyRemote('execution_record', {
      id: 'orphan:i9',
      ownerId: OWNER,
      clientLocalId: 'orphan:i9',
      sessionId: 'sess_unknown',
      itemId: 'i9',
      startedAt: '2026-06-11T12:00:00.000Z',
      elapsedSec: 30,
      updatedAt: '2026-06-11T12:00:00.000Z',
      deletedAt: null,
    } as LocalRecord);

    await expect(rebuildAchievements(store, OWNER)).resolves.not.toBeNull();
    expect(await achievedDates(store)).toEqual(['2026-06-12', '2026-06-13']);
  });
});
