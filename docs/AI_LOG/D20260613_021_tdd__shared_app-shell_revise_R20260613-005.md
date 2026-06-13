# AI_LOG — /flow:tdd + /flow:e2e _shared/app-shell revise R20260613-005（「他のアプリ」back-link）

- **実行日時**: 2026-06-13（JST）
- **コマンド**: /flow:tdd（revise）+ /flow:e2e（同セッションで実施）
- **対象**: _shared/app-shell / R20260613-005（other-apps-backlink）
- **実行者**: seiji + Claude
- **状態**: 完了（unit 209 + E2E 19 green）
- **含まれる decision 範囲**: 実装 / footer aria 整理 / E2E

## 主要決定サマリ

| decision_id | テーマ | chosen | type |
|---|---|---|---|
| D20260613-071 | 実装 | SHOWCASE_URL 定数 + LegalFooter に「他のアプリ」外部リンク追加。unit 209 green | auto-recommended |
| D20260613-072 | footer aria 整理 | footer aria-label を「法務情報」→「フッター」、法務リンクを inner nav「法務情報」、新規 nav「ほかのサービス」。App.test は textContent 基準で無改修 green | auto-recommended |
| D20260613-073 | E2E | footer-backlink.spec.ts（href/target/rel + 法務残存）。全 19 E2E green | auto-recommended |

## 依存関係
- depends_on: D20260613_020（revise 設計）/ O62 / CF-20260613-001

## 生成・更新したアーティファクト
- src/config/showcase.ts（新規）+ src/components/LegalFooter.tsx + LegalFooter.test.tsx（新規）
- e2e/footer-backlink.spec.ts（新規 2 件）
- 101/102/103 + revise INDEX（テスト完了）+ app-shell INDEX 行

## 学習・改善
- O62 の required_signals は実リンクテキスト「他のアプリ」。実装でこの文言を使い audit #4（forcing-function 化済）で確実に検出される状態にした。

## Decisions

```yaml
- id: D20260613-071
  timestamp: 2026-06-13T19:05:00+09:00
  command: /flow:tdd
  phase: Step 4-5 実装
  question: 実装方式
  options: [LegalFooter に追加 + 定数集約]
  recommended: SHOWCASE_URL 定数 + LegalFooter「他のアプリ」外部リンク
  chosen: 実装、unit 209 green、typecheck clean
  chosen_type: auto-recommended
  depends_on: [D20260613_020]
  context: 外部リンク target=_blank/rel=noopener、文言「他のアプリ」(O62 required_signals)

- id: D20260613-072
  timestamp: 2026-06-13T19:05:30+09:00
  command: /flow:tdd
  phase: Step 5 footer 構造
  question: footer aria-label をどうするか（法務 + 他のアプリの 2 nav）
  options: [法務情報のまま, フッターに変更 + inner nav 分割]
  recommended: フッターに変更 + inner nav（法務情報 / ほかのサービス）
  chosen: footer=「フッター」+ inner nav 2 つ。App.test は textContent 基準で無改修 green
  chosen_type: auto-recommended
  depends_on: [D20260613-071]
  context: 2 種のリンク群を意味的に分離

- id: D20260613-073
  timestamp: 2026-06-13T19:08:00+09:00
  command: /flow:e2e
  phase: E2E
  question: footer back-link の E2E
  options: [属性検証, 外部実遷移]
  recommended: 属性検証（外部サイト依存の実遷移は踏まない）
  chosen: footer-backlink.spec.ts（href/target/rel + 法務残存）、全 19 E2E green
  chosen_type: auto-recommended
  depends_on: [D20260613-071]
  context: 外部サイト givers.work への実遷移は E2E 対象外
```
