import { createClerkClient, type ClerkClient } from '@clerk/backend';

export interface GuestSessionOptions {
  secretKey: string;
  publishableKey: string;
  client?: ClerkClient;
  /** サインインチケットの有効期限（秒）。 */
  ticketTtlSec?: number;
}

/**
 * ゲスト（匿名）ユーザーを作成し、フロントが redeem するサインインチケットを返す（O22 / P4.46）。
 * フロント側は `signIn.create({ strategy: 'ticket', ticket })` でセッションを確立する。
 * 0 タップで実行を始められる（パスワード不要）。後で Google リンクで段階的にアップグレード。
 */
export async function issueGuestTicket(
  opts: GuestSessionOptions,
): Promise<{ ticket: string; userId: string }> {
  if (!opts.secretKey) {
    throw new Error('CLERK_SECRET_KEY が必要です');
  }
  const clerk =
    opts.client ??
    createClerkClient({
      secretKey: opts.secretKey,
      publishableKey: opts.publishableKey,
    });

  const user = await clerk.users.createUser({
    skipPasswordRequirement: true,
    publicMetadata: { guest: true },
  });

  const token = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: opts.ticketTtlSec ?? 600,
  });

  return { ticket: token.token, userId: user.id };
}
