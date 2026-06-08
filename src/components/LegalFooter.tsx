import { LEGAL_ROUTES } from '../features/legal/content.js';

/**
 * 全ページ常設の法務リンクフッタ（O55 ルート到達性: /legal/* を orphaned にしない）。
 */
export function LegalFooter() {
  return (
    <footer aria-label="法務情報">
      <nav>
        <a href={LEGAL_ROUTES.privacy}>プライバシーポリシー</a>
        <a href={LEGAL_ROUTES.terms}>利用規約</a>
        <a href={LEGAL_ROUTES.sct}>特定商取引法に基づく表記</a>
      </nav>
    </footer>
  );
}
