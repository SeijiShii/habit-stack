/**
 * 端末ローカルタイムゾーンの YYYY-MM-DD。
 * 達成日・「今日」の判定はユーザーの体感日付に合わせる（UTC slice だと
 * JST 0:00-8:59 の実行が前日扱いになり連続日数がズレる、R20260613-001）。
 */
export function localDateOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 累計秒を「H時間M分」表示にする（1 時間未満は「M分」、0 は「0分」）。 */
export function formatDuration(totalSec: number): string {
  const min = Math.floor(totalSec / 60);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}
