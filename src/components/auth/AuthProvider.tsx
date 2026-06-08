import { useEffect, type ReactNode } from 'react';
import { ClerkProvider, useAuth, useSignIn } from '@clerk/clerk-react';
import { asOwnerId } from '../../types/domain.js';
import { getOrCreateLocalGuestId } from '../../services/auth/localGuest.js';
import { OwnerContext } from '../../services/auth/ownerContext.js';

export type GuestTicketFetcher = () => Promise<string | null>;

const defaultFetchGuestTicket: GuestTicketFetcher = async () => {
  try {
    const res = await fetch('/api/auth/guest', { method: 'POST' });
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

  useEffect(() => {
    if (!isLoaded || isSignedIn || !signIn) return;
    let cancelled = false;
    void (async () => {
      const ticket = await fetchGuestTicket();
      if (cancelled || !ticket) return;
      try {
        const res = await signIn.create({ strategy: 'ticket', ticket });
        if (res.status === 'complete' && setActive) {
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

  return (
    <OwnerContext.Provider
      value={{ ownerId, isLoaded, isLocalGuest: !userId && isLoaded }}
    >
      {children}
    </OwnerContext.Provider>
  );
}

/** Clerk 無し（キー未設定/オフライン）でローカルゲスト owner を供給。 */
function LocalOwnerProvider({ children }: { children: ReactNode }) {
  return (
    <OwnerContext.Provider
      value={{ ownerId: asOwnerId(getOrCreateLocalGuestId()), isLoaded: true, isLocalGuest: true }}
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
      <ClerkOwnerBridge fetchGuestTicket={fetchGuestTicket}>{children}</ClerkOwnerBridge>
    </ClerkProvider>
  );
}
