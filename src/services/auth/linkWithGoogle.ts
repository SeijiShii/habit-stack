/**
 * 段階的認証（O22 / auth SPEC §3）。匿名 Clerk user に Google を連携してアップグレードする。
 * Clerk `createExternalAccount` は**同一 userId を維持**するため、サーバ/ローカルの既存データは
 * 所有が保たれデータ移行は不要（新 id になる場合のみ dataOps.reassignOwner を fallback で使う）。
 *
 * 実 Clerk SDK への依存を避けるため injectable（O35）。テストは mock user を注入する。
 */

/** Clerk user の連携に必要な最小インターフェース（injectable seam）。 */
export interface ExternalAccountLinker {
  createExternalAccount(params: {
    strategy: "oauth_google";
    redirectUrl: string;
  }): Promise<{
    verification?: {
      externalVerificationRedirectURL?: URL | string | null;
    } | null;
  }>;
}

export type Navigate = (url: string) => void;

/**
 * 匿名ユーザーを Google OAuth で連携（同一 owner id 維持）。
 * Clerk が返す検証リダイレクト URL へ遷移して OAuth フローを開始する。
 * 戻り先（redirectUrl）は連携完了後にアプリへ戻すための URL（例: <origin>/account）。
 */
export async function linkWithGoogle(
  user: ExternalAccountLinker,
  redirectUrl: string,
  navigate: Navigate,
): Promise<void> {
  const ext = await user.createExternalAccount({
    strategy: "oauth_google",
    redirectUrl,
  });
  const target = ext.verification?.externalVerificationRedirectURL;
  if (target) {
    navigate(typeof target === "string" ? target : target.toString());
  }
}
