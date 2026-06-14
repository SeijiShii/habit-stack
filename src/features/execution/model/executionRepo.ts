import {
  LocalStore,
  type LocalRecord,
} from "../../../services/sync/localStore.js";
import { localDateOf } from "../../../services/time/localDate.js";
import type { OwnerId } from "../../../types/domain.js";
import {
  doneItemCount,
  endSession,
  type ExecState,
  type ExecStatus,
  type ItemExec,
  type Period,
} from "./executionMachine.js";

/** YYYY-MM-DD（ユーザーローカル日付。UTC slice ではなく端末 TZ で導出、R20260613-001）。 */
export function localDate(iso: string): string {
  return localDateOf(new Date(iso));
}

/** persist のオプション。lastSavedAt（ハートビート）+ 達成記録モード。 */
export interface PersistOpts {
  /** 進行中セッションの最終生存時刻（backend last_saved_at へ伝播）。 */
  lastSavedAt?: string | null;
  /**
   * 'auto'（既定）= doneItemCount（既存挙動）。
   * 'strict' = 有効経過>0 の item のみ達成算入（自動終了経路、spec-review R3）。
   */
  achievementMode?: "auto" | "strict";
}

/** 有効経過>0 の item 数（strict 達成判定、0 秒放置を継続に算入しない）。 */
function strictDoneCount(state: ExecState): number {
  return state.records.filter((r) => r.elapsedSec > 0).length;
}

/** 復元結果。id は found レコードの clientLocalId を採用（spec-review R6、日跨ぎ重複防止）。 */
export interface RestoreResult {
  id: string;
  state: ExecState;
  lastSavedAt: string | null;
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

  /**
   * ExecState を session + records としてローカル保存。
   * session レコードは itemIds/index/pauseStartedAt も保持し、ExecState を損失なく復元可能にする
   * （IndexedDB=構造正本、spec-review R4）。これらは backend スキーマに列がないため Drizzle upsert で
   * 無視される（既存 deletedAt と同様、backend 互換）。lastSavedAt のみ last_saved_at 列へ伝播。
   */
  async persist(
    sessionLocalId: string,
    state: ExecState,
    opts: PersistOpts = {},
  ): Promise<void> {
    const t = this.now();
    const session: LocalRecord = {
      id: sessionLocalId,
      ownerId: this.ownerId,
      clientLocalId: sessionLocalId,
      setId: state.setId,
      startedAt: state.startedAt,
      endedAt: state.endedAt,
      status: state.status,
      itemIds: state.itemIds,
      index: state.index,
      pauseStartedAt: state.pauseStartedAt,
      lastSavedAt: opts.lastSavedAt ?? null,
      updatedAt: t,
      deletedAt: null,
    };
    await this.store.put("execution_session", session);

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
        // periods は 1:N 計時区間の SoT（R20260614-002）。IndexedDB=構造正本（R4）。
        // backend スキーマに列が無くても itemIds 等と同様に upsert で無視され互換を保つ。
        periods: rec.periods,
        elapsedSec: rec.elapsedSec,
        pausedTotalSec: rec.pausedTotalSec,
        note: rec.note,
        updatedAt: t,
        deletedAt: null,
      };
      await this.store.put("execution_record", record);
    }

    // 達成日記録（穴あき許容: 1 アイテム以上実行で achieved=true）。
    // strict モード（自動終了経路）は有効経過>0 のみ算入し、0 秒放置を継続に入れない（R3）。
    const count =
      opts.achievementMode === "strict"
        ? strictDoneCount(state)
        : doneItemCount(state);
    if (count >= 1) {
      await this.recordAchievement(
        state.setId,
        localDate(state.startedAt),
        count,
      );
    }
  }

  async recordAchievement(
    setId: string,
    date: string,
    itemDoneCount: number,
  ): Promise<void> {
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
    await this.store.put("daily_achievement", record);
  }

  /** 進行中（status != done）の session を復元する（アプリ再起動時、SPEC E3）。 */
  async findInProgress(): Promise<LocalRecord | undefined> {
    const sessions = await this.store.getAllByOwner(
      "execution_session",
      this.ownerId,
    );
    return sessions.find((s) => s.status !== "done");
  }

  /**
   * 進行中セッションを ExecState として損失なく復元する（UC-EX-RESUME、R6/R4）。
   * id は found レコードの clientLocalId を採用（日付スタンプ id の再計算による重複生成を防ぐ）。
   */
  async restoreInProgress(): Promise<RestoreResult | undefined> {
    const session = await this.findInProgress();
    if (!session) return undefined;
    const id = String(session.clientLocalId ?? session.id);
    const allRecs = await this.store.getAllByOwner(
      "execution_record",
      this.ownerId,
    );
    const records: ItemExec[] = allRecs
      .filter((r) => r.sessionId === id)
      .sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)))
      .map((r) => {
        const startedAt = String(r.startedAt);
        const endedAt = (r.endedAt as string | null) ?? null;
        // periods が無い legacy レコードは単一ペアから合成する（R20260614-002 後方互換）。
        const periods: Period[] =
          Array.isArray(r.periods) && r.periods.length
            ? (r.periods as Period[])
            : [{ startedAt, endedAt }];
        return {
          itemId: String(r.itemId),
          startedAt,
          endedAt,
          periods,
          elapsedSec: Number(r.elapsedSec ?? 0),
          pausedTotalSec: Number(r.pausedTotalSec ?? 0),
          note: String(r.note ?? ""),
        };
      });
    const state: ExecState = {
      setId: String(session.setId),
      status: session.status as ExecStatus,
      itemIds: (session.itemIds as string[]) ?? records.map((r) => r.itemId),
      index: Number(session.index ?? Math.max(0, records.length - 1)),
      startedAt: String(session.startedAt),
      endedAt: (session.endedAt as string | null) ?? null,
      records,
      pauseStartedAt: (session.pauseStartedAt as string | null) ?? null,
    };
    const lastSavedAt =
      (session.lastSavedAt as string | null) ??
      (session.updatedAt as string | null) ??
      null;
    return { id, state, lastSavedAt };
  }

  /**
   * 進行中セッションがあれば now で終了する（UC-EX-LOGIN-END、R8）。
   * ログイン画面遷移時に呼ぶ。達成は strict（有効経過>0 のみ）。進行中がなければ no-op。
   */
  async endInProgressNow(now: string): Promise<ExecState | undefined> {
    const found = await this.restoreInProgress();
    if (!found) return undefined;
    const ended = endSession(found.state, now);
    await this.persist(found.id, ended, {
      lastSavedAt: now,
      achievementMode: "strict",
    });
    return ended;
  }
}
