import { useQuery } from "@tanstack/react-query";
import type { SetTotal } from "./model/overview.js";
import { formatDuration } from "../../services/time/localDate.js";

/** 総覧に必要な repo の最小契約（SetsRepo / SummaryRepo のサブセット）。 */
export interface OverviewSetsRepo {
  listSets(): Promise<{ id: string; name: unknown }[]>;
  listItems(setId: string): Promise<{ id: string; name: unknown }[]>;
}
export interface OverviewSummaryRepo {
  getSetTotals(): Promise<SetTotal[]>;
}

export interface SummaryOverviewPageProps {
  setsRepo: OverviewSetsRepo;
  summaryRepo: OverviewSummaryRepo;
  /** ドロップダウンでセットを選んだとき（個別サマリへの遷移）。 */
  onSelectSet: (setId: string) => void;
}

/**
 * 振り返り総覧（UC6-OV、R20260613-001）。
 * セット選択ドロップダウン + 全セットの折りたたみ一覧（合計時間 + アイテム別累計）。
 * 合計時間は全期間累計。記録ゼロも 0分 の中立表現（charter §2.2）。
 */
export function SummaryOverviewPage({
  setsRepo,
  summaryRepo,
  onSelectSet,
}: SummaryOverviewPageProps) {
  const q = useQuery({
    queryKey: ["summary-overview"],
    queryFn: async () => {
      const [sets, totals] = await Promise.all([
        setsRepo.listSets(),
        summaryRepo.getSetTotals(),
      ]);
      const items = await Promise.all(sets.map((s) => setsRepo.listItems(s.id)));
      return { sets, totals, items };
    },
  });

  if (!q.data) {
    return (
      <main aria-busy="true">
        <p>読み込み中…</p>
      </main>
    );
  }

  const { sets, totals, items } = q.data;
  const totalBySet = new Map(totals.map((t) => [t.setId, t]));

  if (sets.length === 0) {
    return (
      <main aria-labelledby="overview-title">
        <h1 id="overview-title">ふりかえり</h1>
        <p>まだセットがありません。最初のセットをつくってみましょう。</p>
        <a href="/sets">セットをつくる</a>
      </main>
    );
  }

  return (
    <main aria-labelledby="overview-title">
      <h1 id="overview-title">ふりかえり</h1>

      <p>
        <label>
          セットを選ぶ
          <select
            aria-label="セットを選ぶ"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onSelectSet(e.target.value);
            }}
          >
            <option value="" disabled>
              くわしく見るセットを選ぶ
            </option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {String(s.name)}
              </option>
            ))}
          </select>
        </label>
      </p>

      <section aria-label="セットと活動の一覧">
        {sets.map((s, idx) => {
          const total = totalBySet.get(s.id);
          const itemTotals = new Map(
            (total?.items ?? []).map((i) => [i.itemId, i.totalSec]),
          );
          return (
            <details key={s.id} role="group">
              <summary>
                {String(s.name)}{" "}
                <span data-testid={`set-total-${s.id}`}>
                  {formatDuration(total?.totalSec ?? 0)}
                </span>
              </summary>
              {items[idx] && items[idx].length > 0 ? (
                <ul>
                  {items[idx].map((it) => (
                    <li key={it.id}>
                      {String(it.name)}（{formatDuration(itemTotals.get(it.id) ?? 0)}）
                    </li>
                  ))}
                </ul>
              ) : (
                <p>アイテムがありません。</p>
              )}
            </details>
          );
        })}
      </section>
    </main>
  );
}
