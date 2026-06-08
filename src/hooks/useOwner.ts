import { useAuth } from '@clerk/clerk-react';
import { asOwnerId, type OwnerId } from '../types/domain.js';
import { getOrCreateLocalGuestId } from '../services/auth/localGuest.js';

/**
 * 現在の owner を返す。
 * - Clerk セッションあり（匿名ゲスト or 認証済み）→ その userId。
 * - Clerk 未確立（オフライン / キー未設定）→ **ローカルゲスト owner にフォールバック**（offline-first degrade）。
 * オンライン + 認証時に mergeGuestData でローカル → サーバ owner へ統合する。
 */
export function useOwner(): { ownerId: OwnerId | null; isLoaded: boolean; isLocalGuest: boolean } {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) {
    return { isLoaded: false, ownerId: null, isLocalGuest: false };
  }
  if (userId) {
    return { isLoaded: true, ownerId: asOwnerId(userId), isLocalGuest: false };
  }
  // degrade: ローカルゲスト（0 タップ実行を止めない）
  return { isLoaded: true, ownerId: asOwnerId(getOrCreateLocalGuestId()), isLocalGuest: true };
}
