import { useCallback, useState } from 'react';
import type { ExecutionRepo } from '../model/executionRepo.js';
import {
  startSession,
  endCurrentItem,
  pause,
  resumeSame,
  nextItem,
  endSession,
  setNote,
  type ExecState,
} from '../model/executionMachine.js';

export interface UseExecutionDeps {
  now?: () => string;
}

/**
 * 実行状態を保持し、遷移ごとに local-sync へ永続する。
 * 記録はタイムスタンプ方式（生タイマー不使用）。
 */
export function useExecution(
  repo: ExecutionRepo,
  sessionLocalId: string,
  deps: UseExecutionDeps = {},
) {
  const now = deps.now ?? (() => new Date().toISOString());
  const [state, setState] = useState<ExecState | null>(null);

  const persist = useCallback(
    (next: ExecState) => {
      void repo.persist(sessionLocalId, next);
      return next;
    },
    [repo, sessionLocalId],
  );

  const apply = useCallback(
    (fn: (s: ExecState, n: string) => ExecState) =>
      setState((prev) => (prev ? persist(fn(prev, now())) : prev)),
    [persist, now],
  );

  return {
    state,
    start: useCallback(
      (setId: string, itemIds: string[]) =>
        setState(persist(startSession(setId, itemIds, now()))),
      [persist, now],
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
