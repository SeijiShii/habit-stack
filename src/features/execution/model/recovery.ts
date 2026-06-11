import { MAX_ACTIVITY_SEC } from './elapsed.js';
import type { ExecState } from './executionMachine.js';

/** 復帰時の放置自動終了しきい値（秒）= 4H。最終保存時刻からこの時間経過で自動終了。 */
export const IDLE_LIMIT_SEC = MAX_ACTIVITY_SEC;

export type RecoveryDecision =
  | { kind: 'resume' }
  | { kind: 'autoEnd'; endedAt: string };

/** lastSavedAt 欠落時のフォールバック基準（現アイテムの開始時刻）。 */
function fallbackRef(state: ExecState): string {
  const rec = state.records[state.records.length - 1];
  return rec?.startedAt ?? state.startedAt;
}

/**
 * 復帰時の判定（UC-EX-RESUME / UC-EX-IDLE、R20260611-001 R2）。純関数（副作用なし、StrictMode 安全）。
 * - 計時中（running/paused）かつ gap = now - lastSavedAt >= 4H → autoEnd（endedAt=lastSavedAt）。
 * - それ以外 → resume（経過は startedAt 起点で再算出、4H クランプは elapsed 層が担保）。
 * - 端末時計巻き戻し（gap<0）は resume。
 */
export function decideRecovery(input: {
  state: ExecState;
  lastSavedAt: string | null;
  now: string;
}): RecoveryDecision {
  const { state, lastSavedAt, now } = input;
  if (state.status === 'done') return { kind: 'resume' };
  const ref = lastSavedAt ?? fallbackRef(state);
  const gap = Math.floor(
    (new Date(now).getTime() - new Date(ref).getTime()) / 1000,
  );
  if (gap >= IDLE_LIMIT_SEC) return { kind: 'autoEnd', endedAt: ref };
  return { kind: 'resume' };
}

/**
 * 遷移先がログイン/アカウント画面かどうか（UC-EX-LOGIN-END、R8）。
 * 計時中にこの画面へ遷移したらセッションを終了する。サマリ/ふりかえり等は対象外。
 */
export function isLoginPath(path: string): boolean {
  return path === '/account' || path.startsWith('/account/');
}
