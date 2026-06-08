import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  TIME_OF_DAY,
  SESSION_STATUS,
  asOwnerId,
  type OwnerId,
  type TimeOfDay,
  type ContinuationRate,
} from './domain.js';
import type { SyncEnvelope } from './sync.js';
import type { ActivitySet } from './db.js';

describe('domain enum const', () => {
  it('N1: TIME_OF_DAY は 4 値', () => {
    expect([...TIME_OF_DAY]).toEqual(['morning', 'noon', 'evening', 'night']);
  });
  it('N2: SESSION_STATUS は 3 値', () => {
    expect([...SESSION_STATUS]).toEqual(['running', 'paused', 'done']);
  });
});

describe('branded OwnerId', () => {
  it('E1: asOwnerId で確定（owner resolver 用）', () => {
    const owner: OwnerId = asOwnerId('user_123');
    expect(owner).toBe('user_123');
    // branded のため素 string の直接代入はコンパイル不可（型テスト）
    expectTypeOf<OwnerId>().toMatchTypeOf<string>();
  });
});

describe('型 shape', () => {
  it('N4: SyncEnvelope<ActivitySet> が必須キーを持つ', () => {
    expectTypeOf<SyncEnvelope<ActivitySet>>().toHaveProperty('entity');
    expectTypeOf<SyncEnvelope<ActivitySet>>().toHaveProperty('op');
    expectTypeOf<SyncEnvelope<ActivitySet>>().toHaveProperty('payload');
    expectTypeOf<SyncEnvelope<ActivitySet>>().toHaveProperty('clientLocalId');
  });

  it('N5: ContinuationRate', () => {
    const r: ContinuationRate = { achievedDays: 7, totalDays: 10, rate: 0.7 };
    expect(r.rate).toBeCloseTo(0.7);
    expectTypeOf<ContinuationRate['rate']>().toEqualTypeOf<number>();
  });

  it('TimeOfDay union が enum const と一致', () => {
    const v: TimeOfDay = 'morning';
    expect(TIME_OF_DAY).toContain(v);
  });
});
