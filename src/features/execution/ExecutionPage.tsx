import { useEffect, useState } from "react";
import type { ExecutionRepo } from "./model/executionRepo.js";
import { useExecution } from "./hooks/useExecution.js";
import { elapsedSec } from "./model/elapsed.js";
import type { ItemExec, ExecStatus } from "./model/executionMachine.js";

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
  now,
}: ExecutionPageProps) {
  const exec = useExecution(repo, sessionLocalId, { now });
  const s = exec.state;
  const nameById = new Map(items.map((i) => [i.id, i.name]));
  const nowIso = now ?? (() => new Date().toISOString());

  // 計時中（running / paused）は 1 秒ごとに再描画して現在時刻をライブ更新する。
  // 経過時間は paused 中 liveElapsed が pause 時点で凍結するため進まない（現在時刻だけ進む）。
  // 記録はタイムスタンプ差分方式のまま（このタイマーは表示専用、記録には影響しない）。
  const [, setTick] = useState(0);
  const isTiming = s?.status === "running" || s?.status === "paused";
  useEffect(() => {
    if (!isTiming) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isTiming]);

  if (!s) {
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
    if (status === "paused")
      return elapsedSec(
        rec.startedAt,
        s.pauseStartedAt ?? nowIso(),
        rec.pausedTotalSec,
      );
    return elapsedSec(rec.startedAt, nowIso(), rec.pausedTotalSec);
  };

  return (
    <main aria-labelledby="exec-title">
      <h1 id="exec-title">{setName}</h1>
      {s.status !== "done" && (
        <section aria-label="実行中">
          <p data-testid="current-item">{currentName}</p>
          <p data-testid="elapsed">{mmss(liveElapsed(currentRec, s.status))}</p>
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
              <button type="button" onClick={exec.endItem}>
                終了
              </button>
              {!isLast && (
                <button type="button" onClick={exec.next}>
                  次へ
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
                次を開始
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
