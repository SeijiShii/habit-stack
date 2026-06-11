import type { ExecState } from './executionMachine.js';

/**
 * 計時中セッションのハートビート（localStorage、毎秒更新）。
 * - account-scoped: キーに ownerId を含めアカウント分離（別 owner のデータを復元しない）。
 * - lastSavedAt: 最終生存時刻。復帰時の 4H 放置判定に使う（R20260611-001 R2/UC-EX-IDLE）。
 * - snapshot: IndexedDB が使えない場合のフォールバック。構造正本は IndexedDB（spec-review R4）。
 */
export interface Heartbeat {
  sessionLocalId: string;
  lastSavedAt: string;
  snapshot: ExecState;
}

const key = (ownerId: string): string => `hs:exec:hb:${ownerId}`;

type Storageish = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const safeStorage = (s?: Storageish): Storageish | undefined => {
  if (s) return s;
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
};

/** ハートビートを保存（owner 別キー）。失敗は握る（quota 等でも計時を止めない）。 */
export function saveHeartbeat(
  ownerId: string,
  hb: Heartbeat,
  storage?: Storageish,
): void {
  const st = safeStorage(storage);
  if (!st) return;
  try {
    st.setItem(key(ownerId), JSON.stringify(hb));
  } catch {
    /* offline-critical: 永続失敗で計時を止めない */
  }
}

/** owner のハートビートを読む。別 owner のキーは読めない（namespace 分離）。破損・欠落は undefined。 */
export function loadHeartbeat(
  ownerId: string,
  storage?: Storageish,
): Heartbeat | undefined {
  const st = safeStorage(storage);
  if (!st) return undefined;
  try {
    const raw = st.getItem(key(ownerId));
    if (!raw) return undefined;
    const hb = JSON.parse(raw) as Partial<Heartbeat>;
    if (!hb || typeof hb.lastSavedAt !== 'string' || !hb.snapshot) {
      return undefined;
    }
    return hb as Heartbeat;
  } catch {
    return undefined;
  }
}

/** ハートビートを消す（セッション done 時）。 */
export function clearHeartbeat(ownerId: string, storage?: Storageish): void {
  const st = safeStorage(storage);
  if (!st) return;
  try {
    st.removeItem(key(ownerId));
  } catch {
    /* noop */
  }
}
