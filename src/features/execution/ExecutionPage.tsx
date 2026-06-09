import type { ExecutionRepo } from "./model/executionRepo.js";
import { useExecution } from "./hooks/useExecution.js";

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

  return (
    <main aria-labelledby="exec-title">
      <h1 id="exec-title">{setName}</h1>
      {s.status !== "done" && (
        <section aria-label="実行中">
          <p data-testid="current-item">{currentName}</p>
          <p data-testid="elapsed">{mmss(currentRec.elapsedSec)}</p>
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
        <p role="status">おつかれさまでした。今日もひとつ、やれました。</p>
      )}
    </main>
  );
}
