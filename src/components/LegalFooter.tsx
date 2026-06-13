import { LEGAL_ROUTES } from "../features/legal/content.js";
import { SHOWCASE_URL } from "../config/showcase.js";

/**
 * 全ページ常設のフッタ。法務リンク（O55 ルート到達性: /legal/* を orphaned にしない）+
 * 姉妹サービスへの「他のアプリ」back-link（O62 相互送客 → shipyard / givers.work）。
 */
export function LegalFooter() {
  return (
    <footer aria-label="フッター">
      <nav aria-label="法務情報">
        <a href={LEGAL_ROUTES.privacy}>プライバシーポリシー</a>
        <a href={LEGAL_ROUTES.terms}>利用規約</a>
        <a href={LEGAL_ROUTES.sct}>特定商取引法に基づく表記</a>
      </nav>
      <nav aria-label="ほかのサービス">
        <a href={SHOWCASE_URL} target="_blank" rel="noopener noreferrer">
          他のアプリ
        </a>
      </nav>
    </footer>
  );
}
