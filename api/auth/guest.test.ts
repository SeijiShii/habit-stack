import { describe, it, expect, afterEach } from 'vitest';
import { handleGuestTicket } from './guest.js';

afterEach(() => {
  delete process.env.CLERK_SECRET_KEY;
  delete process.env.CLERK_PUBLISHABLE_KEY;
});

describe('handleGuestTicket', () => {
  it('CLERK_SECRET_KEY 未設定で 503 degrade（offline 継続）', async () => {
    const res = await handleGuestTicket(new Request('https://app.test/api/auth/guest', { method: 'POST' }));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('guest_unavailable');
  });
});
