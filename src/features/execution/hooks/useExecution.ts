import { useCallback, useEffect, useRef, useState } from "react";
import type { ExecutionRepo } from "../model/executionRepo.js";
import { decideRecovery } from "../model/recovery.js";
import {
  startSession,
  endCurrentItem,
  pause,
  resumeSame,
  nextItem,
  endSession,
  setNote,
  type ExecState,
} from "../model/executionMachine.js";

export interface UseExecutionDeps {
  now?: () => string;
}

/**
 * 実行状態を保持し、遷移ごとに local-sync へ永続する。
 * 記録はタイムスタンプ方式（生タイマー不使用）。
 *
 * マウント時に進行中セッションを復元する（UC-EX-RESUME / UC-EX-IDLE、R20260611-001）:
 * - 永続 id は found レコードの clientLocalId を採用（日跨ぎ重複を防ぐ、spec-review R6）。
 * - 復元判定 decideRecovery は純関数、finalize は冪等 put のため StrictMode 二重実行に安全（R1）。
 */
export function useExecution(
  repo: ExecutionRepo,
  sessionLocalId: string,
  deps: UseExecutionDeps = {},
) {
  const now = deps.now ?? (() => new Date().toISOString());
  const [state, setState] = useState<ExecState | null>(null);
  // 永続に使う実 id。復元時に found レコードの id へ差し替える（R6）。
  const idRef = useRef(sessionLocalId);
  // 復元適用済みフラグ。async 内（cancelled 判定の後）で立てるため、二度目の実マウントを
  // ブロックしない（旧 restoredRef 不具合の回避）。二重適用に対する防御も兼ねる。
  const appliedRef = useRef(false);

  // マウント時に進行中セッションを復元する（UC-EX-RESUME / UC-EX-IDLE）。
  // StrictMode 安全性（R1/P83）: 一度目のマウントの async は cleanup の cancelled=true で中断され、
  // 二度目（実マウント）の async が appliedRef を立てて 1 度だけ適用する。decideRecovery は純関数、
  // finalize は冪等 put のため二重実行に安全。
  // ※ 旧実装は restoredRef を effect 冒頭で同期的に立てて start を gate していたため、cleanup の
  //   cancel と相まって二度目のマウントが早期 return し復元が一切適用されなかった（D20260611-025）。
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const found = await repo.restoreInProgress();
      if (cancelled || !found || appliedRef.current) return;
      appliedRef.current = true;
      idRef.current = found.id;
      const dec = decideRecovery({
        state: found.state,
        lastSavedAt: found.lastSavedAt,
        now: now(),
      });
      if (dec.kind === "autoEnd") {
        const ended = endSession(found.state, dec.endedAt);
        setState(ended);
        void repo.persist(found.id, ended, {
          lastSavedAt: dec.endedAt,
          achievementMode: "strict",
        });
      } else {
        setState(found.state);
      }
    })();
    return () => {
      cancelled = true;
    };
    // 復元はマウント時のみ。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(
    (next: ExecState) => {
      void repo.persist(idRef.current, next);
      return next;
    },
    [repo],
  );

  const apply = useCallback(
    (fn: (s: ExecState, n: string) => ExecState) =>
      setState((prev) => (prev ? persist(fn(prev, now())) : prev)),
    [persist, now],
  );

  return {
    state,
    /** 永続に使う実 id（復元時に found id へ差し替わる）。15秒 flush 等で使う。 */
    activeId: idRef,
    start: useCallback(
      (setId: string, itemIds: string[]) => {
        idRef.current = sessionLocalId;
        setState(persist(startSession(setId, itemIds, now())));
      },
      [persist, now, sessionLocalId],
    ),
    endItem: useCallback(() => apply(endCurrentItem), [apply]),
    pause: useCallback(() => apply(pause), [apply]),
    resume: useCallback(() => apply(resumeSame), [apply]),
    next: useCallback(() => apply(nextItem), [apply]),
    end: useCallback(() => apply(endSession), [apply]),
    setNote: useCallback(
      (note: string) => setState((prev) => (prev ? setNote(prev, note) : prev)),
      [],
    ),
  };
}
