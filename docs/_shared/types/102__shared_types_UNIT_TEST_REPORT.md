# 単体テストレポート: _shared/types

## 実施日時
2026-06-08 18:18 (JST)

## テスト実行環境
- Node v22.11.0 / Vitest 2.1.9 / TypeScript 5.7（typecheck green）

## テスト結果
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| N1 | TIME_OF_DAY 4 値 | domain.test.ts | ✅ |
| N2 | SESSION_STATUS 3 値 | domain.test.ts | ✅ |
| E1 | asOwnerId branded | domain.test.ts | ✅ |
| N4 | SyncEnvelope<ActivitySet> shape | domain.test.ts | ✅ |
| N5 | ContinuationRate | domain.test.ts | ✅ |
| - | TimeOfDay union 一致 | domain.test.ts | ✅ |

## 追加テストケース
なし。

## サマリー
| 項目 | 値 |
|---|---|
| 計画 | 6 |
| 追加 | 0 |
| 合計 | 6（プロジェクト累計 18） |
| 成功 | 6 |
| 失敗 | 0 |
| 成功率 | 100% |
