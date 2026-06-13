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
