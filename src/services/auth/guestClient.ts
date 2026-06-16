/**
 * 匿名ゲストの guest JWT 取得・保持のフロント側ヘルパ（C20260617-001、SDK 非依存）。
 *
 * Clerk ticket sign-in 方式（ゲスト=Clerk セッション、owner=Clerk userId）を撤去し、
 * `/api/auth/guest` から取得した自前署名 guest JWT を localStorage に永続 → 再利用する。
 * これにより認証トークン失効/リロードでも owner（guest JWT の sub）が不変 = owner churn 根絶。
 * 範型: bousai-bag-checker `src/shared/auth/guest-client.ts`（revise_003）。
 *
 * - `fetchGuestToken`: `/api/auth/guest` から `{ guestToken }` を取得（fetch 注入で単体テスト可）
 * - localStorage helpers: get/store/clear（連携成功時に clear して Clerk セッションへ切替）
 * - `buildEnsureGuestToken`: 「未保持なら 1 度取得して保持、保持済なら no-op」を組み立てる純関数
 */

/** localStorage の guest JWT 保存キー。 */
export const GUEST_TOKEN_KEY = "habit-stack.guestToken";

/** `/api/auth/guest` のレート超過（429）。短時間リトライ可。 */
export class GuestTokenRateLimitedError extends Error {
  constructor(public readonly reason: string = "rate_limited") {
    super(reason);
    this.name = "GuestTokenRateLimitedError";
  }
}

/** guest token 取得のその他失敗（5xx / network / 不正レスポンス）。 */
export class GuestTokenFetchError extends Error {
  constructor(message = "guest_token_failed", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GuestTokenFetchError";
  }
}

type MinimalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** SSR / 非対応環境でも安全な localStorage 取得（無ければ null）。 */
function defaultStorage(): MinimalStorage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

/** 保存済み guest token を返す（無ければ null）。 */
export function getStoredGuestToken(
  storage: MinimalStorage | null = defaultStorage(),
): string | null {
  try {
    return storage?.getItem(GUEST_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

/** guest token を保存する。 */
export function storeGuestToken(
  token: string,
  storage: MinimalStorage | null = defaultStorage(),
): void {
  try {
    storage?.setItem(GUEST_TOKEN_KEY, token);
  } catch {
    /* localStorage 不可環境は無視（次回再取得） */
  }
}

/** guest token を破棄する（連携成功時など）。 */
export function clearGuestToken(
  storage: MinimalStorage | null = defaultStorage(),
): void {
  try {
    storage?.removeItem(GUEST_TOKEN_KEY);
  } catch {
    /* no-op */
  }
}

/** `/api/auth/guest` を叩いて guest JWT 文字列を得る。 */
export async function fetchGuestToken(
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  let res: Response;
  try {
    res = await fetchFn("/api/auth/guest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch (err) {
    throw new GuestTokenFetchError("guest token request failed", {
      cause: err,
    });
  }
  if (res.status === 429) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new GuestTokenRateLimitedError(body.error ?? "rate_limited");
  }
  if (!res.ok) {
    throw new GuestTokenFetchError(`guest token failed: ${res.status}`);
  }
  const data = (await res.json().catch(() => ({}))) as { guestToken?: unknown };
  if (typeof data.guestToken !== "string" || !data.guestToken) {
    throw new GuestTokenFetchError("guest token missing in response");
  }
  return data.guestToken;
}

/**
 * guest JWT の payload を**検証せず** decode して sub を読む（owner キー用）。
 * ローカル IndexedDB の owner キーに使うだけ = 署名検証は不要（サーバはリクエスト時に検証する）。
 * 不正/欠落時は null。
 */
export function decodeGuestSub(token: string | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json =
      typeof atob === "function"
        ? atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        : Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as { sub?: unknown };
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

/** 「未保持なら 1 度取得して保持」を ensureGuestSession に注入する形に組み立てる。 */
export function buildEnsureGuestToken(p: {
  fetchToken: () => Promise<string>;
  getStored: () => string | null;
  store: (token: string) => void;
}): () => Promise<void> {
  return async () => {
    if (p.getStored()) return; // 既に保持 = no-op（同一 sub 維持）
    const token = await p.fetchToken();
    p.store(token);
  };
}
