import { provisionGuest } from "../../src/services/auth/guestProvision.js";
import { signGuestToken } from "../../src/services/auth/guestToken.js";

/**
 * ゲスト発行エンドポイント（Vercel Function、C20260617-001 で guest 自前署名 JWT 化）。
 * フロントは初回起動時にこれを呼び、返った guest JWT を localStorage に永続して再利用する
 * （Clerk セッションに紐づけない = トークン失効/リロードで owner churn しない）。
 *
 * 旧実装は Clerk 匿名 user を作成し sign-in ticket を返していた（= セッション失効で新 userId churn →
 * owner-scoped ローカルデータ orphan 化、C20260617-001 データ消失バグ）。createUser を撤去し、
 * `guest_<uuid>` を sub とする自前署名 guest JWT（HS256, GUEST_TOKEN_SECRET）を返す。
 * client は不透明 token を保持するだけ = `sub` 偽造不可で SEC-001 と矛盾しない。
 */
export async function handleGuestProvision(req: Request): Promise<Response> {
  const headers = { "content-type": "application/json" };
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers,
    });
  }
  const secret = process.env.GUEST_TOKEN_SECRET ?? "";
  if (!secret) {
    // secret 未設定はフロントが localStorage ローカルゲストで degrade（offline-critical）。
    return new Response(JSON.stringify({ error: "guest_unavailable" }), {
      status: 503,
      headers,
    });
  }
  try {
    const { guestToken } = provisionGuest({
      signToken: (sub) => signGuestToken(secret, sub),
    });
    return new Response(JSON.stringify({ guestToken }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: "guest_unavailable" }), {
      status: 503,
      headers,
    });
  }
}

export default handleGuestProvision;
