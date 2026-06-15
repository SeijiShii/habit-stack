import { useEffect, useMemo, useState } from "react";
import { LocalStore } from "../services/sync/localStore.js";
import { SetsRepo } from "../features/activity-sets/model/setsRepo.js";
import { ExecutionRepo } from "../features/execution/model/executionRepo.js";
import { SummaryRepo } from "../features/streak-summary/model/summaryRepo.js";
import { rebuildAchievements } from "../services/sync/migrations/rebuildAchievements.js";
import { consumeDeviceOverwrite } from "../services/auth/deviceOverwrite.js";
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

  // 既存アカウントへのサインイン復帰時のみ、current owner 以外のローカルデータを current owner へ
  // 付け替えて保全する（= デバイスのゲストデータをアカウントへ引き継ぐ、concept §1.1 UC8）。
  // marker は明示的な既存サインインでのみ立ち、単なるゲスト churn では立たない（spec-review R3）。
  // 旧実装は wipeOtherOwners で物理削除しており、owner churn で取り残されたゲストデータを outbox ごと
  // 恒久喪失させていた（C20260616-001 データ消失バグ）。破棄せず付け替えに変更。
  useEffect(() => {
    if (!store || !ownerId) return;
    if (consumeDeviceOverwrite()) {
      void store.reassignOtherOwnersTo(ownerId).catch(() => {
        // 失敗しても owner 絞り（getAllByOwner）で混在表示は起きない。データは保持され次回機会に付け替え。
      });
    }
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
