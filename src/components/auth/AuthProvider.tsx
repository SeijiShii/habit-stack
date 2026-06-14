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
    if (!isLoaded || isSignedIn || !signIn || refreshingRef.current) return;
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
  const email = user?.primaryEmailAddress?.emailAddress ?? undefined;

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
            await clerk.signOut();
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
