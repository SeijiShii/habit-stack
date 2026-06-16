import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ClerkProvider,
  useAuth,
  useSignIn,
  useUser,
  useClerk,
} from "@clerk/clerk-react";
import { asOwnerId } from "../../types/domain.js";
import { getOrCreateLocalGuestId } from "../../services/auth/localGuest.js";
import { OwnerContext } from "../../services/auth/ownerContext.js";
import {
  fetchGuestToken as defaultFetchGuestToken,
  getStoredGuestToken,
  storeGuestToken,
  clearGuestToken,
  decodeGuestSub,
} from "../../services/auth/guestClient.js";

/** guest JWT を取得して返す（失敗時 null）。注入で差し替え可能。 */
export type GuestTokenFetcher = () => Promise<string | null>;

/**
 * owner（データ所有キー）を決める純ロジック（C20260617-001、churn 根治の核）。
 * - サインイン済（Google 連携アカウント）= Clerk userId（実アカウント、安定）。
 * - 未サインイン（ゲスト）= **永続 guest JWT の sub**。Clerk セッションの userId を一切見ないため、
 *   トークン失効・リロードで Clerk guest userId が churn しても owner は不変 = データが orphan 化しない。
 * - guest sub も無い（取得前/失敗）= ローカルゲスト id（offline degrade、localStorage 永続で安定）。
 * - 未ロード = null。
 */
export function pickOwnerId(p: {
  isSignedIn: boolean;
  userId: string | null | undefined;
  isLoaded: boolean;
  guestSub: string | null;
  getLocalGuestId: () => string;
}): string | null {
  if (p.isSignedIn && p.userId) return p.userId;
  if (!p.isLoaded) return null;
  return p.guestSub ?? p.getLocalGuestId();
}

/**
 * 表示用の email を選ぶ（C20260614-002）。合成ゲスト email（`@guests.<domain>`）は内部用なので
 * ユーザーに見せない。Google 連携済みなら外部アカウント（Google）の email を優先表示する。
 */
export function displayEmail(
  externalEmail: string | undefined,
  primaryEmail: string | undefined,
): string | undefined {
  if (externalEmail) return externalEmail;
  if (primaryEmail && !primaryEmail.includes("@guests.")) return primaryEmail;
  return undefined;
}

const defaultFetcher: GuestTokenFetcher = async () => {
  try {
    return await defaultFetchGuestToken();
  } catch {
    return null;
  }
};

/**
 * Clerk セッションを owner に橋渡しする（C20260617-001 で guest 自前署名 JWT 化）。
 *
 * **ゲストは Clerk セッションではない**: 未サインイン時はサーバ発行の guest JWT を localStorage に
 * 永続し、owner はその `sub` に由来する。これにより Clerk セッションの TTL 失効・リロードをまたいでも
 * owner が不変 = owner churn が起きず owner-scoped ローカルデータが orphan 化しない（データ消失バグの根治）。
 * Clerk サインイン（Google 連携）時のみ owner = Clerk userId へ昇格し、repos が旧 owner（guest sub /
 * 旧 Clerk guest userId / ローカルゲスト id）のデータを現 owner へ reassign で引き継ぐ。
 * 範型: bousai-bag-checker `src/shared/auth/*`（revise_003）。
 */
function ClerkOwnerBridge({
  fetchGuestToken,
  children,
}: {
  fetchGuestToken: GuestTokenFetcher;
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { signIn } = useSignIn();
  const { user } = useUser();
  const clerk = useClerk();
  const [guestSub, setGuestSub] = useState<string | null>(() =>
    decodeGuestSub(getStoredGuestToken()),
  );
  const ensuring = useRef(false);

  // 未サインイン時: guest JWT を ensure（保持済なら再利用 = 同一 sub 維持、無ければ取得して永続）。
  // /sso-callback 処理中は OAuth セッション確立と競合させないため抑止する。
  useEffect(() => {
    if (!isLoaded || isSignedIn || ensuring.current) return;
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/sso-callback"
    )
      return;
    const stored = getStoredGuestToken();
    if (stored) {
      setGuestSub(decodeGuestSub(stored));
      return;
    }
    ensuring.current = true;
    let cancelled = false;
    void (async () => {
      const token = await fetchGuestToken();
      ensuring.current = false;
      if (cancelled || !token) return; // 取得失敗は localGuest で degrade
      storeGuestToken(token);
      setGuestSub(decodeGuestSub(token));
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, fetchGuestToken]);

  // Clerk サインイン確立時（Google 連携成功）: guest token を破棄（identity がアカウントへ昇格）。
  useEffect(() => {
    if (isSignedIn) clearGuestToken();
  }, [isSignedIn]);

  // owner 決定（純ロジックは pickOwnerId で単体テスト）。
  const owner = pickOwnerId({
    isSignedIn: !!isSignedIn,
    userId,
    isLoaded,
    guestSub,
    getLocalGuestId: getOrCreateLocalGuestId,
  });
  const ownerId = owner ? asOwnerId(owner) : null;

  // 外部アカウント（Google 等）連携済みか
  const isLinked = (user?.externalAccounts?.length ?? 0) > 0;
  const email = displayEmail(
    user?.externalAccounts?.[0]?.emailAddress,
    user?.primaryEmailAddress?.emailAddress,
  );

  // 「Google でログイン」= OAuth サインイン（ゲストは Clerk セッションでないので link でなく sign-in）。
  // 新規 Google なら Clerk が user 作成、既存なら入り直し。どちらも復帰後 isSignedIn=true で
  // owner=Clerk userId になり、repos が guest sub のローカルデータを現 owner へ reassign で引き継ぐ。
  // ゲストが Clerk セッションでないため reverification / already-signed-in の壁を踏まない（O58）。
  const signInWithGoogle = signIn
    ? async () => {
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: `${window.location.origin}/account`,
        });
      }
    : undefined;

  const signOut = async () => {
    await clerk.signOut();
  };

  return (
    <OwnerContext.Provider
      value={{
        ownerId,
        isLoaded,
        isLocalGuest: !isSignedIn && isLoaded,
        isLinked,
        email,
        // 1 ボタン統合（C20260614-002）: link も sign-in も同一の OAuth サインイン経路。
        linkGoogle: signInWithGoogle,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </OwnerContext.Provider>
  );
}

/** Clerk 無し（キー未設定/オフライン）でローカルゲスト owner を供給。 */
function LocalOwnerProvider({ children }: { children: ReactNode }) {
  return (
    <OwnerContext.Provider
      value={{
        ownerId: asOwnerId(getOrCreateLocalGuestId()),
        isLoaded: true,
        isLocalGuest: true,
        isLinked: false,
      }}
    >
      {children}
    </OwnerContext.Provider>
  );
}

export interface AuthProviderProps {
  publishableKey: string;
  children: ReactNode;
  fetchGuestToken?: GuestTokenFetcher;
}

/**
 * publishableKey があれば Clerk 認証（匿名ゲスト = 自前 guest JWT → Google 連携で昇格）、
 * 無ければローカルゲストのみで動作（offline-first）。
 */
export function AuthProvider({
  publishableKey,
  children,
  fetchGuestToken = defaultFetcher,
}: AuthProviderProps) {
  if (!publishableKey) {
    return <LocalOwnerProvider>{children}</LocalOwnerProvider>;
  }
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkOwnerBridge fetchGuestToken={fetchGuestToken}>
        {children}
      </ClerkOwnerBridge>
    </ClerkProvider>
  );
}
