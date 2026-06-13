/**
 * 経過秒 = (終了 - 開始)/1000 - 一時停止累計。タイムスタンプ差分で算出（生タイマー不使用）。
 * 端末時計が戻った場合（負値）は 0 にクランプ（SPEC E1）。
 */
export function elapsedSec(
  startedAt: string,
  endedAt: string,
  pausedTotalSec: number,
): number {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return Math.max(0, Math.floor(ms / 1000) - pausedTotalSec);
}

/** 2 つの ISO 時刻の差（秒、負値は 0）。pause 時間の算出に使う。 */
export function diffSec(from: string, to: string): number {
  return Math.max(
    0,
    Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 1000),
  );
}

/** 1 活動の最大計時時間（秒）。4H。「口が開いたまま」放置の暴走を防ぐ上限（R20260611-001 R1）。 */
export const MAX_ACTIVITY_SEC = 4 * 60 * 60;

/**
 * 経過秒を 1 活動 4H で上限クランプした値。表示（liveElapsed）と確定保存値（endCurrentItem）の双方で使う。
 * 計算値・保存値の二重で 4H 上限を保証する（spec-review R7）。
 */
export function cappedElapsedSec(
  startedAt: string,
  endedAt: string,
  pausedTotalSec: number,
): number {
  return Math.min(
    elapsedSec(startedAt, endedAt, pausedTotalSec),
    MAX_ACTIVITY_SEC,
  );
}

/** sessionElapsedSec が必要とする状態の最小形（ExecState のサブセット、循環 import 回避）。 */
export interface SessionElapsedState {
  status: "running" | "paused" | "done";
  pauseStartedAt: string | null;
  records: {
    startedAt: string;
    endedAt: string | null;
    elapsedSec: number;
    pausedTotalSec: number;
  }[];
}

/**
 * セット全体（セッション）の経過秒 = 全 record の合計（R20260613-004）。
 * 終了済み record は確定 elapsedSec、進行中 record は now との差分でライブ算出する。
 * paused 中は進行中分を pauseStartedAt 時点で凍結する。各 record は cappedElapsedSec
 * （0 下限 / 1 活動 4H 上限）を適用する。
 */
export function sessionElapsedSec(
  state: SessionElapsedState,
  now: string,
): number {
  return state.records.reduce((sum, rec) => {
    if (rec.endedAt) return sum + rec.elapsedSec;
    const end = state.status === "paused" ? (state.pauseStartedAt ?? now) : now;
    return sum + cappedElapsedSec(rec.startedAt, end, rec.pausedTotalSec);
  }, 0);
}
