# AI_LOG — /flow:tdd _shared/app-shell revise R20260613-002（タイトル左ロゴ + 幅不足時ロゴのみ）

- **実行日時**: 2026-06-13（JST）
- **コマンド**: /flow:tdd（revise モード、/flow:auto P4.2 から dispatch）
- **対象**: _shared/app-shell / R20260613-002（title-logo）
- **実行者**: seiji + Claude
- **状態**: 完了
- **含まれる decision 範囲**: テスト環境 / Phase 軽重判定 / 全テスト結果 / feedback skip

## 主要決定サマリ

| decision_id | テーマ | chosen | type |
|---|---|---|---|
| D20260613-041 | Phase 軽重 + 実装 | Phase 1（BrandLogo）/ Phase 2（AppLayout+CSS）とも軽=メイン直接。unit 200/200 green、typecheck clean | auto-recommended |
| D20260613-042 | App.test 改修要否 | 不要（既存は h1 heading / href 基準で nav リンク内容に非依存、span 維持で無改修 green）= 計画 M1 を省略 | auto-recommended |
| D20260613-043 | feedback skip | 軽微な UI 追加（SVG + リンク配線 + CSS）で潜在バグ面が小さいため /flow:feedback は skip（auto loop の次対象優先） | auto-recommended |

## 依存関係
- depends_on: D20260613_006（revise 設計）/ D20260613-040（auto P4.2 dispatch）

## 生成・更新したアーティファクト
- src/components/BrandLogo.tsx（新規）+ BrandLogo.test.tsx（新規 3 件）
- src/components/AppLayout.tsx（ホームリンク改修）+ src/styles/theme.css（brand スタイル + 縮退）
- 101_REVISE_IMPL_REPORT.md / 102_REVISE_UNIT_TEST_REPORT.md
- revise INDEX（実装完了）+ app-shell INDEX 行更新

## 学習・改善
- 既存テストが UI 要素をテキスト一致でなく role/href で参照していたため、nav リンクの内容変更（テキスト→ロゴ+span）が無改修で通った。表示層改修では「テスト側が何で要素を掴んでいるか」を先に確認すると改修コストを正しく見積もれる。

## Decisions

```yaml
- id: D20260613-041
  timestamp: 2026-06-13T17:38:00+09:00
  command: /flow:tdd
  phase: Step 4-5 Phase 軽重 + 実装
  question: Phase 構成と実装方法
  options: [両 Phase 軽=メイン直接, サブスキル委託]
  recommended: 両 Phase 軽（≤2 ファイル + 機械的）=メイン直接
  chosen: メイン直接実装、unit 200/200 green
  chosen_type: auto-recommended
  depends_on: [D20260613_006]
  context: Phase1=BrandLogo新規+test / Phase2=AppLayout編集+theme.css。typecheck clean

- id: D20260613-042
  timestamp: 2026-06-13T17:38:30+09:00
  command: /flow:tdd
  phase: Step 5 既存テスト追随
  question: App.test の nav リンク参照を改修するか（計画 M1）
  options: [aria-label 基準へ改修, 無改修で確認]
  recommended: 無改修で確認（既存は h1/href 基準）
  chosen: 無改修（既存 7 件 green 維持）
  chosen_type: auto-recommended
  depends_on: [D20260613-041]
  context: nav ホームリンクのテキスト一致に依存するテストは無かった

- id: D20260613-043
  timestamp: 2026-06-13T17:39:00+09:00
  command: /flow:tdd
  phase: Step 12 feedback 起動判断
  question: /flow:feedback を起動するか
  options: [起動, skip]
  recommended: skip（軽微 UI 追加でバグ面小、auto loop の次対象優先）
  chosen: skip
  chosen_type: auto-recommended
  depends_on: [D20260613-041]
  context: SVG + リンク配線 + CSS のみ。E2E gate（P4.5）で視覚/挙動を別途検証
```
