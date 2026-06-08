import { issueGuestTicket } from '../../src/services/auth/guestSession.js';

/**
 * ゲストサインインチケット発行エンドポイント（Vercel Function）。
 * フロントは初回起動時にこれを呼び、返ったチケットでセッションを確立する（0 タップ実行、O22）。
 * 公開エンドポイントのためレート制限対象（SEC-005、app-shell で配線）。
 */
export async function handleGuestTicket(_req: Request): Promise<Response> {
  const secretKey = process.env.CLERK_SECRET_KEY ?? '';
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY ?? '';
  try {
    const { ticket } = await issueGuestTicket({ secretKey, publishableKey });
    return new Response(JSON.stringify({ ticket }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    // ゲスト発行失敗時はフロントがローカル（IndexedDB）で degrade（offline-critical）。
    return new Response(JSON.stringify({ error: 'guest_unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export default handleGuestTicket;
