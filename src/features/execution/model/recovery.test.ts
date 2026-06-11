import { describe, it, expect } from 'vitest';
import { decideRecovery, isLoginPath, IDLE_LIMIT_SEC } from './recovery.js';
import { startSession, endSession, type ExecState } from './executionMachine.js';

const T = (h: number, m = 0) =>
  `2026-06-08T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;
const running = (startH: number): ExecState =>
  startSession('set_1', ['i1', 'i2'], T(startH));

describe('decideRecovery (UC-EX-IDLE / RESUME, R2)', () => {
  it('IDLE_LIMIT_SEC = 4H', () => {
    expect(IDLE_LIMIT_SEC).toBe(4 * 3600);
  });
  it('U-REC-01: gap 1H は resume', () => {
    expect(
      decideRecovery({ state: running(9), lastSavedAt: T(9), now: T(10) }),
    ).toEqual({ kind: 'resume' });
  });
  it('U-REC-02: gap 4H ちょうどは autoEnd（endedAt=lastSavedAt）', () => {
    expect(
      decideRecovery({ state: running(9), lastSavedAt: T(9), now: T(13) }),
    ).toEqual({ kind: 'autoEnd', endedAt: T(9) });
  });
  it('U-REC-03: gap 8H は autoEnd', () => {
    expect(
      decideRecovery({ state: running(9), lastSavedAt: T(9), now: T(17) }),
    ).toEqual({ kind: 'autoEnd', endedAt: T(9) });
  });
  it('U-REC-B1: gap 14399s は resume', () => {
    const last = T(9);
    const now = '2026-06-08T12:59:59.000Z';
    expect(decideRecovery({ state: running(9), lastSavedAt: last, now })).toEqual({
      kind: 'resume',
    });
  });
  it('U-REC-E1: lastSavedAt 欠落は current startedAt にフォールバック', () => {
    // 開始 9:00、now 14:00 → fallbackRef=9:00、gap 5H → autoEnd at 9:00
    expect(
      decideRecovery({ state: running(9), lastSavedAt: null, now: T(14) }),
    ).toEqual({ kind: 'autoEnd', endedAt: T(9) });
  });
  it('U-REC-E2: 時計巻き戻し（gap<0）は resume', () => {
    expect(
      decideRecovery({ state: running(12), lastSavedAt: T(12), now: T(9) }),
    ).toEqual({ kind: 'resume' });
  });
  it('done 状態は resume（何もしない）', () => {
    const done = endSession(running(9), T(9, 30));
    expect(
      decideRecovery({ state: done, lastSavedAt: T(9, 30), now: T(20) }),
    ).toEqual({ kind: 'resume' });
  });
});

describe('isLoginPath (UC-EX-LOGIN-END, R8)', () => {
  it('U-LOGIN-01: /account は true', () => {
    expect(isLoginPath('/account')).toBe(true);
  });
  it('U-LOGIN-02: /summary/x は false（ふりかえりは終了しない）', () => {
    expect(isLoginPath('/summary/x')).toBe(false);
    expect(isLoginPath('/sets')).toBe(false);
    expect(isLoginPath('/run/set_1')).toBe(false);
  });
});
