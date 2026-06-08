import { withOwner, type AuthAdapter } from "../../src/services/auth/owner.js";

/** Checkout セッション作成器（injectable、O35）。 */
export interface CheckoutCreator {
  create(ownerId: string): Promise<{ url: string }>;
}

export const TIP_AMOUNT_JPY = 100;

/**
 * 投げ銭 Checkout 作成（withOwner、認証必須）。固定 100 円（O43 金額は UI で CTA 前に明示）。
 * 匿名は 401 → フロントが Google リンクへ誘導。
 */
export function makeCheckoutHandler(
  adapter: AuthAdapter,
  creator: CheckoutCreator,
) {
  return withOwner(adapter, async (_req, owner) => {
    const { url } = await creator.create(owner);
    return Response.json({ url });
  });
}

// Vercel Function エントリ（遅延配線、実 Stripe Checkout）
import Stripe from "stripe";
import { serverContext } from "../../src/server/context.js";
export default async function (req: Request): Promise<Response> {
  const ctx = serverContext();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  const creator: CheckoutCreator = {
    create: async (ownerId) => {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: { name: "作者を応援" },
              unit_amount: TIP_AMOUNT_JPY,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.APP_URL ?? ""}/?tip=thanks`,
        cancel_url: `${process.env.APP_URL ?? ""}/`,
        client_reference_id: ownerId,
      });
      return { url: session.url ?? "" };
    },
  };
  return makeCheckoutHandler(ctx.adapter, creator)(req);
}
