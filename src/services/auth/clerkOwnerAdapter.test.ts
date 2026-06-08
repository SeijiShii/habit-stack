import { describe, it, expect } from 'vitest';
import type { ClerkClient } from '@clerk/backend';
import { createClerkAuthAdapter } from './clerkOwnerAdapter.js';
import { withOwner } from './owner.js';

const mockClient = (userId: string | null): ClerkClient =>
  ({
    authenticateRequest: async () => ({
      toAuth: () => (userId ? { userId } : null),
    }),
  }) as unknown as ClerkClient;

const opts = (client: ClerkClient) => ({
  secretKey: 'sk_test_x',
  publishableKey: 'pk_test_x',
  client,
});

describe('createClerkAuthAdapter', () => {
  it('空 secretKey で明示エラー', () => {
    expect(() =>
      createClerkAuthAdapter({ secretKey: '', publishableKey: 'pk', client: mockClient('u') }),
    ).toThrow('CLERK_SECRET_KEY が必要です');
  });

  it('Clerk セッションから userId（匿名ゲスト）を解決', async () => {
    const adapter = createClerkAuthAdapter(opts(mockClient('guest_1')));
    const owner = await adapter.resolveOwnerId(new Request('https://app.test'));
    expect(owner).toBe('guest_1');
  });

  it('未認証は null', async () => {
    const adapter = createClerkAuthAdapter(opts(mockClient(null)));
    expect(await adapter.resolveOwnerId(new Request('https://app.test'))).toBeNull();
  });

  it('P4.46: 匿名セッション → 実 adapter → withOwner で保護 API 200（401 でない）', async () => {
    const adapter = createClerkAuthAdapter(opts(mockClient('guest_anon_9')));
    const handler = withOwner(adapter, async (_r, owner) => {
      expect(owner).toBe('guest_anon_9');
      return new Response('ok', { status: 200 });
    });
    const res = await handler(new Request('https://app.test/api/sets'));
    expect(res.status).toBe(200);
  });

  it('P4.46: 未認証 → 実 adapter → withOwner で 401', async () => {
    const adapter = createClerkAuthAdapter(opts(mockClient(null)));
    const handler = withOwner(adapter, async () => new Response('ok', { status: 200 }));
    const res = await handler(new Request('https://app.test/api/sets'));
    expect(res.status).toBe(401);
  });
});
