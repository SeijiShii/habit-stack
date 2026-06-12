import type { LocalStore, LocalRecord } from '../localStore.js';
import { localDateOf } from '../../time/localDate.js';

const VERSION = 'migration:achievements-local-date:v1';

export interface RebuildResult {
  rebuilt: number;
  removed: number;
}

/**
 * daily_achievement をユーザーローカル日付で再構築する（R20260613-001）。
 * 旧コードは達成日を UTC slice で記録しており、JST 0:00-8:59 の実行が前日に
 * 潰れていた。正本 = execution_record（ISO タイムスタンプ保持）から
 * {setId, ローカル日付} を再導出して upsert し、再導出集合に無い既存達成を
 * tombstone する。owner ごとに 1 回（META フラグ）、冪等。
 *
 * - achieved 判定は strict 近似（有効経過 > 0 のアイテムが 1 つ以上）。
 * - execution_record が 0 件の owner は達成を消さず no-op（達成だけ pull 済の
 *   owner を壊さない）。フラグは立てる。
 * - session に紐づかない record は無視する。
 */
export async function rebuildAchievements(
  store: LocalStore,
  ownerId: string,
  now: () => string = () => new Date().toISOString(),
): Promise<RebuildResult | null> {
  const flagKey = `${VERSION}:${ownerId}`;
  if (await store.getMeta(flagKey)) return null;

  const records = await store.getAllByOwner('execution_record', ownerId);
  if (records.length === 0) {
    await store.setMeta(flagKey, now());
    return { rebuilt: 0, removed: 0 };
  }

  const sessions = await store.getAllByOwner('execution_session', ownerId);
  const setBySession = new Map<string, string>();
  for (const s of sessions) {
    setBySession.set(String(s.clientLocalId ?? s.id), String(s.setId));
  }

  // {setId, ローカル日付} ごとの有効実行アイテム数を再導出
  const want = new Map<string, { setId: string; date: string; count: number }>();
  for (const r of records) {
    if (Number(r.elapsedSec ?? 0) <= 0) continue;
    const setId = setBySession.get(String(r.sessionId));
    if (!setId || typeof r.startedAt !== 'string') continue;
    const date = localDateOf(new Date(r.startedAt));
    const key = `${setId}:${date}`;
    const cur = want.get(key);
    if (cur) cur.count += 1;
    else want.set(key, { setId, date, count: 1 });
  }

  const t = now();
  let rebuilt = 0;
  for (const { setId, date, count } of want.values()) {
    const id = `${ownerId}:${setId}:${date}`;
    await store.put('daily_achievement', {
      id,
      ownerId,
      clientLocalId: id,
      setId,
      date,
      achieved: true,
      itemDoneCount: count,
      updatedAt: t,
      deletedAt: null,
    } satisfies LocalRecord);
    rebuilt += 1;
  }

  // 再導出集合に無い既存達成を tombstone（outbox 経由でサーバへも削除伝播）
  const existing = await store.getAllByOwner('daily_achievement', ownerId);
  let removed = 0;
  for (const a of existing) {
    const key = `${String(a.setId)}:${String(a.date)}`;
    if (!want.has(key)) {
      await store.softDelete('daily_achievement', a.id, t);
      removed += 1;
    }
  }

  await store.setMeta(flagKey, t);
  return { rebuilt, removed };
}
