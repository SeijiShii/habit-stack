/**
 * ブランドロゴ（favicon.svg と同じ「積み上がるブロック + 達成の点」モチーフ）。
 * ヘッダのアプリ名の左に置く装飾要素。アプリ名はリンクの aria-label が担うため aria-hidden。
 */
export function BrandLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className="brand-logo"
    >
      <rect x="16" y="40" width="32" height="10" rx="3" fill="var(--color-primary, #3F7A6E)" />
      <rect x="20" y="28" width="24" height="10" rx="3" fill="var(--color-primary, #3F7A6E)" opacity="0.85" />
      <rect x="24" y="16" width="16" height="10" rx="3" fill="var(--color-primary, #3F7A6E)" opacity="0.7" />
      <circle cx="32" cy="12" r="3.2" fill="var(--color-accent, #E8A23D)" />
    </svg>
  );
}
