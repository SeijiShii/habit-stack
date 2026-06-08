import { describe, it, expect } from 'vitest';
import type { Database } from '../../../db/client.js';
import { deleteAllData, reassignOwner } from './dataOps.js';
import { asOwnerId } from '../../types/domain.js';

interface Call {
  op: 'delete' | 'update';
  set?: Record<string, unknown>;
}

function mockDb() {
  const calls: Call[] = [];
  const db = {
    delete: () => ({
      where: () => {
        calls.push({ op: 'delete' });
        return Promise.resolve();
      },
    }),
    update: () => ({
      set: (v: Record<string, unknown>) => ({
        where: () => {
          calls.push({ op: 'update', set: v });
          return Promise.resolve();
        },
      }),
    }),
  } as unknown as Database;
  return { db, calls };
}

describe('deleteAllData (O54 セルフサービス削除)', () => {
  it('N6: owner 配下の全 5 テーブルを delete', async () => {
    const { db, calls } = mockDb();
    await deleteAllData(db, asOwnerId('user_1'));
    expect(calls.filter((c) => c.op === 'delete')).toHaveLength(5);
  });
});

describe('reassignOwner (ゲスト→アカウント移行)', () => {
  it('N7: 全 5 テーブルで owner_id を to に付け替え', async () => {
    const { db, calls } = mockDb();
    await reassignOwner(db, asOwnerId('guest_1'), asOwnerId('user_1'));
    const updates = calls.filter((c) => c.op === 'update');
    expect(updates).toHaveLength(5);
    for (const u of updates) {
      expect(u.set).toEqual({ ownerId: 'user_1' });
    }
  });
});
