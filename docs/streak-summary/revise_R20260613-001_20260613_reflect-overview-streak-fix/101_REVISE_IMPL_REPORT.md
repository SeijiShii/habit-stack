# 実装レポート: streak-summary R20260613-001（振り返り総覧 + 連続日数の正確化）

## 実装日時
2026-06-13 08:45 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md](./001_REVISE_SPEC.md) - 変更仕様書
- [002_REVISE_PLAN.md](./002_REVISE_PLAN.md) - 変更計画書
- [003_REVISE_UNIT_TEST.md](./003_REVISE_UNIT_TEST.md) - 単体テスト計画
- [005_REVISE_MIGRATION.md](./005_REVISE_MIGRATION.md) - マイグレーション計画
- [AI_LOG セッション](../../AI_LOG/D20260613_003_tdd_streak-summary_revise_R20260613-001.md)

## 注意事項
本レポートのファイルパスと行番号は実装日時時点のものです。

## 変更一覧

### Phase 1: 日付是正の基盤 (commit 1b851ec)
- 新規 `src/services/time/localDate.ts` — `localDateOf(d)` (端末ローカル TZ の YYYY-MM-DD) + `formatDuration(sec)` (H時間M分)
- `src/features/execution/model/executionRepo.ts` — `localDate()` を UTC slice から `localDateOf` 委譲に修正（コメント「ユーザーローカル日付」と実装の乖離を解消）
- `src/features/streak-summary/SummaryPage.tsx` — today をローカル日付に
- `src/App.tsx` — `sessionLocalId` の日付スタンプをローカル日付に
- 既存テスト修正: executionRepo.test.ts の localDate 期待値を TZ 非依存ケース (12:00Z) に置換（REVISE_SPEC §2.2 の修正テストケース）

### Phase 2: streak today-pending 許容 (commit f0ef0d5)
- `src/features/streak-summary/model/summarize.ts` — currentStreak は末尾(今日)のみ未達を許容し前日から数える

### Phase 3: 達成日のローカル日付再構築 migration (commit 69a01c7)
- 新規 `src/services/sync/migrations/rebuildAchievements.ts` — execution_record(正本) から `{setId, ローカル日付}` を再導出 → upsert + 余剰 tombstone。META フラグで owner ごと 1 回・冪等。record 0 件 owner は no-op
- `src/services/sync/localStore.ts` — `getMeta`/`setMeta` 追加（META store アクセサ）
- `src/app/repos.ts` — 初期化時に fire-and-forget 実行（失敗時はフラグ未設定 → 次回再実行）

### Phase 4: 振り返り総覧ページ (commit cef5b44)
- 新規 `src/features/streak-summary/model/overview.ts` — `aggregateSetTotals()` 純関数（session×record join、setId/itemId 別合算、orphan record 無視）
- `src/features/streak-summary/model/summaryRepo.ts` — `getSetTotals()` 追加（owner スコープ・未削除のみ）
- 新規 `src/features/streak-summary/SummaryOverviewPage.tsx` — ドロップダウン（選択で個別サマリへ遷移）+ `<details>` 折りたたみ一覧 + セット合計/アイテム別累計時間 + 空状態
- `src/App.tsx` — `/summary` 静的行き止まりを `SummaryOverviewRoute` に置換

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | migration フラグを localStorage でなく既存 IndexedDB META store に保存（per-DB で fake-indexeddb テスト可能、wipe 系と整合）。LocalStore に getMeta/setMeta を追加 |
| 計画から省略した変更 | なし |
| 想定外の問題と対処 | 既存 executionRepo テストの localDate 期待値が UTC slice 前提だった → TZ 非依存ケースに置換し、TZ 依存境界は新設 localDate.test.ts (TZ=Asia/Tokyo 固定) に集約 |

## PR Description

### タイトル
streak-summary: 振り返り総覧ページ + 連続日数のローカル日付是正 (R20260613-001)

### 概要
ナビ「継続」→ /summary が行き止まりだった画面を、セット選択ドロップダウン + 全セット折りたたみ一覧（合計時間付き）の振り返り総覧に置き換える。あわせて「2日続いているのに1日と表示される」streak 不正確の根本原因（達成日の UTC 日付記録）をローカル日付に是正し、既存ローカルデータを再構築する migration を同梱。

### 変更内容
- /summary = 振り返り総覧ページ（ドロップダウン遷移 + details 開閉 + セット合計/アイテム別累計時間）
- 達成日・today・sessionLocalId の日付導出を UTC slice → 端末ローカル日付に統一
- currentStreak は今日未実施でも昨日までの連続を保つ（today-pending 許容）
- daily_achievement のローカル日付再構築 migration（冪等、クライアント内、スキーマ変更なし）

### テスト
- unit 197/197 green（新規 20 / 修正 2）、typecheck green、vite build 成功
- テスト結果: 197/197 (100%)
