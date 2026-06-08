import { LocalStore, type LocalRecord } from '../../../services/sync/localStore.js';
import type { OwnerId } from '../../../types/domain.js';
import { doneItemCount, type ExecState } from './executionMachine.js';

/** YYYY-MM-DD（ユーザーローカル日付）。 */
export function localDate(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * 実行セッション / 記録を local-sync に永続し、達成日（穴あき許容）を upsert する。
 * id は sessionLocalId から決定的に導出 → 各遷移で put 上書き（冪等）。
 */
export class ExecutionRepo {
  private readonly now: () => string;

  constructor(
    private readonly store: LocalStore,
    private readonly ownerId: OwnerId,
    deps: { now?: () => string } = {},
  ) {
    this.now = deps.now ?? (() => new Date().toISOString());
  }

  /** ExecState を session + records としてローカル保存。 */
  async persist(sessionLocalId: string, state: ExecState): Promise<void> {
    const t = this.now();
    const session: LocalRecord = {
      id: sessionLocalId,
      ownerId: this.ownerId,
      clientLocalId: sessionLocalId,
      setId: state.setId,
      startedAt: state.startedAt,
      endedAt: state.endedAt,
      status: state.status,
      updatedAt: t,
      deletedAt: null,
    };
    await this.store.put('execution_session', session);

    for (const rec of state.records) {
      const id = `${sessionLocalId}:${rec.itemId}`;
      const record: LocalRecord = {
        id,
        ownerId: this.ownerId,
        clientLocalId: id,
        sessionId: sessionLocalId,
        itemId: rec.itemId,
        startedAt: rec.startedAt,
        endedAt: rec.endedAt,
        elapsedSec: rec.elapsedSec,
        pausedTotalSec: rec.pausedTotalSec,
        note: rec.note,
        updatedAt: t,
        deletedAt: null,
      };
      await this.store.put('execution_record', record);
    }

    // 達成日記録（穴あき許容: 1 アイテム以上実行で achieved=true）
    const count = doneItemCount(state);
    if (count >= 1) {
      await this.recordAchievement(state.setId, localDate(state.startedAt), count);
    }
  }

  async recordAchievement(setId: string, date: string, itemDoneCount: number): Promise<void> {
    const id = `${this.ownerId}:${setId}:${date}`;
    const record: LocalRecord = {
      id,
      ownerId: this.ownerId,
      clientLocalId: id,
      setId,
      date,
      achieved: true,
      itemDoneCount,
      updatedAt: this.now(),
      deletedAt: null,
    };
    await this.store.put('daily_achievement', record);
  }

  /** 進行中（status != done）の session を復元する（アプリ再起動時、SPEC E3）。 */
  async findInProgress(): Promise<LocalRecord | undefined> {
    const sessions = await this.store.getAllByOwner('execution_session', this.ownerId);
    return sessions.find((s) => s.status !== 'done');
  }
}
