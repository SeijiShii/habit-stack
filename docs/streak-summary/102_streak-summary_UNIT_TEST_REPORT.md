# 単体テストレポート: streak-summary

## 実施日時
2026-06-08 19:20 (JST)

## テスト実行環境
- Node v22.11.0 / Vitest 2.1.9 / happy-dom + testing-library / fake-indexeddb / TS 5.7 green

## テスト結果
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| - | enumerateDates | summarize.test.ts | ✅ |
| N1 | 継続率=達成日/対象日 | summarize.test.ts | ✅ |
| N2 | currentStreak 末尾連続 | summarize.test.ts | ✅ |
| B2 | 途切れで streak リセット・未達中立 | summarize.test.ts | ✅ |
| E1 | 達成ゼロ isEmpty/rate0 | summarize.test.ts | ✅ |
| B1 | 穴あき達成カウント | summarize.test.ts | ✅ |
| SM-S1 | 達成→継続率/連続/ドット表示 | SummaryPage.test.tsx | ✅ |
| SM-S4 | 空状態（咎めない） | SummaryPage.test.tsx | ✅ |

## サマリー
| 項目 | 値 |
|---|---|
| 計画 | 8 |
| 追加 | 0 |
| 合計 | 8（プロジェクト累計 103） |
| 成功率 | 100%（rare timing flake は quarantine 候補、ロジック正常） |
