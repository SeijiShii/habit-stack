# _shared/legal 実装計画書

> **入力**: `./001__shared_legal_SPEC.md`, `../../concept.md` §9
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `src/features/legal/PrivacyPage.tsx` | プラポリ（O54 ゲスト削除文言含む） | — | 90 |
| `src/features/legal/TermsPage.tsx` | 利用規約 | — | 70 |
| `src/features/legal/SctPage.tsx` | 特商法表記 | — | 60 |
| `src/features/legal/content/*.ts` | 文面（差し替え可） | — | 120 |
| `src/features/legal/consent.ts` | 同意記録 | auth | 40 |
| `src/components/LegalFooter.tsx` | フッタ常設リンク（O55） | — | 30 |

## 2. 実装 Phase 分割
### Phase 1: 文面 content + 3 ページ
- 静的レンダリング。O54 文言をプラポリに必ず含める。
- テスト: 各ページが必須項目（取得項目/第三者提供/ゲスト削除/準拠法/特商法項目）を含むこと（text assert）。
### Phase 2: フッタ導線 + 同意記録
- LegalFooter を app-shell に組み込み（O55 到達性）。consent 記録。
- テスト: 3 リンク存在、同意でタイムスタンプ保存。

## 3. 依存関係順序
```
content → 3 ページ → consent(auth) → LegalFooter(app-shell が組込)
```

## 4. 既存ファイルへの影響
- app-shell がルート定義 + フッタ配置（feature 実装時に配線）。

## 5. 横断フォルダへの追加・変更
- _shared/auth: deleteAllData の説明導線、consent 記録。

## 6. リスク・注意点
- O55: /legal/* に必ず inbound link（フッタ常設）。orphaned page にしない。
- 特商法の販売者情報は seiji 確定後に差し替え（ドラフトは雛形）。
- デザイン: design-system トークン準拠（読みやすさ優先）。

## 7. 完了の定義
- [ ] 3 ページ実装 + 必須項目 text assert green
- [ ] O54 ゲスト削除文言をプラポリに含む
- [ ] フッタ常設リンク（O55 到達性）
- [ ] 同意記録
- [ ] E2E ルート到達性は feature/app-shell 側でカバー

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
