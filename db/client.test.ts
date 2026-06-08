import { describe, it, expect } from 'vitest';
import { createDb } from './client.js';

describe('createDb', () => {
  it('E1: DATABASE_URL 未設定で明示エラー', () => {
    expect(() => createDb('')).toThrow('DATABASE_URL が必要です');
  });

  it('N5: 有効な接続文字列で drizzle インスタンスを返す（接続は遅延）', () => {
    const db = createDb('postgresql://user:pass@ep-test.neon.tech/habitstack');
    expect(db).toBeDefined();
    // drizzle インスタンスはクエリビルダ（select 等）を持つ
    expect(typeof db.select).toBe('function');
  });
});
