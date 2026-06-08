import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { LocalStore } from '../../../services/sync/localStore.js';
import { SetsRepo } from './setsRepo.js';
import { reorder } from './reorder.js';
import { setInputSchema } from './schema.js';
import { asOwnerId } from '../../../types/domain.js';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

let seq = 0;
const deps = () => {
  seq = 0;
  return {
    now: () => '2026-06-08T00:00:00.000Z',
    genId: () => `id_${++seq}`,
    genLocalId: () => `cl_${seq}`,
  };
};

const repo = async () =>
  new SetsRepo(await LocalStore.open(), asOwnerId('owner_1'), deps());

describe('SetsRepo CRUD', () => {
  it('N1: createSet で local-sync 保存 + client_local_id 付与', async () => {
    const r = await repo();
    const set = await r.createSet({ name: '平日の朝', timeOfDay: 'morning' });
    expect(set.id).toBe('id_1');
    expect(set.clientLocalId).toBeTruthy();
    expect((await r.listSets()).map((s) => s.name)).toEqual(['平日の朝']);
  });

  it('N3: deleteSet で配下アイテムも softDelete', async () => {
    const r = await repo();
    const set = await r.createSet({ name: 'S', timeOfDay: 'morning' });
    await r.createItem(set.id, { name: 'ストレッチ' });
    await r.deleteSet(set.id);
    expect(await r.listSets()).toHaveLength(0);
    expect(await r.listItems(set.id)).toHaveLength(0);
  });

  it('item CRUD', async () => {
    const r = await repo();
    const set = await r.createSet({ name: 'S', timeOfDay: 'morning' });
    const item = await r.createItem(set.id, { name: '英単語' });
    expect((await r.listItems(set.id)).map((i) => i.name)).toEqual(['英単語']);
    await r.deleteItem(item.id);
    expect(await r.listItems(set.id)).toHaveLength(0);
  });
});

describe('Zod 検証 (SEC-002)', () => {
  it('E1: name 空はエラー', () => {
    expect(() => setInputSchema.parse({ name: '  ', timeOfDay: 'morning' })).toThrow();
  });
  it('E2: name 61 文字はエラー', () => {
    expect(() => setInputSchema.parse({ name: 'a'.repeat(61), timeOfDay: 'morning' })).toThrow();
  });
  it('E3: 不正 timeOfDay はエラー', () => {
    expect(() => setInputSchema.parse({ name: 'x', timeOfDay: 'midnight' })).toThrow();
  });
  it('B1: 1/60 文字は OK', () => {
    expect(setInputSchema.parse({ name: 'a', timeOfDay: 'night' }).name).toBe('a');
    expect(setInputSchema.parse({ name: 'a'.repeat(60), timeOfDay: 'night' }).name).toHaveLength(60);
  });
});

describe('reorder (R1 連番振り直し)', () => {
  it('N4: 並べ替えで sort_order を連番化、変更分のみ返す', () => {
    const items = [
      { id: 'a', sortOrder: 0 },
      { id: 'b', sortOrder: 1 },
      { id: 'c', sortOrder: 2 },
    ];
    const changed = reorder(items, ['c', 'a', 'b']);
    expect(changed).toEqual([
      { id: 'c', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
      { id: 'b', sortOrder: 2 },
    ]);
  });
  it('B2: 1 件のみは変更なし', () => {
    expect(reorder([{ id: 'a', sortOrder: 0 }], ['a'])).toEqual([]);
  });
});
