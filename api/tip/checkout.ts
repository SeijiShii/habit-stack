import { withOwner, type AuthAdapter } from '../../src/services/auth/owner.js';

/** Checkout セッション作成器（injectable、O35）。 */
export interface CheckoutCreator {
  create(ownerId: string): Promise<{ url: string }>;
}

export const TIP_AMOUNT_JPY = 100;

/**
 * 投げ銭 Checkout 作成（withOwner、認証必須）。固定 100 円（O43 金額は UI で CTA 前に明示）。
 * 匿名は 401 → フロントが Google リンクへ誘導。
 */
export function makeCheckoutHandler(adapter: AuthAdapter, creator: CheckoutCreator) {
  return withOwner(adapter, async (_req, owner) => {
    const { url } = await creator.create(owner);
    return Response.json({ url });
  });
}
