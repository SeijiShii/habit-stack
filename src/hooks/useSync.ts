import { useEffect } from 'react';
import type { SyncQueue } from '../services/sync/syncQueue.js';

/**
 * オンライン復帰 / 認証確立時に同期を起動する（非ブロッキング、UI を止めない）。
 * @param queue 同期キュー（未確立時 null）
 * @param getSince 前回 pull 時刻を返す
 * @param enabled 認証済み（owner あり）のとき true
 */
export function useSync(
  queue: SyncQueue | null,
  getSince: () => string,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!queue || !enabled) return;
    const run = () => {
      void queue.run(getSince()).catch(() => {
        // 失敗は握る（outbox 保持、次の online で再送）
      });
    };
    run(); // 認証/オンライン時に即実行
    window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, [queue, enabled, getSince]);
}
