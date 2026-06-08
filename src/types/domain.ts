/**
 * ドメイン enum・値オブジェクト。drizzle に依存せずアプリ全体から参照できる純粋型。
 */

export const TIME_OF_DAY = ['morning', 'noon', 'evening', 'night'] as const;
export type TimeOfDay = (typeof TIME_OF_DAY)[number];

export const SESSION_STATUS = ['running', 'paused', 'done'] as const;
export type SessionStatus = (typeof SESSION_STATUS)[number];

/**
 * Clerk user id（匿名ゲスト含む）。素の string と取り違えないよう branded type にする。
 * 生 string → OwnerId のキャストは owner resolver（_shared/auth）の `asOwnerId` のみに限定する。
 */
export type OwnerId = string & { readonly __brand: 'OwnerId' };

/** 素の string を OwnerId として確定する（owner resolver 専用）。 */
export function asOwnerId(value: string): OwnerId {
  return value as OwnerId;
}

/** ISO 8601 タイムスタンプ文字列。 */
export type Iso8601 = string;

/**
 * 継続率（達成日数 / 対象日数）。
 * 継続の定義: セット単位・穴あき許容（1 アイテム以上実行で達成）。
 */
export interface ContinuationRate {
  achievedDays: number;
  totalDays: number;
  /** achievedDays / totalDays（0..1）。totalDays=0 のとき 0。 */
  rate: number;
}
