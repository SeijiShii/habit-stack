import { randomUUID } from "node:crypto";

/**
 * 匿名ゲスト発行（C20260617-001、guest 自前署名 JWT 化）。
 *
 * 旧 `issueGuestTicket` は毎回 Clerk `createUser` で新 userId を発行し、Clerk セッションに
 * 紐づけていた（= セッション失効で owner churn）。本実装は **Clerk user を作らず**、
 * `guest_<uuid>` を sub とする自前署名 guest JWT を発行する。owner は sub に由来し
 * クライアントに永続されるため、Clerk セッション寿命と分離され churn しない（MAU も消費しない）。
 * 範型: bousai-bag-checker `api/auth/_lib/guest-provision.ts`（revise_003）。
 *
 * sign / genSub は注入 = SDK・env 非依存で単体テスト可能（O35）。
 */

export interface ProvisionGuestDeps {
  /** guest JWT を署名（handler が signGuestToken に GUEST_TOKEN_SECRET を bind して注入）。 */
  signToken: (sub: string) => string;
  /** 匿名 user の subject 生成（`guest_<uuid>` を想定、テスト上書き用）。 */
  genSub?: () => string;
}

/** 既定の sub 生成（`guest_<uuid>`）。 */
export function defaultGenSub(): string {
  return `guest_${randomUUID()}`;
}

/**
 * 匿名 session 用の guest JWT を発行する。
 * @returns `{ guestToken, sub }` フロントが localStorage 保持 + Authorization に付与する。
 */
export function provisionGuest(deps: ProvisionGuestDeps): {
  guestToken: string;
  sub: string;
} {
  const sub = (deps.genSub ?? defaultGenSub)();
  const guestToken = deps.signToken(sub);
  return { guestToken, sub };
}
