/** 総覧集計の入力に必要な最小フィールド（LocalRecord 互換のためオプショナル）。 */
export interface SessionLike {
  id: string;
  clientLocalId?: unknown;
  setId?: unknown;
}
export interface RecordLike {
  id?: string;
  sessionId?: unknown;
  itemId?: unknown;
  elapsedSec?: unknown;
}

export interface SetTotal {
  setId: string;
  totalSec: number;
  items: { itemId: string; totalSec: number }[];
}

/**
 * 実行記録を setId / itemId 別に合算する（純関数、UC6-OV）。
 * record は session 経由で setId に紐づく。session に紐づかない record は無視。
 */
export function aggregateSetTotals(
  sessions: SessionLike[],
  records: RecordLike[],
): SetTotal[] {
  const setBySession = new Map<string, string>();
  for (const s of sessions) {
    setBySession.set(String(s.clientLocalId ?? s.id), String(s.setId));
  }

  const bySet = new Map<string, Map<string, number>>();
  for (const r of records) {
    const setId = setBySession.get(String(r.sessionId));
    if (!setId) continue;
    const sec = Number(r.elapsedSec ?? 0);
    const items = bySet.get(setId) ?? new Map<string, number>();
    const itemId = String(r.itemId);
    items.set(itemId, (items.get(itemId) ?? 0) + sec);
    bySet.set(setId, items);
  }

  return [...bySet.entries()].map(([setId, items]) => ({
    setId,
    totalSec: [...items.values()].reduce((a, b) => a + b, 0),
    items: [...items.entries()].map(([itemId, totalSec]) => ({
      itemId,
      totalSec,
    })),
  }));
}
