# 改修: 計時状態の永続化・復帰（タブ切替/スリープ耐性 + 4H放置キャップ）

- **issue / slug**: R20260611-001 / timing-persistence-resume
- **実施日**: 2026-06-11
- **対象機能**: ../README.md
- **基準 SPEC**: ../001_execution_SPEC.md
- **改修要望**:
  - ブラウザタブ切替・端末スリープ後のリロードで計時中のセット/活動データが消える問題を解消する
  - localStorage は毎秒、バックエンドは15秒ごとに永続化（account-scoped）
  - アカウント切替を想定し owner と紐づける
  - 1活動の最大時間は 4H
  - 復帰時に計時中の活動があり、最終保存時刻から 4H 経過していれば、保存時刻をもって活動・セットを終了する（「口が開いたまま」放置対策）
- **状態**: 設計完了 → 実装待ち

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画書（ファイル変更 + 新規）
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- `005_REVISE_MIGRATION.md` — マイグレーション計画（last_saved_at 列追加）
- `101_REVISE_IMPL_REPORT.md` — 実装レポート（`/flow:tdd`、未生成）

## 重要な前提（要望の再確認）

「リロードでデータが消える」は正確には *消えていない*。`ExecutionRepo.persist()` が遷移ごとに IndexedDB へ全状態を保存済みで、経過はタイムスタンプ差分算出。真因は **(1) マウント時の復元が未配線**（`App.tsx` が毎回 fresh `sessionLocalId` 採番し `findInProgress()` を呼ばない）と **(2) 進行中セッションの定期バックエンド push が不在**（`useSync` はマウント/online 時のみ）。本改修はこの2点の修復 + 毎秒/15秒の永続化 + 4H 放置キャップを行う。

## 関連
- 過去の改修: ../revise_R20260610-001_20260610_exec-buttons-simplify/
- 起点 AI_LOG: ../../AI_LOG/D20260611_001_revise_execution_R20260611-001.md
- 高度モデルレビュー: `/flow:spec-review` 推奨
