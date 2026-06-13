# 単体テストレポート: _shared/app-shell R20260613-002

## 実施日時
2026-06-13 17:38 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md] - 単体テスト計画

## テスト実行環境
- ランタイム: Node + Vitest 2.1.9（happy-dom）
- React Testing Library

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| U1 | BrandLogo: SVG を描画 | src/components/BrandLogo.test.tsx | ✅ | |
| U2 | BrandLogo: size で width/height 反映 | src/components/BrandLogo.test.tsx | ✅ | |
| U6 | BrandLogo: aria-hidden=true | src/components/BrandLogo.test.tsx | ✅ | 装飾要素 |
| U3/U4 | AppLayout: ホームリンクにロゴ + aria-label | src/app/App.test.tsx（既存 7 件） | ✅ | 既存 nav/heading テストが green を維持（href・h1 基準で nav リンク内容変更の影響なし） |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| U1/U2/U6 | BrandLogo | 上記 3 件 | 新規コンポーネントのカバー |

> U5（brand-name の DOM 存在）・U7（狭幅縮退）は CSS 挙動のため jsdom/happy-dom では検証せず E2E（viewport）に委譲（004 §1 E1/E2）。

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数 | 5（U1-U7 のうち jsdom 検証対象） |
| 追加テスト数 | 3（BrandLogo） |
| 合計（全スイート） | 200 |
| 成功 | 200 |
| 失敗 | 0 |
| 成功率 | 100% |
