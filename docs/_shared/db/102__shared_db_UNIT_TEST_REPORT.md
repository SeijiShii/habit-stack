# 単体テストレポート: _shared/db

## 実施日時
2026-06-08 18:15 (JST)

## 関連ドキュメント
- 003__shared_db_UNIT_TEST.md（計画）

## テスト実行環境
- Node.js: v22.11.0
- Vitest: 2.1.9
- TypeScript: 5.7（typecheck green）

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|---|---|---|---|
| N1 | time_of_day 4 値 | db/schema.test.ts | ✅ | |
| N2 | session_status 3 値 | db/schema.test.ts | ✅ | |
| - | activity_sets 必須列 | db/schema.test.ts | ✅ | |
| N4 | execution_records 経過/メモ/同期メタ列 | db/schema.test.ts | ✅ | |
| - | daily_achievements 達成/穴あき列 | db/schema.test.ts | ✅ | |
| B3 | 全テーブル owner_id | db/schema.test.ts | ✅ | SEC-001 |
| B1 | (owner_id,client_local_id) unique | db/schema.test.ts | ✅ | 冪等同期 |
| B2 | (owner_id,set_id,date) unique | db/schema.test.ts | ✅ | |
| - | owner index 定義 | db/schema.test.ts | ✅ | |
| N3/N4 | 型推論 shape | db/schema.test.ts | ✅ | |
| E1 | 空 URL で明示エラー | db/client.test.ts | ✅ | |
| N5 | 有効 URL で drizzle 返す | db/client.test.ts | ✅ | 接続遅延 |

## 追加テストケース
追加テストケースなし（計画どおり）。

## サマリー

| 項目 | 値 |
|---|---|
| 計画テスト数 | 12 |
| 追加テスト数 | 0 |
| 合計 | 12 |
| 成功 | 12 |
| 失敗 | 0 |
| 成功率 | 100% |
