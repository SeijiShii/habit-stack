import { describe, it, expect } from 'vitest';
import { aggregateSetTotals, type SessionLike, type RecordLike } from './overview.js';

const sess = (id: string, setId: string): SessionLike => ({ id, clientLocalId: id, setId });
const rec = (sessionId: string, itemId: string, elapsedSec: number): RecordLike => ({
  sessionId,
  itemId,
  elapsedSec,
});

describe('aggregateSetTotals', () => {
  it('U-OV-01: setId / itemId 別に elapsedSec を合算', () => {
    const sessions = [sess('s1', 'set_a'), sess('s2', 'set_a'), sess('s3', 'set_b')];
    const records = [
      rec('s1', 'i1', 60),
      rec('s1', 'i2', 30),
      rec('s2', 'i1', 40),
      rec('s3', 'i9', 100),
    ];
    const totals = aggregateSetTotals(sessions, records);
    const a = totals.find((t) => t.setId === 'set_a')!;
    const b = totals.find((t) => t.setId === 'set_b')!;
    expect(a.totalSec).toBe(130);
    expect(a.items.find((i) => i.itemId === 'i1')?.totalSec).toBe(100);
    expect(a.items.find((i) => i.itemId === 'i2')?.totalSec).toBe(30);
    expect(b.totalSec).toBe(100);
  });

  it('U-OV-03: session に紐づかない record は無視して継続', () => {
    const totals = aggregateSetTotals([sess('s1', 'set_a')], [
      rec('s1', 'i1', 10),
      rec('orphan', 'i1', 999),
    ]);
    expect(totals).toHaveLength(1);
    expect(totals[0]!.totalSec).toBe(10);
  });

  it('U-OV-04: 記録ゼロのセットは totals に現れない（UI 側で 0分 表示）', () => {
    expect(aggregateSetTotals([sess('s1', 'set_a')], [])).toEqual([]);
  });
});
