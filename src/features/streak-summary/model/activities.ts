/** 活動テーブル（「1回の活動」=実行セッション単位）の構築に必要な最小フィールド。 */
export interface SessionLike {
  id: string;
  clientLocalId?: unknown;
  setId?: unknown;
  startedAt?: unknown;
}
export interface RecordLike {
  id?: string;
  sessionId?: unknown;
  itemId?: unknown;
  elapsedSec?: unknown;
  note?: unknown;
}
export interface ItemLike {
  id: string;
  name: unknown;
}

/** セッション内の 1 アイテムの記録（開いたときに見える行）。 */
export interface ActivityRecord {
  itemId: string;
  itemName: string;
  elapsedSec: number;
  note: string;
}

/** 「1回の活動」= 1 セッション（閉じた状態の 1 行）。 */
export interface Activity {
  sessionId: string;
  /** セッション開始時刻（ISO 文字列、表示時にローカル日付へ整形）。 */
  startedAt: string;
  /** セッション内の全アイテム合計秒。 */
  totalSec: number;
  records: ActivityRecord[];
}

/**
 * 指定セットの実行セッションを「1回の活動」単位に組み立てる（純関数）。
 * - record は sessionId で session に紐づく（紐づかない record は無視）。
 * - 有効経過のあるセッション（合計 > 0 秒）のみ並べる（0 秒放置は活動に数えない、
 *   達成判定 strict と同じ方針）。
 * - 開始時刻の新しい順（直近が上）。
 *
 * sessions / items は呼び出し側で対象セット・owner に絞り込んでおくこと。
 */
export function buildActivities(
  sessions: SessionLike[],
  records: RecordLike[],
  items: ItemLike[],
): Activity[] {
  const itemName = new Map(items.map((i) => [i.id, String(i.name)]));

  const recsBySession = new Map<string, ActivityRecord[]>();
  for (const r of records) {
    const sid = String(r.sessionId);
    const list = recsBySession.get(sid) ?? [];
    list.push({
      itemId: String(r.itemId),
      itemName: itemName.get(String(r.itemId)) ?? "",
      elapsedSec: Number(r.elapsedSec ?? 0),
      note: String(r.note ?? ""),
    });
    recsBySession.set(sid, list);
  }

  return sessions
    .map((s) => {
      const sid = String(s.clientLocalId ?? s.id);
      const recs = recsBySession.get(sid) ?? [];
      return {
        sessionId: sid,
        startedAt: String(s.startedAt ?? ""),
        totalSec: recs.reduce((a, r) => a + r.elapsedSec, 0),
        records: recs,
      };
    })
    .filter((a) => a.totalSec > 0)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
