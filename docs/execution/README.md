# execution

時間ベース実行フロー（開始/終了/一時停止/再開、タイムスタンプ記録、今日メモ）

## このフォルダに置くドキュメント

- `001_execution_SPEC.md` — 仕様書（`/flow:feature` で生成）
- `002_execution_PLAN.md` — 実装計画書
- `003_execution_UNIT_TEST.md` — 単体テスト計画
- `004_execution_E2E_TEST.md` — E2E テスト計画
- `estimate_YYYYMMDD.md` — 機能単位見積もり（`/flow:estimate`）

## 関連

- 概念設計: `../concept.md` §1.3.1
- 全体見積: `../estimates/`
- 実装コード対応: `src/features/execution/`（§1.4 参照）
- 依存: activity-sets, _shared/local-sync, _shared/db, _shared/auth
- 優先度: 4 ／ 基盤: ✅
