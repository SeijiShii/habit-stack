import { elapsedSec, diffSec } from './elapsed.js';

export type ExecStatus = 'running' | 'paused' | 'done';

export interface ItemExec {
  itemId: string;
  startedAt: string;
  endedAt: string | null;
  elapsedSec: number;
  pausedTotalSec: number;
  note: string;
}

export interface ExecState {
  setId: string;
  status: ExecStatus;
  itemIds: string[];
  index: number;
  startedAt: string;
  endedAt: string | null;
  records: ItemExec[];
  pauseStartedAt: string | null;
}

const newRec = (itemId: string, now: string): ItemExec => ({
  itemId,
  startedAt: now,
  endedAt: null,
  elapsedSec: 0,
  pausedTotalSec: 0,
  note: '',
});

const current = (s: ExecState): ItemExec => s.records[s.records.length - 1]!;
const withCurrent = (s: ExecState, rec: ItemExec): ExecState => ({
  ...s,
  records: [...s.records.slice(0, -1), rec],
});

/** 実行開始（先頭アイテムの記録を開始、status=running）。 */
export function startSession(setId: string, itemIds: string[], now: string): ExecState {
  if (itemIds.length === 0) throw new Error('アイテムがありません');
  return {
    setId,
    status: 'running',
    itemIds,
    index: 0,
    startedAt: now,
    endedAt: null,
    records: [newRec(itemIds[0]!, now)],
    pauseStartedAt: null,
  };
}

/** 現アイテムを終了（経過確定）。 */
export function endCurrentItem(s: ExecState, now: string): ExecState {
  const rec = current(s);
  if (rec.endedAt) return s;
  return withCurrent(s, {
    ...rec,
    endedAt: now,
    elapsedSec: elapsedSec(rec.startedAt, now, rec.pausedTotalSec),
  });
}

/** 一時停止（pause 開始時刻を保持）。 */
export function pause(s: ExecState, now: string): ExecState {
  if (s.status !== 'running') return s;
  return { ...s, status: 'paused', pauseStartedAt: now };
}

/** 同じ活動を再開（pause 分を pausedTotalSec に加算）。 */
export function resumeSame(s: ExecState, now: string): ExecState {
  if (s.status !== 'paused') return s;
  const pausedFor = s.pauseStartedAt ? diffSec(s.pauseStartedAt, now) : 0;
  const rec = current(s);
  return {
    ...withCurrent(s, { ...rec, pausedTotalSec: rec.pausedTotalSec + pausedFor }),
    status: 'running',
    pauseStartedAt: null,
  };
}

/** 次のアイテムを開始（現アイテム未終了なら終了してから）。最終なら done。 */
export function nextItem(s: ExecState, now: string): ExecState {
  const ended = endCurrentItem(s, now);
  const idx = ended.index + 1;
  if (idx >= ended.itemIds.length) {
    return endSession(ended, now);
  }
  return {
    ...ended,
    status: 'running',
    index: idx,
    pauseStartedAt: null,
    records: [...ended.records, newRec(ended.itemIds[idx]!, now)],
  };
}

/** セット終了（現アイテム未終了なら終了、status=done）。 */
export function endSession(s: ExecState, now: string): ExecState {
  const ended = endCurrentItem(s, now);
  return { ...ended, status: 'done', endedAt: now, pauseStartedAt: null };
}

/** 今日メモを現アイテムに設定。 */
export function setNote(s: ExecState, note: string): ExecState {
  return withCurrent(s, { ...current(s), note: note.slice(0, 280) });
}

/** 実行されたアイテム数（達成判定用、穴あき許容: ≥1 で達成）。 */
export function doneItemCount(s: ExecState): number {
  return s.records.filter((r) => r.endedAt !== null || r.elapsedSec > 0).length;
}
