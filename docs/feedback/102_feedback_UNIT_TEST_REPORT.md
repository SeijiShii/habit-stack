# 単体テストレポート: feedback

## 実施日時
2026-06-08 19:16 (JST)

## テスト実行環境
- Node v22.11.0 / Vitest 2.1.9 / happy-dom + testing-library / TS 5.7 green

## テスト結果
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| N1 | scrubPii メール | feedback.test.tsx | ✅ |
| N2 | scrubPii 電話/位置 | feedback.test.tsx | ✅ |
| B2 | 複数メール全マスク | feedback.test.tsx | ✅ |
| - | scrubObject ネスト | feedback.test.tsx | ✅ |
| N3 | client context+scrub+送信 | feedback.test.tsx | ✅ |
| E1 | client 失敗 degrade | feedback.test.tsx | ✅ |
| N5 | Widget 1タップ→送信→お礼 | feedback.test.tsx | ✅ |
| E2 | handleFeedback 202 degrade | feedback.test.tsx | ✅ |

## サマリー
| 項目 | 値 |
|---|---|
| 計画 | 8 |
| 追加 | 0 |
| 合計 | 8（プロジェクト累計 95） |
| 成功率 | 100%（3 回連続安定） |
