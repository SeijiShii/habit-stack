import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LegalFooter } from "./LegalFooter.js";
import { BrandLogo } from "./BrandLogo.js";

/** 入口の「これは何？」リード文（O41、冷たいリンク流入者向け）。 */
function WhatIsThis() {
  return (
    <p data-testid="lead">続けたい習慣を時間で記録して、振り返るアプリです。</p>
  );
}

/**
 * グローバルレイアウト。ナビ + 入口リード(O41) + フッタ法務リンク(O55) + フィードバック導線(O40)。
 */
export function AppLayout({
  children,
  feedbackSlot,
}: {
  children: ReactNode;
  feedbackSlot?: ReactNode;
}) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div>
      <header>
        <nav aria-label="メイン">
          <Link
            to="/"
            className="brand-link"
            aria-label="つみあげルーティン（ホーム）"
          >
            <BrandLogo />
            <span className="brand-name">つみあげルーティン</span>
          </Link>
          <Link to="/sets">セット</Link>
          <Link to="/summary">継続</Link>
          <Link to="/account">アカウント</Link>
          <button
            type="button"
            aria-label="これは何？"
            onClick={() => setShowInfo((v) => !v)}
          >
            ?
          </button>
        </nav>
        <WhatIsThis />
        {showInfo && (
          <aside role="dialog" aria-label="これは何？">
            <p>
              筋トレ・語学・読書などの習慣を活動セットにまとめ、開始→終了の時間ベースで記録します。
              何日続けられたかを振り返れます。ログインなしで今すぐ始められます。
            </p>
          </aside>
        )}
      </header>
      {children}
      {feedbackSlot}
      <LegalFooter />
    </div>
  );
}
