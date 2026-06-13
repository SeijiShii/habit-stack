# 改修: アプリタイトル左にロゴ表示 + 幅不足時ロゴのみ

- **issue / slug**: R20260613-002 / title-logo
- **実施日**: 2026-06-13
- **対象機能**: ../README.md (_shared/app-shell)
- **基準 SPEC**: ../001__shared_app-shell_SPEC.md
- **改修要望**: アプリタイトルが表示幅が狭いせいでエリプシスになっている。タイトル左にロゴを表示し、タイトルの表示幅が確保できないときはロゴだけを表示する。
- **状態**: 設計中

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画書
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- `101_REVISE_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`、実装後）

## 関連

- 過去の改修: ../claim_C20260609-001_unstyled-ui/
- 関連 UI 改修バッチ（同日）: streak-summary R20260613-003 / execution R20260613-004
