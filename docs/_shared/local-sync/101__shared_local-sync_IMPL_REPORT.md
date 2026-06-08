# 実装レポート: _shared/local-sync

## 実装日時
2026-06-08 18:58 (JST)

## モード
feature

## 関連ドキュメント
- 001-003 + 905_SPEC_REVIEW + [AI_LOG](../../AI_LOG/D20260608_021_tdd__shared_local-sync.md)

## 変更一覧
### Phase 1: localStore（IndexedDB ラッパ）
- `src/services/sync/localStore.ts`: `LocalStore`（put + outbox/get/getAllByOwner/softDelete tombstone/applyRemote/wipeOwner/drainOutbox/clearOutbox）。idb、同期メタ付与。
### Phase 1: conflict
- `src/services/sync/conflict.ts`: `resolveConflict`（last-write-wins、同値はサーバ）。
### Phase 2: syncQueue
- `src/services/sync/syncQueue.ts`: `SyncQueue`（push=outbox→サーバ・失敗時保持、pull=差分→ローカル LWW、run）。
### Phase 3: server api/sync（withOwner）
- `src/services/sync/syncRepo.ts`: `SyncRepo` interface + `DrizzleSyncRepo`（owner サーバ強制 upsert/softDelete/changesSince、client_local_id 冪等）。
- `api/sync/push.ts` / `api/sync/pull.ts`: `makePushHandler`/`makePullHandler`（withOwner）。
### Phase 4: useSync
- `src/hooks/useSync.ts`: online/認証で run、非ブロッキング。

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 追加 | idb / fake-indexeddb 導入。schema timestamp を mode:'string' 化（同期 ISO と整合、SQL 不変） |
| 省略 | なし |
| 問題と対処 | fake-indexeddb は `fake-indexeddb/auto` で全 IDB グローバル設定が必要（IDBRequest 等）。drizzle timestamp の Date↔string ミスマッチ → mode:'string' で解消 |

## PR Description
### タイトル
_shared/local-sync: local-first 同期層（IndexedDB/outbox/last-write-wins）
### 概要
匿名でもオフラインでも即記録できる local-first ストア + 双方向同期（owner サーバ強制 SEC-001、冪等、tombstone）。
### テスト
19 テスト（conflict 3 / localStore 5 / syncQueue 5 / api 3 / useSync 3）。累計 56/56 green、typecheck green。
