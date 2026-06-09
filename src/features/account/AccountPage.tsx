import { useState, type ReactElement } from "react";
import { useOwner } from "../../services/auth/ownerContext.js";

/**
 * アカウント画面（auth SPEC §3 / claim C20260609-002）。
 * - ゲスト（未連携）: 「Google で引き継ぐ」導線でデータ引き継ぎ・複数端末同期を開始
 * - 連携済み: メール表示 + サインアウト
 * - keyless（オフライン/キー未設定）: ローカルのみ利用中の旨を表示（連携は不可、offline-first 維持）
 *
 * 応援（投げ銭）はログイン不要のため本画面とは独立（donation 非ゲート、O46）。
 */
export function AccountPage(): ReactElement {
  const { isLoaded, isLinked, email, linkGoogle, signOut } = useOwner();
  const [busy, setBusy] = useState(false);

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
    try {
      await linkGoogle();
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
            でログインすると、 記録を引き継いで別の端末でも続けられます。
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onLink}
            disabled={busy}
          >
            Google で引き継ぐ
          </button>
        </section>
      ) : (
        <section aria-label="ローカル利用">
          <p>
            この端末でゲストとして利用中です。オンライン環境では Google
            で引き継ぎできます。
          </p>
        </section>
      )}
    </main>
  );
}
