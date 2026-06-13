import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SummaryRepo } from "./model/summaryRepo.js";
import { summarize, enumerateDates } from "./model/summarize.js";
import { RateGauge } from "./components.js";
import { ShareButton } from "./ShareButton.js";
import { localDateOf } from "../../services/time/localDate.js";

const SHARE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://habit-stack.givers.work";
const SHARE_TEXT =
  "続けたい習慣を、時間で記録して穏やかに振り返るアプリ。よかったら使ってみてください。";

export interface SummaryPageProps {
  repo: SummaryRepo;
  setId: string;
  setName: string;
  /** 今日（YYYY-MM-DD）。テスト用に注入可。 */
  today?: string;
}

const PERIODS = [
  { key: 7, label: "7日" },
  { key: 30, label: "30日" },
] as const;

function rangeFor(today: string, days: number): { start: string; end: string } {
  const d = new Date(`${today}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return { start: d.toISOString().slice(0, 10), end: today };
}

export function SummaryPage({ repo, setId, setName, today }: SummaryPageProps) {
  const todayStr = today ?? localDateOf(new Date());
  const [days, setDays] = useState<number>(7);
  const { start, end } = useMemo(
    () => rangeFor(todayStr, days),
    [todayStr, days],
  );

  const q = useQuery({
    queryKey: ["summary", setId, start, end],
    queryFn: () => repo.getAchievements(setId, start, end),
  });

  const summary = useMemo(
    () => summarize(q.data ?? [], enumerateDates(start, end)),
    [q.data, start, end],
  );

  return (
    <main aria-labelledby="summary-title">
      <h1 id="summary-title">{setName} の継続</h1>

      <div role="group" aria-label="期間">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={days === p.key}
            onClick={() => setDays(p.key)}
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

      <ShareButton url={SHARE_URL} defaultText={SHARE_TEXT} />
    </main>
  );
}
