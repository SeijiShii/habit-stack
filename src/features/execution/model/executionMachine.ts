import { confirmedPeriodsSec } from "./elapsed.js";

export type ExecStatus = "running" | "paused" | "done";

/**
 * 1 活動内の 1 計時区間（R20260614-002）。中断（pause）で閉じ、再開で新しい period を開く。
 * 1 活動は 1:N の period を持てる（無制限）。開いた period（endedAt=null）は末尾に高々 1 つ。
 */
export interface Period {
  startedAt: string;
  endedAt: string | null;
}

export interface ItemExec {
  itemId: string;
  /** 最初の開始時刻（= periods[0].startedAt）。活動画面の「開始」表示に使う妥協（R20260614-002）。 */
  startedAt: string;
  /** 活動が確定終了した時刻（endCurrentItem 時）。計時中は null。 */
  endedAt: string | null;
  /** 計時区間の列（1:N、SoT）。中断時間は period 間の隙間として自然に除外される。 */
  periods: Period[];
  /** 確定経過秒 = 閉じた period 長の合計（4H クランプ）。 */
  elapsedSec: number;
  /** legacy 互換フィールド（単一ペア時代の一時停止累計）。periods 導入後の新規は 0。 */
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
  /** legacy 互換（単一ペア時代の pause 開始時刻）。periods 導入後は elapsed 計算に使わない。 */
  pauseStartedAt: string | null;
}

const newRec = (itemId: string, now: string): ItemExec => ({
  itemId,
  startedAt: now,
  endedAt: null,
  periods: [{ startedAt: now, endedAt: null }],
  elapsedSec: 0,
  pausedTotalSec: 0,
  note: "",
});

/** 末尾の開いた period を now で閉じる（開いた period が無ければそのまま）。 */
function closeOpenPeriod(periods: Period[], now: string): Period[] {
  if (periods.length === 0) return periods;
  const last = periods[periods.length - 1]!;
  if (last.endedAt !== null) return periods;
  return [...periods.slice(0, -1), { ...last, endedAt: now }];
}

const current = (s: ExecState): ItemExec => s.records[s.records.length - 1]!;
const withCurrent = (s: ExecState, rec: ItemExec): ExecState => ({
  ...s,
  records: [...s.records.slice(0, -1), rec],
});

/** 実行開始（先頭アイテムの記録を開始、status=running）。 */
export function startSession(
  setId: string,
  itemIds: string[],
  now: string,
): ExecState {
  if (itemIds.length === 0) throw new Error("アイテムがありません");
  return {
    setId,
    status: "running",
    itemIds,
    index: 0,
    startedAt: now,
    endedAt: null,
    records: [newRec(itemIds[0]!, now)],
    pauseStartedAt: null,
  };
}

/** 現アイテムを終了（経過確定）。開いている period を閉じてから合計を確定する。 */
export function endCurrentItem(s: ExecState, now: string): ExecState {
  const rec = current(s);
  if (rec.endedAt) return s;
  const periods = closeOpenPeriod(rec.periods, now);
  return withCurrent(s, {
    ...rec,
    periods,
    endedAt: now,
    elapsedSec: confirmedPeriodsSec(periods),
  });
}

/** 一時停止（現 period を閉じる → 中断中は開いた period が無く計時が止まる）。 */
export function pause(s: ExecState, now: string): ExecState {
  if (s.status !== "running") return s;
  const rec = current(s);
  const periods = closeOpenPeriod(rec.periods, now);
  return {
    ...withCurrent(s, {
      ...rec,
      periods,
      elapsedSec: confirmedPeriodsSec(periods),
    }),
    status: "paused",
    pauseStartedAt: now,
  };
}

/** 同じ活動を再開（新しい period を開く）。中断区間（period の隙間）は経過に算入されない。 */
export function resumeSame(s: ExecState, now: string): ExecState {
  if (s.status !== "paused") return s;
  const rec = current(s);
  return {
    ...withCurrent(s, {
      ...rec,
      periods: [...rec.periods, { startedAt: now, endedAt: null }],
    }),
    status: "running",
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
    status: "running",
    index: idx,
    pauseStartedAt: null,
    records: [...ended.records, newRec(ended.itemIds[idx]!, now)],
  };
}

/** セット終了（現アイテム未終了なら終了、status=done）。 */
export function endSession(s: ExecState, now: string): ExecState {
  const ended = endCurrentItem(s, now);
  return { ...ended, status: "done", endedAt: now, pauseStartedAt: null };
}

/** 今日メモを現アイテムに設定。 */
export function setNote(s: ExecState, note: string): ExecState {
  return withCurrent(s, { ...current(s), note: note.slice(0, 280) });
}

/** 実行されたアイテム数（達成判定用、穴あき許容: ≥1 で達成）。 */
export function doneItemCount(s: ExecState): number {
  return s.records.filter((r) => r.endedAt !== null || r.elapsedSec > 0).length;
}
