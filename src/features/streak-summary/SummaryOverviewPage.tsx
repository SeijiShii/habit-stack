import { useQuery } from "@tanstack/react-query";

/** 総覧に必要な repo の最小契約（SetsRepo のサブセット）。 */
export interface OverviewSetsRepo {
  listSets(): Promise<{ id: string; name: unknown }[]>;
}

export interface SummaryOverviewPageProps {
  setsRepo: OverviewSetsRepo;
  /** ドロップダウンでセットを選んだとき（そのセットの継続画面へ）。 */
  onSelectSet: (setId: string) => void;
}

/**
 * 振り返り入口（継続タブ、R20260614）。
 * 初期表示は「セットを選ぶ」ドロップダウンだけ。選ぶとそのセットの継続画面
 * （遂行率 + 活動の記録）へ遷移する。全セットの一覧は出さない（選んでから見る）。
 */
export function SummaryOverviewPage({
  setsRepo,
  onSelectSet,
}: SummaryOverviewPageProps) {
  const q = useQuery({
    queryKey: ["summary-overview-sets"],
    queryFn: () => setsRepo.listSets(),
  });

  if (!q.data) {
    return (
      <main aria-busy="true">
        <p>読み込み中…</p>
      </main>
    );
  }

  const sets = q.data;

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
      <p>振り返るセットを選びましょう。</p>
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
    </main>
  );
}
