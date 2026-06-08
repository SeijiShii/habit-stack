import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SetsRepo, SetRecord } from '../model/setsRepo.js';
import type { SetInput, ItemInput } from '../model/schema.js';

const SETS_KEY = ['activity-sets'];
const itemsKey = (setId: string) => ['activity-items', setId];

/** 活動セット一覧 + 作成/削除のフック（TanStack Query）。 */
export function useSets(repo: SetsRepo) {
  const qc = useQueryClient();
  const sets = useQuery({ queryKey: SETS_KEY, queryFn: () => repo.listSets() });

  const createSet = useMutation({
    mutationFn: (input: SetInput) => repo.createSet(input, sets.data?.length ?? 0),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETS_KEY }),
  });

  const deleteSet = useMutation({
    mutationFn: (id: string) => repo.deleteSet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETS_KEY }),
  });

  return { sets, createSet, deleteSet };
}

/** セット内アイテムのフック。 */
export function useItems(repo: SetsRepo, set: SetRecord) {
  const qc = useQueryClient();
  const items = useQuery({
    queryKey: itemsKey(set.id),
    queryFn: () => repo.listItems(set.id),
  });

  const createItem = useMutation({
    mutationFn: (input: ItemInput) =>
      repo.createItem(set.id, input, items.data?.length ?? 0),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKey(set.id) }),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => repo.deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKey(set.id) }),
  });

  return { items, createItem, deleteItem };
}
