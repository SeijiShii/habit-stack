import { useState, type ReactElement } from "react";
import { useOwner } from "../../services/auth/ownerContext.js";

/**
 * Google 連携失敗時のユーザー向けメッセージ（C20260614-002）。
 * Clerk reverification（aged session の step-up）は 403 "additional verification" で返るため専用文言にする。
 * 従来は onLink が catch を持たず失敗が無言だった（「押しても何も起きない」）。
 */
export function linkErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  const status = (e as { status?: number } | null)?.status;
  if (status === 403 || /additional verification|reverif/i.test(msg)) {
    return "セッションの再確認が必要なため連携を開始できませんでした。アプリを開き直してから、もう一度お試しください。";
  }
  return "Google 連携を開始できませんでした。通信状況を確認して、もう一度お試しください。";
}

export interface AccountPageProps {
  /**
   * 全データのセルフサービス削除を実行する（O54 消去権）。
   * App が purgeAllData（サーバ削除 + ローカル wipe）を配線する。未注入なら削除導線は出さない。
   */
  onDeleteAllData?: () => Promise<void>;
  /** 削除完了後の遷移（既定: トップへリロードしてフレッシュなゲスト状態に戻す）。 */
  onDeleted?: () => void;
}

/**
 * アカウント画面（auth SPEC §3 / claim C20260609-002）。
 * - ゲスト（未連携）: 「Google で引き継ぐ」導線でデータ引き継ぎ・複数端末同期を開始
 * - 連携済み: メール表示 + サインアウト
 * - keyless（オフライン/キー未設定）: ローカルのみ利用中の旨を表示（連携は不可、offline-first 維持）
 * - 全データ削除: アプリ内セルフサービス削除（O54 消去権、プラポリ N2 の約束を充足）
 *
 * 応援（投げ銭）はログイン不要のため本画面とは独立（donation 非ゲート、O46）。
 */
export function AccountPage({
  onDeleteAllData,
  onDeleted,
}: AccountPageProps = {}): ReactElement {
  const { isLoaded, isLinked, email, linkGoogle, signOut } = useOwner();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <main aria-busy="true">
        <p>読み込み中…</p>
      </main>
    );
  }

  const onLink = async () => {
    if (!linkGoogle) return;
    setBusy(true);
    setLinkError(null);
    try {
      await linkGoogle();
    } catch (e) {
      // 従来は catch 無しで失敗が無言だった（C20260614-002: reverification 403 で「押しても何も起きない」）。
      setLinkError(linkErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    if (!signOut) return;
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!onDeleteAllData) return;
    setBusy(true);
    try {
      await onDeleteAllData();
      (onDeleted ?? (() => window.location.assign("/")))();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <h1>アカウント</h1>

      {isLinked ? (
        <section aria-label="連携済みアカウント">
          <p>
            Google
            アカウントで引き継ぎ済みです。別の端末でも続きを記録できます。
          </p>
          {email ? <p>{email}</p> : null}
          <button type="button" onClick={onSignOut} disabled={busy}>
            サインアウト
          </button>
        </section>
      ) : linkGoogle ? (
        <section aria-label="アカウント連携">
          <p>
            いまはこの端末だけにデータが保存されています。Google
            でログインすると、別の端末でも続けて記録できます。初めてのアカウントならこの端末の記録を引き継ぎ、すでに使っているアカウントならそのデータが反映されます。
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onLink}
            disabled={busy}
          >
            Google でログイン
          </button>
          {linkError ? <p role="alert">{linkError}</p> : null}
        </section>
      ) : (
        <section aria-label="ローカル利用">
          <p>
            この端末でゲストとして利用中です。オンライン環境では Google
            で引き継ぎできます。
          </p>
        </section>
      )}

      {onDeleteAllData ? (
        <section aria-label="データの削除">
          <h2>データの削除</h2>
          <p>すべての記録を完全に削除します。元に戻すことはできません。</p>
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy}
            >
              全データを削除
            </button>
          ) : (
            <>
              <p role="alert">本当に削除しますか？この操作は取り消せません。</p>
              <button
                type="button"
                className="btn-danger"
                onClick={onDelete}
                disabled={busy}
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                キャンセル
              </button>
            </>
          )}
        </section>
      ) : null}
    </main>
  );
}
