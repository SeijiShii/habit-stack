import { describe, it, expect } from 'vitest';
import { withOwner, requireOwner, AuthError, type AuthAdapter } from './owner.js';
import { asOwnerId } from '../../types/domain.js';

const adapterReturning = (ownerId: string | null): AuthAdapter => ({
  resolveOwnerId: async () => ownerId,
});

const req = () => new Request('https://app.test/api/sets', { method: 'GET' });

describe('withOwner', () => {
  it('N3/N5: 認証済み（匿名含む）で handler に owner 注入し 200', async () => {
    const handler = withOwner(adapterReturning('guest_abc'), async (_r, owner) => {
      expect(owner).toBe('guest_abc');
      return new Response('ok', { status: 200 });
    });
    const res = await handler(req());
    expect(res.status).toBe(200); // 匿名→authed 経路で 401 でない（P4.46）
  });

  it('E1: 未認証は 401', async () => {
    const handler = withOwner(adapterReturning(null), async () =>
      new Response('ok', { status: 200 }),
    );
    const res = await handler(req());
    expect(res.status).toBe(401);
  });

  it('E3: クライアントが body で owner を詐称してもサーバ adapter 値を使う', async () => {
    // adapter は 'real_owner' を返す。body の偽 owner は無視される。
    const handler = withOwner(adapterReturning('real_owner'), async (_r, owner) => {
      return new Response(owner, { status: 200 });
    });
    const spoofed = new Request('https://app.test/api/sets', {
      method: 'POST',
      body: JSON.stringify({ ownerId: 'attacker' }),
    });
    const res = await handler(spoofed);
    expect(await res.text()).toBe('real_owner');
  });

  it('handler が AuthError を投げたら対応ステータスに変換', async () => {
    const handler = withOwner(adapterReturning('o1'), async () => {
      throw new AuthError(404, 'not found');
    });
    const res = await handler(req());
    expect(res.status).toBe(404);
  });
});

describe('requireOwner', () => {
  const owner = asOwnerId('user_1');

  it('N4: owner 一致で通過', () => {
    expect(() => requireOwner(owner, 'user_1')).not.toThrow();
  });

  it('E2: 不一致は 404（存在秘匿）', () => {
    expect(() => requireOwner(owner, 'user_2')).toThrow(AuthError);
    try {
      requireOwner(owner, 'user_2');
    } catch (e) {
      expect((e as AuthError).status).toBe(404);
    }
  });

  it('null リソース owner は 404', () => {
    expect(() => requireOwner(owner, null)).toThrow(AuthError);
  });
});
