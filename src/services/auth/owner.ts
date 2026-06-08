import { asOwnerId, type OwnerId } from '../../types/domain.js';

/**
 * 認証アダプタ（injectable、O35）。リクエストから owner（Clerk user id / 匿名ゲスト id）を解決する。
 * 本番実装は Clerk セッション由来（clerkAuthAdapter）、テストは mock を注入する。
 * **クライアント送信の owner 値は一切信用しない**（SEC-001）。サーバ側セッションからのみ解決。
 */
export interface AuthAdapter {
  /** 認証済みなら owner id、未認証なら null。匿名ゲストも有効な owner を返す（O22）。 */
  resolveOwnerId(req: Request): Promise<string | null>;
}

/** withOwner / requireOwner が投げる認可エラー。HTTP ステータスへマップする。 */
export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export type OwnedHandler = (req: Request, ownerId: OwnerId) => Promise<Response>;

/**
 * 保護 API ハンドラを owner 解決でラップする。未認証は 401。
 * owner はサーバ側 adapter からのみ注入（クライアント値を信用しない、SEC-001）。
 */
export function withOwner(adapter: AuthAdapter, handler: OwnedHandler) {
  return async (req: Request): Promise<Response> => {
    const raw = await adapter.resolveOwnerId(req);
    if (!raw) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }
    try {
      return await handler(req, asOwnerId(raw));
    } catch (e) {
      if (e instanceof AuthError) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: e.status,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw e;
    }
  };
}

/**
 * リソースの owner 一致を検証する。不一致は 404（存在秘匿、他人のリソースの存在を漏らさない）。
 */
export function requireOwner(
  ownerId: OwnerId,
  resourceOwnerId: string | null | undefined,
): void {
  if (resourceOwnerId == null || resourceOwnerId !== ownerId) {
    throw new AuthError(404, 'not found');
  }
}
