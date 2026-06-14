import { useEffect, useRef, type ReactNode } from "react";
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
import { linkWithGoogle } from "../../services/auth/linkWithGoogle.js";

export type GuestTicketFetcher = () => Promise<string | null>;

/**
 * 表示用の email を選ぶ（C20260614-002）。合成ゲスト email（`@guests.<domain>`）は内部用なので
 * ユーザーに見せない。Google 連携済みなら外部アカウント（Google）の email を優先表示する。
 * どちらも無い / 合成のみなら undefined（email 行を出さない）。
 */
export function displayEmail(
  externalEmail: string | undefined,
  primaryEmail: string | undefined,
): string | undefined {
  if (externalEmail) return externalEmail;
  if (primaryEmail && !primaryEmail.includes("@guests.")) return primaryEmail;
  return undefined;
}

const defaultFetchGuestTicket: GuestTicketFetcher = async () => {
  try {
    const res = await fetch("/api/auth/guest", { method: "POST" });
    if (!res.ok) return null;
    const data = (await res.json()) as { ticket?: string };
    return data.ticket ?? null;
  } catch {
    return null;
  }
};

/** Clerk セッションを owner に橋渡し（未確立はローカルゲスト fallback）。 */
function ClerkOwnerBridge({
  fetchGuestTicket,
  children,
}: {
  fetchGuestTicket: GuestTicketFetcher;
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { signIn, setActive } = useSignIn();
  const { user } = useUser();
  const clerk = useClerk();
  // 連携前の意図的な session fresh 化中（signOut→re-sign-in）は、下の自動ゲスト生成 effect の
  // 割り込みを抑止する（割り込むと別 userId のゲストが作られ所有データが churn する、CF-20260614-002）。
  const refreshingRef = useRef(false);

  useEffect(() => {
    // /sso-callback 処理中は自動ゲスト生成を抑止する（OAuth サインインの session 確立と競合させない）。
    if (
      !isLoaded ||
      isSignedIn ||
      !signIn ||
      refreshingRef.current ||
      (typeof window !== "undefined" &&
        window.location.pathname === "/sso-callback")
    )
      return;
    let cancelled = false;
    void (async () => {
      const ticket = await fetchGuestTicket();
      if (cancelled || !ticket) return;
      try {
        const res = await signIn.create({ strategy: "ticket", ticket });
        if (res.status === "complete" && setActive) {
          await setActive({ session: res.createdSessionId });
        }
      } catch {
        // degrade: ローカルゲストで継続
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, signIn, setActive, fetchGuestTicket]);

  const ownerId = userId
    ? asOwnerId(userId)
    : isLoaded
      ? asOwnerId(getOrCreateLocalGuestId())
      : null;

  // 外部アカウント（Google 等）連携済みか = データ引き継ぎ可能な authed owner
  const isLinked = (user?.externalAccounts?.length ?? 0) > 0;
  // 表示 email: 合成ゲスト email（@guests.<domain>、内部用）は隠し、連携済みなら外部(Google)の email を出す。
  const email = displayEmail(
    user?.externalAccounts?.[0]?.emailAddress,
    user?.primaryEmailAddress?.emailAddress,
  );

  const linkGoogle = user
    ? async () => {
        // 連携直前にゲストセッションを張り直して reverification window 内に戻す（同一 userId、CF-20260614-002）。
        // Clerk は single-session 中 signIn.create が 400 になるため、
        //   ① 現セッションで fresh ticket を取得（server が同一 userId に発行）
        //   ② refreshingRef を立てて自動ゲスト生成を抑止
        //   ③ signOut → signIn.create({ticket}) → setActive で first-factor を再検証（fva リセット）
        // ticket は同一 userId なので所有データは保たれる（reassignOwner 不要）。
        try {
          const ticket = await fetchGuestTicket();
          if (ticket && signIn && setActive) {
            refreshingRef.current = true;
            // 現セッションを「非アクティブ化」する。clerk.signOut() は afterSignOutUrl('/') へ
            // ページ遷移してしまい以降のコードが走らないため使わない（CF-20260614-002）。
            // setActive({session:null}) は遷移せずアクティブ session を外すので signIn.create が通る。
            await setActive({ session: null });
            const res = await signIn.create({ strategy: "ticket", ticket });
            if (res.status === "complete" && res.createdSessionId) {
              await setActive({ session: res.createdSessionId });
            }
          }
        } catch {
          // refresh 失敗は致命でない。続行し、なお 403 なら AccountPage が可視化する。
        } finally {
          refreshingRef.current = false;
        }
        const freshUser = clerk.user ?? user;
        await linkWithGoogle(
          freshUser,
          `${window.location.origin}/account`,
          (url) => {
            window.location.href = url;
          },
        );
      }
    : undefined;

  // 既存 Google アカウントへサインインし直す（別端末で作成済み／サインアウトから復帰、C20260614-002）。
  // single-session のため現ゲストを外してから OAuth sign-in。成功すると既存ユーザーに入り直し、
  // ローカルの匿名データは上書きされる（ユーザー方針: Google アカウントのデータを優先）。
  const signInWithGoogle =
    signIn && setActive
      ? async () => {
          refreshingRef.current = true;
          await setActive({ session: null });
          await signIn.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: `${window.location.origin}/sso-callback`,
            redirectUrlComplete: `${window.location.origin}/account`,
          });
          // ここで Google へ遷移するため以降は実行されない。
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
        isLocalGuest: !userId && isLoaded,
        isLinked,
        email,
        linkGoogle,
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
  fetchGuestTicket?: GuestTicketFetcher;
}

/**
 * publishableKey があれば Clerk 認証（匿名→段階認証）、無ければローカルゲストのみで動作（offline-first）。
 */
export function AuthProvider({
  publishableKey,
  children,
  fetchGuestTicket = defaultFetchGuestTicket,
}: AuthProviderProps) {
  if (!publishableKey) {
    return <LocalOwnerProvider>{children}</LocalOwnerProvider>;
  }
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkOwnerBridge fetchGuestTicket={fetchGuestTicket}>
        {children}
      </ClerkOwnerBridge>
    </ClerkProvider>
  );
}
