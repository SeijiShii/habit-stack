import Stripe from 'stripe';

/** 署名検証器（injectable、O35）。本番は Stripe SDK、テストは mock。 */
export interface WebhookVerifier {
  constructEvent(rawBody: string, signature: string, secret: string): { type: string; data: { object: { id: string } } };
}

/** 投げ銭記録（冪等、stripe_session_id で重複防止）。 */
export type RecordTip = (sessionId: string) => Promise<void>;

export function makeStripeVerifier(secretKey: string): WebhookVerifier {
  const stripe = new Stripe(secretKey);
  return {
    constructEvent: (rawBody, signature, secret) =>
      stripe.webhooks.constructEvent(rawBody, signature, secret) as unknown as {
        type: string;
        data: { object: { id: string } };
      },
  };
}

/**
 * Stripe webhook ハンドラ。**raw body + 署名検証必須**（SEC-005）。
 * checkout.session.completed で投げ銭を記録（冪等）。
 */
export function makeWebhookHandler(
  verifier: WebhookVerifier,
  secret: string,
  recordTip: RecordTip,
) {
  return async (req: Request): Promise<Response> => {
    const signature = req.headers.get('stripe-signature') ?? '';
    const rawBody = await req.text(); // raw body（パース前、SEC-005）
    let event: { type: string; data: { object: { id: string } } };
    try {
      event = verifier.constructEvent(rawBody, signature, secret);
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_signature' }), { status: 400 });
    }
    if (event.type === 'checkout.session.completed') {
      await recordTip(event.data.object.id);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  };
}
