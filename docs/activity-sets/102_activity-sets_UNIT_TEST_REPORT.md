# 単体テストレポート: activity-sets

## 実施日時
2026-06-08 19:08 (JST)

## テスト実行環境
- Node v22.11.0 / Vitest 2.1.9 / fake-indexeddb / happy-dom + testing-library / TS 5.7 green

## テスト結果
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| N1 | createSet local-sync 保存 | activitySets.test.ts | ✅ |
| N3 | deleteSet 配下アイテム連動 | activitySets.test.ts | ✅ |
| - | item CRUD | activitySets.test.ts | ✅ |
| E1 | name 空 Zod エラー | activitySets.test.ts | ✅ |
| E2 | name 61 Zod エラー | activitySets.test.ts | ✅ |
| E3 | 不正 timeOfDay エラー | activitySets.test.ts | ✅ |
| B1 | 1/60 文字 OK | activitySets.test.ts | ✅ |
| N4 | reorder 連番振り直し | activitySets.test.ts | ✅ |
| B2 | reorder 1 件変更なし | activitySets.test.ts | ✅ |
| S1 | SetListPage 作成→朝グループ表示 | SetListPage.test.tsx | ✅ |
| S2 | 空 name バリデーション・未保存 | SetListPage.test.tsx | ✅ |

## 追加テストケース
なし。

## サマリー
| 項目 | 値 |
|---|---|
| 計画 | 11 |
| 追加 | 0 |
| 合計 | 11（プロジェクト累計 72） |
| 成功 | 11 |
| 失敗 | 0 |
| 成功率 | 100% |
