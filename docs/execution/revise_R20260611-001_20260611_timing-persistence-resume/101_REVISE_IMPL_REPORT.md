# 実装レポート: execution R20260611-001（計時状態の永続化・復帰）

## 実装日時
2026-06-11（JST）

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md] - 変更仕様書
- [002_REVISE_PLAN.md] - 変更計画書
- [003_REVISE_UNIT_TEST.md] - 単体テスト計画
- [905_REVISE_SPEC_REVIEW.md] - 設計レビュー（R1〜R8）
- [AI_LOG](../../AI_LOG/D20260611_003_tdd_execution_revise_R20260611-001.md) - 実装判断ログ

## 注意事項
本レポートのファイルパス・行番号は実装日時時点のもの。

## 変更一覧

### Phase 1: 4H キャップ（R1/R7）
- `src/features/execution/model/elapsed.ts`: `MAX_ACTIVITY_SEC = 14400` + `cappedElapsedSec()` 追加。
- `executionMachine.endCurrentItem`: 確定 `elapsedSec` を `cappedElapsedSec` 化（保存値もクランプ）。
- `ExecutionPage.liveElapsed`: 表示も `cappedElapsedSec` 化。

### Phase 2: ハートビート永続（R2）
- 新規 `src/features/execution/model/heartbeat.ts`: `saveHeartbeat/loadHeartbeat/clearHeartbeat`（localStorage、キー `hs:exec:hb:<ownerId>` で account-scoped、破損/欠落/owner不一致は undefined）。
- `executionRepo.persist`: `PersistOpts`（`lastSavedAt` + `achievementMode`）追加。session レコードに `itemIds/index/pauseStartedAt/lastSavedAt` を保持（IndexedDB を ExecState 損失なし正本に）。
- `db/schema.ts`: `executionSessions.lastSavedAt`（`last_saved_at` nullable）追加。`db/migrations/0001_add_last_saved_at.sql`（additive）。
- `ExecutionPage`: 計時中 1 秒 interval で毎秒 `saveHeartbeat` + 15 秒ごと `repo.persist(..., {lastSavedAt})`（outbox 投入）。`done` で `clearHeartbeat`。
- `src/app/repos.ts`: `Repos.ownerId` を公開。`App.tsx`: `ExecutionPage` に `ownerId` 供給。

### Phase 3: 復元 + 自動終了（R6/R4/R1/R3）
- 新規 `src/features/execution/model/recovery.ts`: `decideRecovery`（純関数、gap>=4H で `autoEnd@lastSavedAt`、それ以外 resume、時計巻き戻し/done は resume、fallback=current startedAt）。
- `executionRepo.restoreInProgress`: IndexedDB から ExecState を損失なく復元、**found レコードの clientLocalId を採用**（日跨ぎ重複防止、R6）。`endInProgressNow`。
- `useExecution`: マウント時に `restoreInProgress` → `decideRecovery` → resume は hydrate / autoEnd は `endSession@lastSavedAt` + strict 達成。`idRef` で found id を採用。StrictMode 冪等（restoredRef + 純関数 + 冪等 put）。

### Phase 4: ログイン画面遷移での自動終了（R8、論点-001）
- `recovery.isLoginPath('/account')`。
- `executionRepo.endInProgressNow(now)`: 進行中を `endSession@now` + strict 達成。
- `App.LoginEndGuard`: `useLocation` で `/account` 遷移を検知し `endInProgressNow` を呼ぶ。サマリ/ふりかえり遷移では終了しない。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | persist の session レコードに itemIds/index/pauseStartedAt を追加（restore 損失対策、AI_LOG D20260611-020）。Drizzle は未知キー無視で backend 互換 |
| 計画から省略した変更 | **15秒 backend の実 push driver**: SyncQueue は App 未マウント（既存ギャップ）。本改修は 15秒 re-persist で outbox 投入まで実装、push cadence は既存 sync 起動に依存（AI_LOG D20260611-022）。要フォローアップ |
| 想定外の問題と対処 | doneItemCount を全体 strict 化すると既存 ExecutionPage テスト（real timer で 0 秒）が壊れるため、自動終了経路のみ `achievementMode='strict'`（R3、D20260611-021） |

## PR Description

### タイトル
execution: 計時状態の永続化・復帰 + 4H放置キャップ + ログイン遷移終了 (R20260611-001)

### 概要
タブ切替・端末スリープ後のリロードで計時中セッションが失われる問題を解消。account-scoped で毎秒 localStorage / 進行中 15秒 backend にハートビート永続し、マウント時に進行中セッションを復元する。1活動 4H キャップ + 4H 放置の自動終了（最終保存時刻で確定）。計時中のログイン画面遷移ではセッションを終了して owner 切替を跨がない。

### 変更内容
- 4Hキャップ（表示+保存値）、毎秒localStorage/15秒backend ハートビート、マウント復元（found-id採用・StrictMode冪等）、4H放置自動終了（strict達成）、ログイン遷移終了、last_saved_at additive migration。

### テスト
- 全 167 tests green（execution 53）、typecheck clean。
- 新規: elapsed cap / heartbeat / recovery / restore+endInProgress / ExecutionPage 復元・放置。
