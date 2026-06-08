// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSync } from './useSync.js';
import type { SyncQueue } from '../services/sync/syncQueue.js';

const mockQueue = () =>
  ({ run: vi.fn(async () => ({ pushed: 0, pulled: 0 })) }) as unknown as SyncQueue;

describe('useSync', () => {
  it('認証済みでマウント時に run を即実行', () => {
    const q = mockQueue();
    renderHook(() => useSync(q, () => '2026-06-08T00:00:00Z', true));
    expect(q.run).toHaveBeenCalledTimes(1);
  });

  it('online イベントで再実行', () => {
    const q = mockQueue();
    renderHook(() => useSync(q, () => 's', true));
    window.dispatchEvent(new Event('online'));
    expect(q.run).toHaveBeenCalledTimes(2);
  });

  it('未認証（enabled=false）では実行しない', () => {
    const q = mockQueue();
    renderHook(() => useSync(q, () => 's', false));
    expect(q.run).not.toHaveBeenCalled();
  });
});
