import { useEffect, type ReactNode } from 'react';
import {
  ClerkProvider,
  useAuth,
  useSignIn,
} from '@clerk/clerk-react';

/** ゲストチケットを取得するデフォルト実装（注入可能、テスト用に差し替え）。 */
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

/**
 * 初回起動で匿名セッションが無ければゲストチケットで自動サインイン（0 タップ実行、O22）。
 * 失敗してもローカル（IndexedDB）で degrade する（offline-critical）。
 */
function GuestBootstrap({
  fetchGuestTicket,
  children,
}: {
  fetchGuestTicket: GuestTicketFetcher;
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
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
        // degrade: ローカルで継続（同期は後で）
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, signIn, setActive, fetchGuestTicket]);

  return <>{children}</>;
}

export interface AuthProviderProps {
  publishableKey: string;
  children: ReactNode;
  /** テスト用にゲストチケット取得を差し替え。 */
  fetchGuestTicket?: GuestTicketFetcher;
}

export function AuthProvider({
  publishableKey,
  children,
  fetchGuestTicket = defaultFetchGuestTicket,
}: AuthProviderProps) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <GuestBootstrap fetchGuestTicket={fetchGuestTicket}>
        {children}
      </GuestBootstrap>
    </ClerkProvider>
  );
}
