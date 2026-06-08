export interface Ordered {
  id: string;
  sortOrder: number;
}

/**
 * 並べ替え: id 配列の順に sort_order を 0..n で連番振り直し（衝突なし、SPEC R1）。
 * 変更があった要素のみ返す。
 */
export function reorder<T extends Ordered>(items: T[], orderedIds: string[]): T[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const result: T[] = [];
  orderedIds.forEach((id, idx) => {
    const item = byId.get(id);
    if (item && item.sortOrder !== idx) {
      result.push({ ...item, sortOrder: idx });
    }
  });
  return result;
}
