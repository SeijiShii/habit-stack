import { describe, it, expect } from 'vitest';
import { elapsedSec, diffSec, cappedElapsedSec, MAX_ACTIVITY_SEC } from './elapsed.js';

const T = (h: number, m = 0, s = 0) =>
  `2026-06-08T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.000Z`;

describe('elapsedSec', () => {
  it('差分 - 一時停止累計', () => {
    expect(elapsedSec(T(9), T(10), 0)).toBe(3600);
    expect(elapsedSec(T(9), T(10), 600)).toBe(3000);
  });
  it('端末時計巻き戻しは 0', () => {
    expect(elapsedSec(T(10), T(9), 0)).toBe(0);
  });
});

describe('diffSec', () => {
  it('2 時刻の差（負値 0）', () => {
    expect(diffSec(T(9), T(9, 5))).toBe(300);
    expect(diffSec(T(9, 5), T(9))).toBe(0);
  });
});

describe('cappedElapsedSec (R1: 1活動 最大4H)', () => {
  it('MAX_ACTIVITY_SEC = 14400 (4H)', () => {
    expect(MAX_ACTIVITY_SEC).toBe(4 * 60 * 60);
  });
  it('U-R1-01: 4H 未満はクランプなし', () => {
    expect(cappedElapsedSec(T(9), T(12), 0)).toBe(3 * 3600);
  });
  it('U-R1-02: 5H はクランプ', () => {
    expect(cappedElapsedSec(T(9), T(14), 0)).toBe(MAX_ACTIVITY_SEC);
  });
  it('U-R1-B1: 14399 はそのまま', () => {
    expect(cappedElapsedSec(T(9), T(12, 59, 59), 0)).toBe(14399);
  });
  it('U-R1-B2: 14400 はそのまま', () => {
    expect(cappedElapsedSec(T(9), T(13), 0)).toBe(14400);
  });
  it('U-R1-B3: 14401 は 14400 にクランプ', () => {
    expect(cappedElapsedSec(T(9), T(13, 0, 1), 0)).toBe(14400);
  });
  it('U-R1-E1: 負値は 0', () => {
    expect(cappedElapsedSec(T(13), T(9), 0)).toBe(0);
  });
});
