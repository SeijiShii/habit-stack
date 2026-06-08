/**
 * フィードバック中継エンドポイント（O40 二重シンク）。
 * (a) 中央 feedback-hub へ ingestion、(b) 運用者へ即時通知。
 * env 未設定（hub 未構築 [論点-010]）では degrade（202 受理のみ）。
 * 公開エンドポイントのためレート制限対象（SEC-005、app-shell で配線）。
 */
export async function handleFeedback(req: Request): Promise<Response> {
  const hubEndpoint = process.env.HUB_FEEDBACK_ENDPOINT ?? '';
  const hubSecret = process.env.HUB_SERVICE_INFO_SECRET ?? '';
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400 });
  }

  if (!hubEndpoint) {
    // hub 未構築: 受理のみ（運用者通知は別途、degrade）
    return new Response(JSON.stringify({ status: 'accepted_local' }), { status: 202 });
  }

  try {
    await fetch(hubEndpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(hubSecret ? { authorization: `Bearer ${hubSecret}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    // 送信失敗でも受理（クライアントは控えめ完了）
  }
  return new Response(JSON.stringify({ status: 'accepted' }), { status: 202 });
}

export default handleFeedback;
