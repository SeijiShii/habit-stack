# 改修: 振り返り総覧 + 連続日数の正確化

- **issue / slug**: R20260613-001 / reflect-overview-streak-fix
- **実施日**: 2026-06-13
- **対象機能**: ../README.md
- **基準 SPEC**: ../001_streak-summary_SPEC.md
- **改修要望**:
  1. セット画面からナビ「継続」で `/summary` に遷移すると「セットを選択してください」相当の文言のみで選択 UI がない → ドロップダウン追加
  2. 「〇日つづいています」が不正確（2 日続いているのに 1 日表示）→ UTC 日付記録が原因、ローカル日付に是正 + today-pending 許容
  3. ふりかえり画面でセットと活動内容を折りたたみ UI で一覧、セット内合計時間を表示
- **状態**: 設計完了

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画書（4 Phase）
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- `005_REVISE_MIGRATION.md` — 達成日のローカル日付再構築（クライアント内）
- `101_REVISE_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`）

## 関連

- 過去の改修: ../revise_O31_20260609_share-button/
- 実装前レビュー: `/flow:spec-review` 推奨
