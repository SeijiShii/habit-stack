/**
 * 既存アカウントへのサインイン（=デバイス上書き）を「OAuth 復帰後に物理 cleanup する」ための marker
 * （R20260615-001 / spec-review R2）。
 *
 * signInWithGoogle / 既存ユーザー fallback は OAuth リダイレクトでページ遷移するため、
 * 切替境界で同期的に旧 owner のローカルを wipe できない。そこで遷移前にこの marker を立て、
 * 復帰後の app 初期化（repos）で current owner 以外のローカルを wipe → marker をクリアする。
 *
 * 重要: 単なるゲスト churn（自動ゲスト再生成）では marker を立てないこと。立ててしまうと、
 * 連携で保持すべき churned データまで消える（要望4 と逆行、spec-review R3）。marker は
 * 「明示的に既存アカウントへサインインした」場合だけにする。
 */
const OVERWRITE_KEY = "hs_overwrite_device";

type WriteStorage = Pick<Storage, "setItem">;
type ReadStorage = Pick<Storage, "getItem" | "removeItem">;

function defaultStorage(): (WriteStorage & ReadStorage) | null {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage : null;
  } catch {
    return null;
  }
}

/** 既存アカウントサインイン直前に呼ぶ（復帰後に上書き cleanup する意図を残す）。 */
export function markDeviceOverwrite(storage: WriteStorage | null = defaultStorage()): void {
  try {
    storage?.setItem(OVERWRITE_KEY, "1");
  } catch {
    // storage 不可（プライベートモード等）は無視。cleanup は次の機会に委ねる。
  }
}

/**
 * 上書き marker を取り出して消す（1 回限り消費）。
 * true = 既存アカウントサインインからの復帰なので current owner 以外を wipe してよい。
 */
export function consumeDeviceOverwrite(
  storage: ReadStorage | null = defaultStorage(),
): boolean {
  try {
    const v = storage?.getItem(OVERWRITE_KEY);
    if (v) storage?.removeItem(OVERWRITE_KEY);
    return !!v;
  } catch {
    return false;
  }
}
