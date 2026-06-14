import { useEffect, type ReactNode } from "react";
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

  useEffect(() => {
    if (!isLoaded || isSignedIn || !signIn) return;
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
        // server が現セッションの userId に対し fresh ticket を発行。redeem が first-factor を再検証し、
        // aged guest session の createExternalAccount 403（"additional verification"）を回避する。
        try {
          const ticket = await fetchGuestTicket();
          if (ticket && signIn && setActive) {
            const res = await signIn.create({ strategy: "ticket", ticket });
            if (res.status === "complete" && res.createdSessionId) {
              await setActive({ session: res.createdSessionId });
            }
          }
        } catch {
          // refresh 失敗は致命でない。続行し、なお 403 なら AccountPage が可視化する。
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
