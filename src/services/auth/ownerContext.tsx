import { createContext, useContext } from 'react';
import type { OwnerId } from '../../types/domain.js';

export interface OwnerState {
  ownerId: OwnerId | null;
  isLoaded: boolean;
  /** Clerk セッションでなくローカルゲスト（オフライン/キー未設定）か。 */
  isLocalGuest: boolean;
}

export const OwnerContext = createContext<OwnerState>({
  ownerId: null,
  isLoaded: false,
  isLocalGuest: false,
});

/**
 * 現在の owner を返す（Clerk セッション or ローカルゲスト fallback）。
 * owner 解決は AuthProvider が Clerk 有無に応じて供給するため、本フックは Clerk に直接依存しない
 * （= Clerk キー未設定でもアプリが描画できる、offline-first）。
 */
export function useOwner(): OwnerState {
  return useContext(OwnerContext);
}
