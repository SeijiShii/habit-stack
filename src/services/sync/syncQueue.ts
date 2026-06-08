import { LocalStore, type LocalRecord, type OutboxItem } from './localStore.js';
import { resolveConflict } from './conflict.js';
import type { SyncEnvelope } from '../../types/sync.js';

export type Fetcher = typeof fetch;

const toEnvelope = (i: OutboxItem): SyncEnvelope<LocalRecord> => ({
  entity: i.entity,
  op: i.op,
  payload: i.payload,
  clientLocalId: i.clientLocalId,
  updatedAt: i.updatedAt,
});

/**
 * 双方向同期キュー。push（outbox → サーバ）と pull（サーバ差分 → ローカル、last-write-wins）。
 * 認証時 / オンライン復帰時に run() を呼ぶ（owner はサーバが強制、SEC-001）。
 */
export class SyncQueue {
  constructor(
    private readonly store: LocalStore,
    private readonly fetcher: Fetcher = fetch,
  ) {}

  /** 未同期分をサーバへ push。失敗時は outbox を保持（リトライ）。 */
  async push(): Promise<{ pushed: number }> {
    const items = await this.store.drainOutbox();
    if (items.length === 0) return { pushed: 0 };
    const res = await this.fetcher('/api/sync/push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(items.map(toEnvelope)),
    });
    if (!res.ok) {
      throw new Error('sync push failed'); // outbox 保持 → 次回再送（冪等）
    }
    const seqs = items
      .map((i) => i.seq)
      .filter((s): s is number => typeof s === 'number');
    await this.store.clearOutbox(seqs);
    return { pushed: items.length };
  }

  /** サーバ差分を pull してローカルへ反映（競合は last-write-wins）。 */
  async pull(since: string): Promise<{ pulled: number }> {
    const res = await this.fetcher(
      `/api/sync/pull?since=${encodeURIComponent(since)}`,
    );
    if (!res.ok) {
      throw new Error('sync pull failed');
    }
    const data = (await res.json()) as {
      changes: SyncEnvelope<LocalRecord>[];
    };
    for (const ch of data.changes) {
      const local = await this.store.get(ch.entity, ch.payload.id);
      const winner = local ? resolveConflict(local, ch.payload) : ch.payload;
      await this.store.applyRemote(ch.entity, winner);
    }
    return { pulled: data.changes.length };
  }

  async run(since: string): Promise<{ pushed: number; pulled: number }> {
    const { pushed } = await this.push();
    const { pulled } = await this.pull(since);
    return { pushed, pulled };
  }
}
