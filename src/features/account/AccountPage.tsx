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
  /**
   * App が合成するサインアウト（Clerk signOut + デバイスのローカル wipe、R20260615-001 / spec-review R1）。
   * 未注入なら useOwner().signOut を使う（wipe なし）。デバイス削除は LocalStore に到達できる App 層で配線する。
   */
  onSignOut?: () => Promise<void>;
  /**
   * 計時中（進行中）セッションがあるか（R20260615-001）。アカウント切替（ログイン/サインアウト）の直前に確認し、
   * 進行中があれば「計時中の活動を停止しますか」を出す。未注入なら確認せず即切替（後方互換）。
   */
  probeInProgress?: () => Promise<boolean>;
  /** 進行中セッションを保存して停止する（endInProgressNow）。確認 OK 時に呼ぶ。 */
  onStopInProgress?: () => Promise<void>;
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
  onSignOut,
  probeInProgress,
  onStopInProgress,
}: AccountPageProps = {}): ReactElement {
  const {
    isLoaded,
    isLinked,
    email,
    linkGoogle,
    signOut: ctxSignOut,
  } = useOwner();
  // App 合成の signOut（wipe 込み）を優先。未注入なら context の signOut。
  const signOut = onSignOut ?? ctxSignOut;
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  // アカウント切替（ログイン/サインアウト）の保留種別。進行中があるときの確認ダイアログ表示に使う。
  const [pendingSwitch, setPendingSwitch] = useState<null | "link" | "signout">(
    null,
  );

  if (!isLoaded) {
    return (
      <main aria-busy="true">
        <p>読み込み中…</p>
      </main>
    );
  }

  // 実際の切替アクション（確認後 or 進行中なしで直接実行）。
  const runSwitch = async (kind: "link" | "signout") => {
    if (kind === "link") {
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
    } else {
      if (!signOut) return;
      setBusy(true);
      try {
        await signOut();
      } finally {
        setBusy(false);
      }
    }
  };

  // アカウント切替の要求口（R20260615-001）。進行中があれば確認、なければ即切替。
  const requestSwitch = async (kind: "link" | "signout") => {
    if (probeInProgress && (await probeInProgress())) {
      setPendingSwitch(kind);
      return;
    }
    await runSwitch(kind);
  };

  // 「停止して続行」: 進行中を保存して停止 → 切替を続行（保存してから切替ポリシーへ）。
  const onConfirmStop = async () => {
    const kind = pendingSwitch;
    setPendingSwitch(null);
    if (!kind) return;
    setBusy(true);
    try {
      await onStopInProgress?.();
    } finally {
      setBusy(false);
    }
    await runSwitch(kind);
  };

  // 「キャンセル」: 切替を中止（計時は継続、ログイン/サインアウトしない）。
  const onCancelStop = () => setPendingSwitch(null);

  const onLink = () => requestSwitch("link");
  const onSignOutClick = () => requestSwitch("signout");

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

      {pendingSwitch ? (
        <section role="alertdialog" aria-label="計時中の確認">
          <p role="alert">計時中の活動があります。停止しますか？</p>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirmStop}
            disabled={busy}
          >
            停止して続行
          </button>
          <button type="button" onClick={onCancelStop} disabled={busy}>
            キャンセル
          </button>
        </section>
      ) : null}

      {isLinked ? (
        <section aria-label="連携済みアカウント">
          <p>
            Google
            アカウントで引き継ぎ済みです。別の端末でも続きを記録できます。
          </p>
          {email ? <p>{email}</p> : null}
          <button type="button" onClick={onSignOutClick} disabled={busy}>
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
