import type { LocalStore } from "../sync/localStore.js";
import type { OwnerId } from "../../types/domain.js";

export interface PurgeDeps {
  store: LocalStore;
  ownerId: OwnerId;
  /** テスト用に注入可能（既定は global fetch）。 */
  fetchImpl?: typeof fetch;
}

export interface PurgeResult {
  /** ローカル削除は常に完了する（offline-critical）。 */
  local: true;
  /** サーバ削除に成功したか（オフライン/未認証ゲストでは false）。 */
  remote: boolean;
}

/**
 * 全データのセルフサービス削除（O54 消去権）。
 * サーバ削除（DELETE /api/account、owner はサーバ強制）を試み、成否に関わらずローカル IndexedDB を wipe する。
 * オフライン/keyless ゲストはサーバにデータが無く 401/失敗となるが、ローカル削除は確実に行う（端末から消える）。
 */
export async function purgeAllData({
  store,
  ownerId,
  fetchImpl,
}: PurgeDeps): Promise<PurgeResult> {
  let remote = false;
  try {
    const res = await (fetchImpl ?? fetch)("/api/account", {
      method: "DELETE",
    });
    remote = res.ok;
  } catch {
    remote = false;
  }
  await store.wipeOwner(ownerId);
  return { local: true, remote };
}
