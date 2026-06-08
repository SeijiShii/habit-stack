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
  return Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 1000));
}
