import { createContext, useContext } from "react";
import type { OwnerId } from "../../types/domain.js";

export interface OwnerState {
  ownerId: OwnerId | null;
  isLoaded: boolean;
  /** Clerk セッションでなくローカルゲスト（オフライン/キー未設定）か。 */
  isLocalGuest: boolean;
  /** Google 等の外部アカウントに連携済み（= 引き継ぎ可能な authed owner）か。 */
  isLinked: boolean;
  /** 連携後の表示用メールアドレス（未連携なら undefined）。 */
  email?: string;
  /**
   * Google アカウント連携を開始する（段階的認証、auth SPEC §3）。
   * Clerk モードでのみ供給。keyless（ローカルゲスト）では undefined。
   */
  linkGoogle?: () => Promise<void>;
  /** サインアウト（Clerk モードでのみ供給）。 */
  signOut?: () => Promise<void>;
}

export const OwnerContext = createContext<OwnerState>({
  ownerId: null,
  isLoaded: false,
  isLocalGuest: false,
  isLinked: false,
});

/**
 * 現在の owner を返す（Clerk セッション or ローカルゲスト fallback）。
 * owner 解決は AuthProvider が Clerk 有無に応じて供給するため、本フックは Clerk に直接依存しない
 * （= Clerk キー未設定でもアプリが描画できる、offline-first）。
 */
export function useOwner(): OwnerState {
  return useContext(OwnerContext);
}
