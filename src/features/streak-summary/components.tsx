import type { Dot } from './model/summarize.js';

/**
 * 達成日ドット（達成 = accent、未達 = 空ドット・中立）。
 * 未達を danger 色にしない（罪悪感回避、[論点-001] / charter §2.2）。
 */
export function AchievementDots({ dots }: { dots: Dot[] }) {
  return (
    <ul aria-label="達成日" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, listStyle: 'none', padding: 0 }}>
      {dots.map((d) => (
        <li
          key={d.date}
          data-achieved={d.achieved}
          title={d.date}
          aria-label={`${d.date} ${d.achieved ? '達成' : '未達'}`}
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            background: d.achieved ? 'var(--color-accent, #E8A23D)' : 'transparent',
            border: d.achieved ? 'none' : '1px solid var(--color-border, #E3DFD6)',
          }}
        />
      ))}
    </ul>
  );
}

/** 継続率を穏やかなバーで表示（煽らない）。 */
export function RateGauge({ rate, achievedDays, totalDays }: { rate: number; achievedDays: number; totalDays: number }) {
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
        style={{ height: 8, borderRadius: 4, background: 'var(--color-surface-sunken, #F2EFE8)' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 4,
            background: 'var(--color-primary, #3F7A6E)',
          }}
        />
      </div>
    </div>
  );
}
