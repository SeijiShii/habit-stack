import { createClerkClient } from "@clerk/backend";
import {
  issueGuestTicket,
  refreshGuestTicket,
} from "../../src/services/auth/guestSession.js";

/**
 * ゲストサインインチケット発行エンドポイント（Vercel Function）。
 * フロントは初回起動時にこれを呼び、返ったチケットでセッションを確立する（0 タップ実行、O22）。
 * 公開エンドポイントのためレート制限対象（SEC-005、app-shell で配線）。
 *
 * 既存セッション（確立済みゲスト）から呼ばれた場合は **同一 userId に対して** 新チケットを発行する
 * （CF-20260614-002）。フロントが redeem すると first-factor を再検証し、Clerk reverification
 * （aged session の step-up 403）を回避できる。これを Google 連携直前に使い「aged guest session で
 * createExternalAccount が 403 無反応」を解消する。createUser しないので userId は変わらない。
 */
export async function handleGuestTicket(req: Request): Promise<Response> {
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY ?? "";
  try {
    const clerk = createClerkClient({ secretKey, publishableKey });
    // 既存セッションがあれば同一 userId を refresh、無ければ新規ゲスト作成。
    // クライアント送信値は見ず Clerk セッションから userId を解決（SEC-001）。
    let userId: string | null = null;
    try {
      const auth = (await clerk.authenticateRequest(req)).toAuth();
      userId = auth?.userId ?? null;
    } catch {
      userId = null;
    }
    const opts = { secretKey, publishableKey, client: clerk };
    const { ticket } = userId
      ? await refreshGuestTicket(opts, userId)
      : await issueGuestTicket(opts);
    return new Response(JSON.stringify({ ticket }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    // ゲスト発行失敗時はフロントがローカル（IndexedDB）で degrade（offline-critical）。
    return new Response(JSON.stringify({ error: "guest_unavailable" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
}

export default handleGuestTicket;
