# 単体テストレポート: streak-summary R20260613-001（振り返り総覧 + 連続日数の正確化）

## 実施日時
2026-06-13 08:45 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) - 単体テスト計画

## テスト実行環境
- Node.js + vitest (happy-dom / fake-indexeddb / testing-library)
- `npm test` = `vitest run`

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| U-LD-01 | ローカル日付コンポーネントで YYYY-MM-DD | src/services/time/localDate.test.ts | ✅ | |
| U-LD-01b | UTC 日付とズレる境界（JST 早朝 = UTC 前日） | 同上 | ✅ | TZ=Asia/Tokyo 固定 |
| U-LD-03 | ローカル日付境界 00:00/23:59 | 同上 | ✅ | |
| U-LD-04 | 月日ゼロ埋め | 同上 | ✅ | 追加 |
| U-LD-02 | formatDuration 0/分/時間+分/ちょうど | 同上 | ✅ | |
| U-ST-01 | 末尾(今日)のみ未達なら前日から数える | model/summarize.test.ts | ✅ | |
| U-ST-02 | 末尾達成済みなら今日を含めて数える | 同上 | ✅ | |
| U-ST-03 | 末尾未達かつ前日も未達なら 0 | 同上 | ✅ | |
| U-ST-04 | 期間 1 日のみ・未達は 0（配列外に出ない） | 同上 | ✅ | |
| U-MG-01 | UTC 日付達成をローカル日付で再構築 + 余剰 tombstone | migrations/rebuildAchievements.test.ts | ✅ | 2日連続→2日に復元 |
| U-MG-02 | 冪等（2 回目はフラグで no-op） | 同上 | ✅ | |
| U-MG-03 | record 0 件は達成を消さず no-op | 同上 | ✅ | |
| U-OV-03 | session に紐づかない record 無視（migration） | 同上 | ✅ | |
| U-OV-01 | setId/itemId 別 elapsedSec 合算 | model/overview.test.ts | ✅ | |
| U-OV-03 | orphan record 無視（集計） | 同上 | ✅ | |
| U-OV-04 | 記録ゼロのセットは totals に現れない | 同上 | ✅ | 追加 |
| U-PG-01 | 折りたたみ一覧 + 合計/アイテム別時間 | SummaryOverviewPage.test.tsx | ✅ | |
| U-PG-02 | ドロップダウン選択で onSelectSet | 同上 | ✅ | |
| U-PG-03 | セット 0 件の空状態 + 導線 | 同上 | ✅ | |
| U-PG-04 / U-OV-02 | 記録ゼロ=0分 + 他 owner 記録の非混入 | 同上 | ✅ | |
| (修正) localDate | TZ 非依存ケースに期待値更新 | execution/model/executionRepo.test.ts | ✅ | REVISE_SPEC §2.2 |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| U-LD-04 | localDateOf | 月日ゼロ埋め | フォーマット境界の明示 |
| U-OV-04 | aggregateSetTotals | 記録ゼロセットの非出現 | UI 側 0分 表示との責務境界明確化 |

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数 | 18件 |
| 追加テスト数 | 2件 |
| 合計（本改修分） | 20件 + 修正 1件 |
| 全スイート成功 | 197件 / 197件 |
| 失敗 | 0件 |
| 成功率 | 100% |

補足: typecheck green / vite build 成功 / リグレッション（既存 177 → 197、既存テストの失敗 0）。
