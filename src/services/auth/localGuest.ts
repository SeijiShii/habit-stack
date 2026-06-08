const KEY = 'habit-stack:guest-owner';

/**
 * Clerk セッションが確立できない（オフライン / キー未設定）ときの
 * ローカルデバイス用ゲスト owner id（offline-critical の degrade）。
 * 端末ローカルに永続し、Google リンク時に mergeGuestData でサーバ owner へ統合する。
 */
export function getOrCreateLocalGuestId(
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): string {
  let id = storage.getItem(KEY);
  if (!id) {
    id = `local-guest-${crypto.randomUUID()}`;
    storage.setItem(KEY, id);
  }
  return id;
}
