# 単体テストレポート: streak-summary R20260613-003

## 実施日時
2026-06-13 17:42 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md] - 単体テスト計画

## テスト実行環境
- Vitest 2.1.9（happy-dom）+ React Testing Library

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| U1 | summarize が dots を返さない | model/summarize.test.ts（既存スイート） | ✅ | 型から削除、B2 を集計値検証へ置換 |
| U2 | SummaryPage にドット列（`達成日`）が無い | SummaryPage.test.tsx SM-S1 | ✅ | `queryByLabelText('達成日')).toBeNull()` |
| U3 | 継続率 + 連続日数は表示される | SummaryPage.test.tsx SM-S1 | ✅ | RateGauge + streak テキスト維持 |
| U4 | 記録ゼロは前向き空状態（ドットなし） | SummaryPage.test.tsx SM-S4 | ✅ | 既存維持 |
| U5 | achievedDays/streak/rate が従来値 | model/summarize.test.ts（N1/B1/B2/E1） | ✅ | 回帰なし |

## 修正テストケース
| ID | 対象 | 修正 |
|---|---|---|
| M1 | summarize.test.ts B2 | `s.dots.find(...)` → `s.achievedDays === 2` |
| — | SummaryPage.test.tsx SM-S1 | `getByLabelText('達成日')` → `queryByLabelText('達成日')` is null + タイトル更新 |

## 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| D1 | ドット要素の存在検証 | ドット表示廃止に伴い対象消滅 |

## サマリー

| 項目 | 値 |
|------|-----|
| 合計（全スイート） | 200 |
| 成功 | 200 |
| 失敗 | 0 |
| 成功率 | 100% |
