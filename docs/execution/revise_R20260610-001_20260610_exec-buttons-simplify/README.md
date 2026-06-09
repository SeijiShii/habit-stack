# 改修: 実行画面ボタンの簡素化（終了ボタン削除 + 「次の活動へ」表記統一）

- **issue / slug**: R20260610-001 / exec-buttons-simplify
- **実施日**: 2026-06-10
- **対象機能**: ../README.md (execution)
- **基準 SPEC**: ../001_execution_SPEC.md
- **改修要望**:
  - 活動の「終了」ボタンは意味が曖昧なので削除する（一時停止と「次の活動へ」で必要十分）。
  - 「次へ」と「次を開始」で表記ゆれしているので「次の活動へ」に統一する。
- **状態**: 設計完了

## このフォルダに置くドキュメント

- `001_REVISE_SPEC.md` — 変更仕様書（変更前 vs 変更後）
- `002_REVISE_PLAN.md` — 変更計画書
- `003_REVISE_UNIT_TEST.md` — 単体テスト計画
- `004_REVISE_E2E_TEST.md` — E2E テスト計画
- （マイグレーション不要 = 005 なし）

## 関連

- 過去の改修: なし（execution 初の revise）
- 関連 fix: ../fix_C20260610-001_20260610_timer-frozen-display/（同画面の表示 fix）
