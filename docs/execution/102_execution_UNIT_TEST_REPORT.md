# 単体テストレポート: execution

## 実施日時
2026-06-08 19:12 (JST)

## テスト実行環境
- Node v22.11.0 / Vitest 2.1.9 / fake-indexeddb / happy-dom + testing-library / TS 5.7 green

## テスト結果（抜粋）
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| N6 | elapsed = 差分 - pause | executionMachine.test.ts | ✅ |
| E1 | 端末時計戻り 0 クランプ | executionMachine.test.ts | ✅ |
| N1 | start running+先頭 record | executionMachine.test.ts | ✅ |
| N2 | endItem→next 経過確定 | executionMachine.test.ts | ✅ |
| N3 | pause→resume pause 除外 | executionMachine.test.ts | ✅ |
| N4/N5 | 最終で done | executionMachine.test.ts | ✅ |
| - | endSession done | executionMachine.test.ts | ✅ |
| B3 | 穴あき 1 アイテムで達成 | executionMachine.test.ts | ✅ |
| B2 | 全実行で count=全件 | executionMachine.test.ts | ✅ |
| N7 | persist + 穴あき達成 upsert | executionRepo.test.ts | ✅ |
| B2 | 全実行 itemDoneCount | executionRepo.test.ts | ✅ |
| E3 | findInProgress 復元 | executionRepo.test.ts | ✅ |
| - | localDate | executionRepo.test.ts | ✅ |
| UC4 | 開始→次へ→終了→達成 | ExecutionPage.test.tsx | ✅ |
| UC5 | メモ入力 | ExecutionPage.test.tsx | ✅ |

## サマリー
| 項目 | 値 |
|---|---|
| 計画 | 15 |
| 追加 | 0 |
| 合計 | 15（プロジェクト累計 87） |
| 成功率 | 100% |
