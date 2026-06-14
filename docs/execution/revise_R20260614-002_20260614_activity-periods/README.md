# 改修: 活動を 1:N period モデルにして中断時間を経過から除外

- **issue / slug**: R20260614-002 / activity-periods
- **実施日**: 2026-06-14
- **対象機能**: ../README.md (execution)
- **基準 SPEC**: ../001_execution_SPEC.md
- **改修要望（origin: claim C20260614-001）**: 活動 A を一時停止して同じ活動を再開せず次の活動 B に移行したとき、中断していた時間も活動 A の経過に計上されてしまう。1 活動が複数の計時区間（period）を 1:N・無制限に持てるようにし、中断区間が経過から差し引かれるようにする。活動画面の開始時刻表示は最初の開始時刻のみ（妥協）。
- **状態**: 設計中
- **タグ**: stateful, offline-critical（local-first, IndexedDB 構造正本）

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後 / データモデル変更）
- `002_REVISE_PLAN.md` — 変更計画書（既存ファイル変更一覧 / Phase 分割）
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- `005_REVISE_MIGRATION.md` — マイグレーション計画（任意・additive）
- `101_REVISE_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`、実装後）

## 関連

- クレーム起点: `../claim_C20260614-001_20260614_pause-time-counted/`
- 過去の改修: ../revise_R20260611-001_.../（永続・復帰）, ../revise_R20260613-004_.../（セット合計表示）
- 基準 SPEC: ../001_execution_SPEC.md
