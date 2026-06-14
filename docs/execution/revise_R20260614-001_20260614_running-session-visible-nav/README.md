# 改修: 計時中セッションの可視化と導線確立（中間ページ撤去 + 幽霊セッション根絶）

- **issue / slug**: R20260614-001 / running-session-visible-nav
- **実施日**: 2026-06-14
- **対象機能**: ../README.md (execution) + activity-sets (SetListPage) + App.tsx routing
- **基準 SPEC**: ../001_execution_SPEC.md
- **改修要望**: セット詳細から「実行する」→次ページで「開始/継続を見る」を選ぶ二段構えは UX が悪い。セット詳細から「開始」で即開始する。加えて、計時中に他画面へ移ると進行中セッションへアクセス・停止する導線が無く（幽霊化して危険）、同じセットを二重に開始できてしまう。計時中はセット一覧で「進行中」と表示し、進行中セットを選ぶと活動画面へ戻れるようにする。
- **タグ**: auth-required（owner-scoped）、stateful（進行中セッション）、offline-critical（local-first）
- **状態**: 設計中

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画書
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- `101_REVISE_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`、実装後）

## 関連

- 過去の改修: ../revise_R20260611-001_.../（進行中セッション永続/復帰）, ../revise_R20260613-004_.../（セット合計表示）
- 基準 SPEC: ../001_execution_SPEC.md
