import { useAuth } from '@clerk/clerk-react';
import { asOwnerId, type OwnerId } from '../types/domain.js';

/**
 * 現在の owner（匿名ゲスト or 認証済み）を返す。未確立なら null。
 */
export function useOwner(): { ownerId: OwnerId | null; isLoaded: boolean } {
  const { isLoaded, userId } = useAuth();
  return {
    isLoaded,
    ownerId: userId ? asOwnerId(userId) : null,
  };
}
