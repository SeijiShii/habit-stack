import type { AuthAdapter } from "./owner.js";
import { GUEST_TOKEN_ISS, verifyGuestToken } from "./guestToken.js";

/**
 * 複合 owner resolver（C20260617-001）。Authorization: Bearer の token を iss で振り分ける:
 *  - iss=habit-stack-guest の自前署名 guest JWT → `verifyGuestToken` で sub を owner に
 *  - それ以外（Clerk JWT / Bearer なし=cookie 経路）→ 既存 Clerk アダプタへフォールバック
 *
 * これにより「guest=Clerk セッション」を断ちつつ Clerk 連携ユーザーの解決は不変に保つ（additive）。
 * **クライアント送信値は署名検証してからのみ owner に使う**（SEC-001 維持）。
 */
export function createGuestOrClerkAuthAdapter(opts: {
  guestSecret: string;
  clerk: AuthAdapter;
}): AuthAdapter {
  return {
    async resolveOwnerId(req) {
      const bearer = extractBearer(req);
      if (bearer && peekIss(bearer) === GUEST_TOKEN_ISS) {
        // 自前 guest JWT を主張している → 署名検証して sub を owner に。失敗は null（Clerk に回さない）。
        try {
          return verifyGuestToken(opts.guestSecret, bearer).sub;
        } catch {
          return null;
        }
      }
      // guest JWT でない（Clerk JWT / cookie 経路）→ 既存 Clerk 解決。
      return opts.clerk.resolveOwnerId(req);
    },
  };
}

/** Authorization: Bearer <token> を取り出す（無ければ null）。 */
function extractBearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1] : null;
}

/** JWT の payload を**検証せず** peek して iss を読む（振り分け判定専用、信用はしない）。 */
function peekIss(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { iss?: unknown };
    return typeof payload.iss === "string" ? payload.iss : null;
  } catch {
    return null;
  }
}
