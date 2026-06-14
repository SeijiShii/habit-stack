import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SummaryRepo } from "./model/summaryRepo.js";
import { summarize, enumerateDates } from "./model/summarize.js";
import { RateGauge, ActivityTable } from "./components.js";
import { ShareButton } from "./ShareButton.js";
import { localDateOf } from "../../services/time/localDate.js";

const SHARE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://habit-stack.givers.work";
const SHARE_TEXT =
  "続けたい習慣を、時間で記録して穏やかに振り返るアプリ。よかったら使ってみてください。";

/** ドロップダウン用のセット最小契約。 */
export interface SummarySetsRepo {
  listSets(): Promise<{ id: string; name: unknown }[]>;
}

export interface SummaryPageProps {
  repo: SummaryRepo;
  setId: string;
  setName: string;
  /** セット切替ドロップダウン用（省略時はドロップダウン非表示）。 */
  setsRepo?: SummarySetsRepo;
  /** ドロップダウンで別セットを選んだとき（同ページでセット切替）。 */
  onSelectSet?: (setId: string) => void;
  /** 今日（YYYY-MM-DD）。テスト用に注入可。 */
  today?: string;
}

const PERIODS = [
  { key: "7", label: "7日" },
  { key: "30", label: "30日" },
  { key: "all", label: "全期間" },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

/** 活動の記録の 1 ページあたり最大行数（R20260614）。 */
const PAGE_SIZE = 10;

function rangeFor(today: string, days: number): { start: string; end: string } {
  const d = new Date(`${today}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return { start: d.toISOString().slice(0, 10), end: today };
}

export function SummaryPage({
  repo,
  setId,
  setName,
  setsRepo,
  onSelectSet,
  today,
}: SummaryPageProps) {
  const todayStr = today ?? localDateOf(new Date());
  const [period, setPeriod] = useState<PeriodKey>("7");
  // 活動の記録は 10 件/ページでページネーション（R20260614）。セット切替で先頭へ戻す。
  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0);
  }, [setId]);

  const q = useQuery({
    queryKey: ["summary-detail", setId],
    queryFn: async () => {
      const [achievements, activities, sets] = await Promise.all([
        repo.getAllAchievements(setId),
        repo.getActivities(setId),
        setsRepo ? setsRepo.listSets() : Promise.resolve([]),
      ]);
      return { achievements, activities, sets };
    },
  });

  const achievements = q.data?.achievements ?? [];

  // 期間レンジ。全期間は最古の達成日 → 今日（達成ゼロなら今日のみ）。
  const { start, end } = useMemo(() => {
    if (period === "all") {
      const earliest = achievements.length
        ? achievements.reduce((m, a) => (a.date < m ? a.date : m), todayStr)
        : todayStr;
      return { start: earliest, end: todayStr };
    }
    return rangeFor(todayStr, period === "7" ? 7 : 30);
  }, [period, achievements, todayStr]);

  const summary = useMemo(
    () => summarize(achievements, enumerateDates(start, end)),
    [achievements, start, end],
  );

  return (
    <main aria-labelledby="summary-title">
      <h1 id="summary-title">ふりかえり</h1>
      {!setsRepo && <p>{setName}</p>}

      {setsRepo && q.data && q.data.sets.length > 0 && (
        <p>
          <label>
            セットを選ぶ
            <select
              aria-label="セットを選ぶ"
              value={setId}
              onChange={(e) => {
                if (e.target.value && e.target.value !== setId) {
                  onSelectSet?.(e.target.value);
                }
              }}
            >
              {q.data.sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {String(s.name)}
                </option>
              ))}
            </select>
          </label>
        </p>
      )}

      <div role="group" aria-label="期間">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={period === p.key}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {summary.isEmpty ? (
        <p>まだ記録がありません。ひとつから始めましょう。</p>
      ) : (
        <>
          <RateGauge
            rate={summary.rate}
            achievedDays={summary.achievedDays}
            totalDays={summary.totalDays}
          />
          <p data-testid="streak">{summary.currentStreak}日つづいています</p>
        </>
      )}

      {(() => {
        const activities = q.data?.activities ?? [];
        const pageCount = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
        const cur = Math.min(page, pageCount - 1);
        const pageItems = activities.slice(
          cur * PAGE_SIZE,
          cur * PAGE_SIZE + PAGE_SIZE,
        );
        return (
          <>
            <ActivityTable activities={pageItems} />
            {activities.length > PAGE_SIZE && (
              <nav
                aria-label="活動の記録ページ"
                style={{ display: "flex", gap: 12, alignItems: "center" }}
              >
                <button
                  type="button"
                  disabled={cur <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  前へ
                </button>
                <span data-testid="page-indicator">
                  {cur + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={cur >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  次へ
                </button>
              </nav>
            )}
          </>
        );
      })()}

      <ShareButton url={SHARE_URL} defaultText={SHARE_TEXT} />
    </main>
  );
}
