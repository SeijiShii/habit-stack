import { useEffect, useRef, useState } from "react";
import type { ExecutionRepo } from "./model/executionRepo.js";
import { useExecution } from "./hooks/useExecution.js";
import {
  cappedElapsedSec,
  periodsElapsedSec,
  sessionElapsedSec,
} from "./model/elapsed.js";
import { formatDuration } from "../../services/time/localDate.js";
import { saveHeartbeat, clearHeartbeat } from "./model/heartbeat.js";
import type {
  ItemExec,
  ExecStatus,
  ExecState,
} from "./model/executionMachine.js";

/** バックエンド永続（outbox flush）の周期。毎秒 localStorage に対し 15 秒（R20260611-001）。 */
const BACKEND_FLUSH_EVERY_SEC = 15;

export interface ExecItem {
  id: string;
  name: string;
}

export interface ExecutionPageProps {
  repo: ExecutionRepo;
  setId: string;
  setName: string;
  items: ExecItem[];
  sessionLocalId: string;
  /** 現在の owner id。localStorage ハートビートを account-scoped に保存するために使う。 */
  ownerId?: string;
  /**
   * セット詳細「開始」からの遷移時 true。進行中が無ければ復元 settle 後に自動で計時開始し、
   * 中間の「開始」ゲートを挟まない（R20260614-001）。
   */
  autoStart?: boolean;
  now?: () => string;
}

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** ISO 時刻をローカルの HH:MM:SS 表記にする（計時中の開始時刻・現在時刻表示用）。 */
function hhmmss(iso: string): string {
  const d = new Date(iso);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export function ExecutionPage({
  repo,
  setId,
  setName,
  items,
  sessionLocalId,
  ownerId,
  autoStart,
  now,
}: ExecutionPageProps) {
  const exec = useExecution(repo, sessionLocalId, { now });
  const s = exec.state;
  const nameById = new Map(items.map((i) => [i.id, i.name]));
  const nowIso = now ?? (() => new Date().toISOString());

  // 計時中（running / paused）は 1 秒ごとに再描画して現在時刻をライブ更新する。
  // 経過時間は paused 中 liveElapsed が pause 時点で凍結するため進まない（現在時刻だけ進む）。
  // 記録はタイムスタンプ差分方式のまま（このタイマーは表示専用、記録には影響しない）。
  // 併せて: 毎秒 localStorage ハートビート保存 + 15 秒ごと backend flush（R20260611-001）。
  const [, setTick] = useState(0);
  const isTiming = s?.status === "running" || s?.status === "paused";
  // interval から最新の state / id を読むための ref（stale closure 回避）。
  const stateRef = useRef<ExecState | null>(s);
  stateRef.current = s;
  const tickRef = useRef(0);
  useEffect(() => {
    if (!isTiming) return;
    const id = setInterval(() => {
      setTick((t) => t + 1);
      tickRef.current += 1;
      const cur = stateRef.current;
      if (!cur) return;
      const at = nowIso();
      // 毎秒: localStorage ハートビート（account-scoped）。
      if (ownerId) {
        saveHeartbeat(ownerId, {
          sessionLocalId: exec.activeId.current,
          lastSavedAt: at,
          snapshot: cur,
        });
      }
      // 15 秒ごと: backend へ lastSavedAt 付きで再永続（outbox 投入、push は sync driver 依存）。
      if (tickRef.current % BACKEND_FLUSH_EVERY_SEC === 0) {
        void repo.persist(exec.activeId.current, cur, { lastSavedAt: at });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isTiming, ownerId, repo, exec.activeId, nowIso]);

  // セッション done でハートビートを消す（放置判定に古いセッションを残さない）。
  useEffect(() => {
    if (s?.status === "done" && ownerId) clearHeartbeat(ownerId);
  }, [s?.status, ownerId]);

  // セット詳細「開始」からの遷移（autoStart）時、復元 settle 後に進行中が無ければ自動で計時開始する。
  // 進行中（同セット）があれば exec.state が復元されるため start は走らず、そのまま再開になる（R20260614-001）。
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (!autoStart || !exec.restored || exec.state || autoStartedRef.current)
      return;
    if (items.length === 0) return;
    autoStartedRef.current = true;
    exec.start(
      setId,
      items.map((i) => i.id),
    );
  }, [autoStart, exec.restored, exec.state, exec.start, setId, items]);

  if (!s) {
    // autoStart 中は中間「開始」ボタンを出さず、自動開始まで穏やかに待つ。
    if (autoStart) {
      return (
        <main aria-labelledby="exec-title">
          <h1 id="exec-title">{setName}</h1>
          <p aria-busy="true">準備中…</p>
        </main>
      );
    }
    return (
      <main aria-labelledby="exec-title">
        <h1 id="exec-title">{setName}</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            exec.start(
              setId,
              items.map((i) => i.id),
            )
          }
        >
          開始
        </button>
      </main>
    );
  }

  const currentRec = s.records[s.records.length - 1]!;
  const currentName = nameById.get(currentRec.itemId) ?? currentRec.itemId;
  const isLast = s.index >= s.itemIds.length - 1;

  // 計時中の経過秒を now との差分でライブ算出（保存済みの確定値ではなく）。
  // 一時停止中は pause 開始時点で凍結、終了済みは確定値を表示。
  const liveElapsed = (rec: ItemExec, status: ExecStatus): number => {
    if (rec.endedAt) return rec.elapsedSec;
    const openEnd =
      status === "paused" ? (s.pauseStartedAt ?? nowIso()) : nowIso();
    // periods があれば SoT に live 算出（中断は period の隙間で除外、R20260614-002）。
    if (rec.periods && rec.periods.length) {
      return periodsElapsedSec(rec.periods, openEnd);
    }
    return cappedElapsedSec(rec.startedAt, openEnd, rec.pausedTotalSec);
  };

  return (
    <main aria-labelledby="exec-title">
      <h1 id="exec-title">{setName}</h1>
      {s.status !== "done" && (
        <section aria-label="実行中">
          <p data-testid="current-item">{currentName}</p>
          <p data-testid="elapsed">{mmss(liveElapsed(currentRec, s.status))}</p>
          <p data-testid="set-elapsed">
            合計時間 {formatDuration(sessionElapsedSec(s, nowIso()))}
          </p>
          <p data-testid="started-at">開始 {hhmmss(currentRec.startedAt)}</p>
          <p data-testid="current-time">現在 {hhmmss(nowIso())}</p>
          <textarea
            aria-label="今日のメモ"
            maxLength={280}
            value={currentRec.note}
            onChange={(e) => exec.setNote(e.target.value)}
          />
          {s.status === "running" ? (
            <>
              {!isLast && (
                <button type="button" onClick={exec.next}>
                  次の活動へ
                </button>
              )}
              <button type="button" onClick={exec.pause}>
                一時停止
              </button>
              <button type="button" onClick={exec.end}>
                セット終了
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={exec.resume}>
                同じ活動を再開
              </button>
              <button type="button" onClick={exec.next}>
                次の活動へ
              </button>
            </>
          )}
        </section>
      )}
      {s.status === "done" && (
        <p role="status">おつかれさまでした。今日もひとつ、できました。</p>
      )}
    </main>
  );
}
