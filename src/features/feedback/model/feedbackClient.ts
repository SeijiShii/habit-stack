import { scrubPii, scrubObject } from './piiScrub.js';

export type Reaction = 'good' | 'bad';

export interface FeedbackContext {
  route: string;
  appVersion: string;
  userAgent: string;
  at: string;
}

export interface FeedbackInput {
  reaction: Reaction;
  message?: string;
}

export interface FeedbackPayload {
  service: 'habit-stack';
  reaction: Reaction;
  message: string;
  context: FeedbackContext;
}

export type Fetcher = typeof fetch;

/**
 * フィードバックを自動コンテキスト付きで scrub（SEC-004）して送信（O40）。
 * hub endpoint へ中継。失敗してもユーザー体験を壊さない（degrade）。
 */
export class FeedbackClient {
  constructor(
    private readonly getContext: () => FeedbackContext,
    private readonly fetcher: Fetcher = fetch,
    private readonly endpoint = '/api/feedback',
  ) {}

  buildPayload(input: FeedbackInput): FeedbackPayload {
    return {
      service: 'habit-stack',
      reaction: input.reaction,
      message: scrubPii((input.message ?? '').slice(0, 1000)),
      context: scrubObject(this.getContext()),
    };
  }

  async send(input: FeedbackInput): Promise<{ ok: boolean }> {
    const payload = this.buildPayload(input);
    try {
      const res = await this.fetcher(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { ok: res.ok };
    } catch {
      return { ok: false }; // degrade（次回再送はウィジェット側で）
    }
  }
}
