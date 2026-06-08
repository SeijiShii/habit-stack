import { describe, it, expect } from 'vitest';
import { resolveConflict } from './conflict.js';

describe('resolveConflict (last-write-wins)', () => {
  const mk = (updatedAt: string, tag: string) => ({ updatedAt, tag });

  it('E2: local が古い → server 採用', () => {
    const r = resolveConflict(mk('2026-06-08T00:00:00Z', 'L'), mk('2026-06-08T01:00:00Z', 'S'));
    expect(r.tag).toBe('S');
  });

  it('E3: local が新しい → local 採用', () => {
    const r = resolveConflict(mk('2026-06-08T02:00:00Z', 'L'), mk('2026-06-08T01:00:00Z', 'S'));
    expect(r.tag).toBe('L');
  });

  it('B1: 同値はサーバ採用（決定的）', () => {
    const r = resolveConflict(mk('2026-06-08T01:00:00Z', 'L'), mk('2026-06-08T01:00:00Z', 'S'));
    expect(r.tag).toBe('S');
  });
});
