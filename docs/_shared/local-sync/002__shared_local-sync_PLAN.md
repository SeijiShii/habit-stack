# _shared/local-sync 実装計画書

> **入力**: `./001__shared_local-sync_SPEC.md`, `../db/`, `../auth/`
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `src/services/sync/localStore.ts` | IndexedDB ラッパ（put/get/getAllByOwner/softDelete、同期メタ付与） | idb, types | 140 |
| `src/services/sync/syncQueue.ts` | outbox 管理 + push/pull + last-write-wins | localStore, types | 150 |
| `src/services/sync/conflict.ts` | updated_at 比較・マージ | types | 50 |
| `api/sync/push.ts` | サーバ upsert（withOwner、冪等） | db, auth | 90 |
| `api/sync/pull.ts` | 差分取得（withOwner） | db, auth | 70 |
| `src/hooks/useSync.ts` | オンライン/認証イベントで sync.run 起動 | syncQueue | 40 |

## 2. 実装 Phase 分割（injectable IndexedDB / fetch、O35）

### Phase 1: localStore（IndexedDB ラッパ）
- put 時に client_local_id/updated_at 付与、softDelete で deleted_at。
- テスト: fake-indexeddb で put/get/getAllByOwner/softDelete を検証。
### Phase 2: conflict + syncQueue（push/pull、fetch injectable）
- outbox 積み、push（mock fetch）、pull マージ、last-write-wins。
- テスト: 競合（local新/server新）両方向、冪等再送、tombstone 同期。
### Phase 3: サーバ api/sync push/pull（withOwner）
- owner で絞った upsert/差分。テスト: withOwner mock で owner 強制、冪等 upsert。
### Phase 4: useSync（オンライン/認証イベント連動）
- `online` イベント + Clerk 認証変化で sync.run。テスト: イベント発火で push/pull 呼ばれる。

## 3. 依存関係順序
```
localStore → conflict → syncQueue → (api/sync push,pull) → useSync
依存: _shared/db, _shared/auth(withOwner), _shared/types
```

## 4. 既存ファイルへの影響
- activity-sets / execution の書き込みは localStore 経由に（feature 実装時に配線）。

## 5. 横断フォルダへの追加・変更
- _shared/auth: mergeGuestData（移行）/ deleteAllData（削除）で localStore 連携。

## 6. リスク・注意点
- fake-indexeddb でのテスト整備。
- last-write-wins の境界（同一 updated_at）はサーバ受信順で決定。
- push/pull の owner はサーバ強制（クライアント owner 無視、SEC-001）。
- バックグラウンド同期が UI を止めない（非ブロッキング、§3 NFR）。

## 7. 完了の定義
- [ ] localStore CRUD + 同期メタ green
- [ ] syncQueue push/pull/last-write-wins/冪等/tombstone green
- [ ] api/sync は withOwner で owner 強制（SEC-001）
- [ ] useSync がオンライン/認証で起動
- [ ] E2E オフライン→復帰同期は feature 側でカバー

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
