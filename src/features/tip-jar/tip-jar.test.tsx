// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '../../services/auth/owner.js';
import {
  makeWebhookHandler,
  type WebhookVerifier,
} from '../../../api/tip/webhook.js';
import { makeCheckoutHandler, type CheckoutCreator, TIP_AMOUNT_JPY } from '../../../api/tip/checkout.js';
import { TipJarButton } from './TipJarButton.js';

const adapter = (owner: string | null): AuthAdapter => ({ resolveOwnerId: async () => owner });

describe('makeWebhookHandler (SEC-005 署名検証)', () => {
  const verifier = (ok: boolean): WebhookVerifier => ({
    constructEvent: (_b, _s, _sec) => {
      if (!ok) throw new Error('bad signature');
      return { type: 'checkout.session.completed', data: { object: { id: 'cs_1' } } };
    },
  });

  it('N1: 有効署名で 200 + tip 記録', async () => {
    const seen = new Set<string>();
    const record = vi.fn(async (id: string) => {
      seen.add(id); // 冪等
    });
    const handler = makeWebhookHandler(verifier(true), 'whsec', record);
    const res = await handler(
      new Request('https://app.test/api/tip/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig' },
        body: 'raw',
      }),
    );
    expect(res.status).toBe(200);
    expect(record).toHaveBeenCalledWith('cs_1');
  });

  it('E1: 署名不正は 400（raw body 検証）', async () => {
    const handler = makeWebhookHandler(verifier(false), 'whsec', vi.fn());
    const res = await handler(
      new Request('https://app.test/api/tip/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'bad' },
        body: 'raw',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('E2: 重複 session は recordTip 側で冪等（Set で 1 件）', async () => {
    const seen = new Set<string>();
    const record = async (id: string) => {
      seen.add(id);
    };
    const handler = makeWebhookHandler(verifier(true), 'whsec', record);
    const mk = () =>
      new Request('https://app.test/api/tip/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'sig' },
        body: 'raw',
      });
    await handler(mk());
    await handler(mk());
    expect(seen.size).toBe(1);
  });
});

describe('makeCheckoutHandler', () => {
  const creator: CheckoutCreator = { create: async () => ({ url: 'https://checkout.stripe/cs_1' }) };

  it('N2: 認証済みで Checkout URL', async () => {
    const handler = makeCheckoutHandler(adapter('owner_1'), creator);
    const res = await handler(new Request('https://app.test/api/tip/checkout', { method: 'POST' }));
    expect(res.status).toBe(200);
    expect((await res.json()).url).toContain('checkout.stripe');
  });

  it('E3: 未認証は 401（→ Google リンク誘導）', async () => {
    const handler = makeCheckoutHandler(adapter(null), creator);
    const res = await handler(new Request('https://app.test/api/tip/checkout', { method: 'POST' }));
    expect(res.status).toBe(401);
  });
});

describe('TipJarButton (O43 価格透明性)', () => {
  it('N3: 金額を CTA に明示', () => {
    render(<TipJarButton isAuthed onCheckout={async () => {}} />);
    expect(screen.getByRole('button').textContent).toContain(`${TIP_AMOUNT_JPY}円`);
  });

  it('匿名は Google リンク誘導（checkout を呼ばない）', async () => {
    const onCheckout = vi.fn(async () => {});
    const onLinkGoogle = vi.fn();
    const user = userEvent.setup();
    render(<TipJarButton isAuthed={false} onCheckout={onCheckout} onLinkGoogle={onLinkGoogle} />);
    await user.click(screen.getByRole('button'));
    expect(onLinkGoogle).toHaveBeenCalled();
    expect(onCheckout).not.toHaveBeenCalled();
  });
});
