import { createClerkClient, type ClerkClient } from '@clerk/backend';
import type { AuthAdapter } from './owner.js';

export interface ClerkAuthOptions {
  secretKey: string;
  publishableKey: string;
  /** テスト用に ClerkClient を注入（省略時は実 Clerk を生成）。 */
  client?: ClerkClient;
}

/**
 * 実 Clerk セッションから owner を解決するアダプタ（本番セッション経路、P4.46）。
 * サーバ側で Clerk のセッションを検証し userId（匿名ゲスト / 認証済み）を返す。
 * クライアント送信値は一切見ない（SEC-001）。
 */
export function createClerkAuthAdapter(opts: ClerkAuthOptions): AuthAdapter {
  if (!opts.secretKey) {
    throw new Error('CLERK_SECRET_KEY が必要です');
  }
  const clerk =
    opts.client ??
    createClerkClient({
      secretKey: opts.secretKey,
      publishableKey: opts.publishableKey,
    });

  return {
    async resolveOwnerId(req) {
      const requestState = await clerk.authenticateRequest(req);
      const auth = requestState.toAuth();
      // 匿名ゲストも認証済みも userId を持つ。未認証は null。
      return auth?.userId ?? null;
    },
  };
}
