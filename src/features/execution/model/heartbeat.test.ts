import { describe, it, expect } from 'vitest';
import { saveHeartbeat, loadHeartbeat, clearHeartbeat } from './heartbeat.js';
import { startSession, type ExecState } from './executionMachine.js';

/** in-memory localStorage モック。 */
function memStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    _dump: () => m,
  };
}

const state: ExecState = startSession('set_1', ['i1', 'i2'], '2026-06-08T09:00:00.000Z');
const hb = {
  sessionLocalId: 'sess_1',
  lastSavedAt: '2026-06-08T09:01:00.000Z',
  snapshot: state,
};

describe('heartbeat (localStorage, account-scoped)', () => {
  it('U-HB-01/02: save → load で往復', () => {
    const st = memStorage();
    saveHeartbeat('owner_1', hb, st);
    expect(st.getItem('hs:exec:hb:owner_1')).toBeTruthy();
    expect(loadHeartbeat('owner_1', st)).toMatchObject({
      sessionLocalId: 'sess_1',
      lastSavedAt: '2026-06-08T09:01:00.000Z',
    });
  });

  it('U-HB-E1: owner 不一致は読めない（namespace 分離）', () => {
    const st = memStorage();
    saveHeartbeat('owner_1', hb, st);
    expect(loadHeartbeat('owner_2', st)).toBeUndefined();
  });

  it('U-HB-E2: JSON 破損は undefined（throw しない）', () => {
    const st = memStorage();
    st.setItem('hs:exec:hb:owner_1', '{ broken');
    expect(loadHeartbeat('owner_1', st)).toBeUndefined();
  });

  it('欠落（未保存）は undefined', () => {
    const st = memStorage();
    expect(loadHeartbeat('owner_x', st)).toBeUndefined();
  });

  it('U-HB-03: clear で削除', () => {
    const st = memStorage();
    saveHeartbeat('owner_1', hb, st);
    clearHeartbeat('owner_1', st);
    expect(loadHeartbeat('owner_1', st)).toBeUndefined();
  });
});
