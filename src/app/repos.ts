import { useEffect, useMemo, useState } from "react";
import { LocalStore } from "../services/sync/localStore.js";
import { SetsRepo } from "../features/activity-sets/model/setsRepo.js";
import { ExecutionRepo } from "../features/execution/model/executionRepo.js";
import { SummaryRepo } from "../features/streak-summary/model/summaryRepo.js";
import { rebuildAchievements } from "../services/sync/migrations/rebuildAchievements.js";
import { useOwner } from "../hooks/useOwner.js";

export interface Repos {
  sets: SetsRepo;
  execution: ExecutionRepo;
  summary: SummaryRepo;
  /** 現在の owner id（account-scoped なローカル永続キーに使う）。 */
  ownerId: string;
  /** LocalStore 本体（O54 セルフサービス削除の wipeOwner 等に使う）。 */
  store: LocalStore;
}

/** LocalStore を開き、owner 確立後に各 repo を提供する（匿名でも owner あり）。 */
export function useRepos(): Repos | null {
  const { ownerId } = useOwner();
  const [store, setStore] = useState<LocalStore | null>(null);

  useEffect(() => {
    let alive = true;
    void LocalStore.open().then((s) => {
      if (alive) setStore(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 達成日のローカル日付再構築（R20260613-001、owner ごと 1 回・冪等）。
  // 集計より先に走らなくても次回表示で正しくなるため非同期 fire-and-forget。
  useEffect(() => {
    if (!store || !ownerId) return;
    void rebuildAchievements(store, ownerId).catch(() => {
      // 失敗時はフラグ未設定のまま → 次回ロードで再実行（005_REVISE_MIGRATION §5）
    });
  }, [store, ownerId]);

  return useMemo(() => {
    if (!store || !ownerId) return null;
    return {
      sets: new SetsRepo(store, ownerId),
      execution: new ExecutionRepo(store, ownerId),
      summary: new SummaryRepo(store, ownerId),
      ownerId,
      store,
    };
  }, [store, ownerId]);
}
