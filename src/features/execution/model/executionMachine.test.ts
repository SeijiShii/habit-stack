import { describe, it, expect } from 'vitest';
import {
  startSession,
  endCurrentItem,
  pause,
  resumeSame,
  nextItem,
  endSession,
  doneItemCount,
  type ExecState,
} from './executionMachine.js';
import { elapsedSec } from './elapsed.js';

const T = (h: number, m = 0, s = 0) =>
  `2026-06-08T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.000Z`;

const start = (): ExecState => startSession('set_1', ['i1', 'i2', 'i3'], T(8));

describe('elapsed', () => {
  it('N6: 経過 = 差分 - pause', () => {
    expect(elapsedSec(T(8, 0, 0), T(8, 2, 0), 30)).toBe(90); // 120s - 30
  });
  it('E1: 端末時計戻りは 0 クランプ', () => {
    expect(elapsedSec(T(8, 5), T(8, 0), 0)).toBe(0);
  });
});

describe('executionMachine 遷移', () => {
  it('N1: start で running + 先頭 record', () => {
    const s = start();
    expect(s.status).toBe('running');
    expect(s.records).toHaveLength(1);
    expect(s.records[0].itemId).toBe('i1');
  });

  it('N2: endItem→next で現 record 終了 + 次 record', () => {
    let s = start();
    s = nextItem(s, T(8, 1)); // i1 終了(60s) → i2 開始
    expect(s.index).toBe(1);
    expect(s.records[0].endedAt).toBe(T(8, 1));
    expect(s.records[0].elapsedSec).toBe(60);
    expect(s.records[1].itemId).toBe('i2');
  });

  it('N3: pause→resumeSame で pause 分を経過から除外', () => {
    let s = start(); // i1 start 08:00
    s = pause(s, T(8, 1)); // 1 分後 pause
    s = resumeSame(s, T(8, 3)); // 2 分後 resume → pausedTotalSec += 120
    s = endCurrentItem(s, T(8, 4)); // 08:04 終了 → 経過 = 240 - 120 = 120
    expect(s.records[0].pausedTotalSec).toBe(120);
    expect(s.records[0].elapsedSec).toBe(120);
  });

  it('N5/N4: 最終アイテムで nextItem → done', () => {
    let s = start();
    s = nextItem(s, T(8, 1)); // i2
    s = nextItem(s, T(8, 2)); // i3
    s = nextItem(s, T(8, 3)); // 最終 → done
    expect(s.status).toBe('done');
    expect(s.endedAt).toBe(T(8, 3));
  });

  it('endSession で done + 現アイテム終了', () => {
    let s = start();
    s = endSession(s, T(8, 5));
    expect(s.status).toBe('done');
    expect(s.records[0].endedAt).toBe(T(8, 5));
  });
});

describe('達成判定 (穴あき許容、D20260608-003)', () => {
  it('B3: 1 アイテムだけ実行でも doneItemCount ≥ 1', () => {
    let s = start();
    s = endSession(s, T(8, 1)); // i1 のみ実行、i2/i3 未実行
    expect(doneItemCount(s)).toBe(1); // 穴あきでも達成（≥1）
  });

  it('B2: 全アイテム実行で doneItemCount = 全件', () => {
    let s = start();
    s = nextItem(s, T(8, 1));
    s = nextItem(s, T(8, 2));
    s = endSession(s, T(8, 3));
    expect(doneItemCount(s)).toBe(3);
  });
});
