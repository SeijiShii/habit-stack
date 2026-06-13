import type { Activity } from "./model/activities.js";
import {
  formatDuration,
  formatDateLabel,
} from "../../services/time/localDate.js";

/**
 * 「活動の記録」テーブル（R20260614、1回の活動=セッション単位）。
 * 各行は閉じた状態で日付＋合計時間。開くと item 別の経過時間とメモが見える。
 */
export function ActivityTable({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return null;
  return (
    <section aria-label="活動の記録">
      <h2>活動の記録</h2>
      {activities.map((a) => (
        <details key={a.sessionId} role="group">
          <summary>
            {formatDateLabel(a.startedAt)}{" "}
            <span data-testid={`activity-total-${a.sessionId}`}>
              合計 {formatDuration(a.totalSec)}
            </span>
          </summary>
          <ul>
            {a.records.map((r) => (
              <li key={r.itemId}>
                {r.itemName}（{formatDuration(r.elapsedSec)}）
                {r.note && <span>「{r.note}」</span>}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </section>
  );
}

/** 継続率を穏やかなバーで表示（煽らない）。 */
export function RateGauge({
  rate,
  achievedDays,
  totalDays,
}: {
  rate: number;
  achievedDays: number;
  totalDays: number;
}) {
  const pct = Math.round(rate * 100);
  return (
    <div aria-label="継続率">
      <p>
        <strong>{pct}%</strong>（{totalDays} 日中 {achievedDays} 日）
      </p>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: 8,
          borderRadius: 4,
          background: "var(--color-surface-sunken, #F2EFE8)",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 4,
            background: "var(--color-primary, #3F7A6E)",
          }}
        />
      </div>
    </div>
  );
}
