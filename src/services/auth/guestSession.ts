import { randomBytes, randomUUID } from "node:crypto";
import { createClerkClient, type ClerkClient } from "@clerk/backend";

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
    throw new Error("CLERK_SECRET_KEY が必要です");
  }
  const clerk =
    opts.client ??
    createClerkClient({
      secretKey: opts.secretKey,
      publishableKey: opts.publishableKey,
    });

  // Clerk は createUser に識別子（email 等）を要求する。識別子なしだと本番で
  // 422 form_data_missing → guest 503（CF-20260529-016、unit/E2E は mock で見逃す）。
  // 合成 email（同ドメインのサブ・到達不要）+ 強ランダム password + skipPasswordChecks を付与。
  const user = await clerk.users.createUser({
    emailAddress: [`guest_${randomUUID()}@guests.habit-stack.givers.work`],
    password: randomBytes(24).toString("base64url"),
    skipPasswordChecks: true,
    publicMetadata: { guest: true },
  });

  const token = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: opts.ticketTtlSec ?? 600,
  });

  return { ticket: token.token, userId: user.id };
}
