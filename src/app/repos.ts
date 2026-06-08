import { useEffect, useMemo, useState } from 'react';
import { LocalStore } from '../services/sync/localStore.js';
import { SetsRepo } from '../features/activity-sets/model/setsRepo.js';
import { ExecutionRepo } from '../features/execution/model/executionRepo.js';
import { SummaryRepo } from '../features/streak-summary/model/summaryRepo.js';
import { useOwner } from '../hooks/useOwner.js';

export interface Repos {
  sets: SetsRepo;
  execution: ExecutionRepo;
  summary: SummaryRepo;
}

/** LocalStore を開き、owner 確立後に各 repo を提供する（匿名でも owner あり）。 */
export function useRepos(): Repos | null {
  const { ownerId } = useOwner();
  const [store, setStore] = useState<LocalStore | null>(null);

  useEffect(() => {
    let alive = true;
    void LocalStore.open().then((s) => {
      if (alive) setStore(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(() => {
    if (!store || !ownerId) return null;
    return {
      sets: new SetsRepo(store, ownerId),
      execution: new ExecutionRepo(store, ownerId),
      summary: new SummaryRepo(store, ownerId),
    };
  }, [store, ownerId]);
}
