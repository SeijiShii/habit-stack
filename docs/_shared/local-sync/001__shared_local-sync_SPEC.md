# _shared/local-sync 仕様書（local-first 同期層・横断）

> **役割**: IndexedDB への local-first 書き込み + Neon への双方向同期キュー（タイムスタンプ方式・冪等・last-write-wins）。匿名でもオフラインでも記録でき、認証/オンライン復帰時に同期。
> **target_type**: cross-cutting（提供インターフェース。E2E は feature 側 offline シナリオでカバー）
> **タグ**: offline-critical, auth-required（owner 経由同期）
> **最終更新**: 2026-06-08
> **入力**: `../../concept.md` §4(アーキ) / §5.2(データフロー) / §3 NFR、`../db/001__shared_db_SPEC.md`, `../auth/001__shared_auth_SPEC.md`
> **設計根拠**: D20260608-004（ローカルファースト + タイムスタンプ方式）

---

## 1. 提供インターフェース

### 1.1 ローカルストア（IndexedDB ラッパ、`idb`）
- `localStore.put(entity, record)` / `get` / `getAllByOwner` / `softDelete` — 各エンティティをローカル保存。書き込み時に `client_local_id`（生成）/ `updated_at`（端末時計）/ `deleted_at` を付与。
- 匿名でも即書き込み（0 タップ実行、§3 NFR）。

### 1.2 同期キュー
- `syncQueue.enqueue(op)` — ローカル変更を未同期キューに積む（IndexedDB の outbox ストア）。
- `sync.push()` — 未同期分を `/api/sync/push`（withOwner）へ送り、owner_id をサーバが付与して Neon に upsert。`client_local_id` で冪等。
- `sync.pull(since)` — `/api/sync/pull?since=` から差分取得しローカルに反映。
- `sync.run()` — オンライン復帰/認証時に push→pull を実行。競合は **last-write-wins（updated_at 比較）**。

### 1.3 競合解決
- 同一エンティティの local と server で `updated_at` を比較し新しい方を採用（端末時計ずれは許容、§3 NFR データ整合性）。
- 削除は `deleted_at` tombstone を同期（物理削除は両者反映後）。

## 2. 入出力（提供 API）
### 2.1 サーバ API（withOwner）
| メソッド | パス | 入力 | 出力 |
|---|---|---|---|
| POST | /api/sync/push | SyncEnvelope[]（upsert/delete） | 反映結果 + サーバ updated_at |
| GET | /api/sync/pull?since= | since timestamp | 差分 SyncEnvelope[] |

### 2.2 副作用
- IndexedDB 読み書き、Neon upsert/soft-delete。

## 3. データモデル
- DB スキーマ変更なし（同期メタは _shared/db §3 に既定: client_local_id/updated_at/deleted_at）。
- IndexedDB: エンティティ別ストア + `outbox`（未同期 op）+ `meta`（last_pull_at）。

## 4. バリデーション + エラーケース
| 条件 | 振る舞い |
|---|---|
| オフライン中の書き込み | ローカル成功、outbox に積む（後で同期） |
| push 失敗（ネット/サーバ） | リトライ（指数バックオフ）、outbox 保持 |
| 競合（local/server 両方更新） | updated_at 新しい方を採用、古い方は破棄（last-write-wins） |
| 未認証での push | 401（withOwner）→ 匿名はローカルのみ運用、認証後に同期 |
| client_local_id 再送 | サーバ upsert で冪等吸収 |
| owner 不一致データ pull | サーバが owner で絞るため発生しない（SEC-001） |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| ローカル書き込み | < 50ms（体感即時） | §3 NFR 性能 / O22 |
| 同期 | バックグラウンド非ブロッキング、UI を止めない | §3 NFR 可用性 |
| データ欠損 | 匿名→認証移行で欠損ゼロ | §3 NFR データ整合性 / UC8 |

### 5.2 連携
| 連携先 | 内容 |
|---|---|
| _shared/db | サーバ側 upsert/soft-delete |
| _shared/auth | push/pull を withOwner、mergeGuestData 協調 |
| _shared/types | SyncEnvelope<T> |
| activity-sets / execution | ローカル書き込みは本層経由 |

## 6. タグ別追加項目
### 6.3 オフライン（offline-critical）
- 同期戦略: local-first + outbox + 復帰時バッチ push/pull。
- 競合解決: last-write-wins（updated_at）。
- tombstone（deleted_at）で削除も同期。

### 6.1 認可（auth-required）
- 同期 API は withOwner。owner はサーバ Clerk セッション由来（SEC-001）。

## 7. スコープ外
- CRDT / OT（last-write-wins で十分、単一ユーザー自己データのため競合は稀）
- リアルタイム同期（バッチで足りる、Web Push なし）

## 8. 未決事項
- 現時点で論点なし（2026-06-08）。端末時計大幅ずれ時の補正はサーバ受信時刻を補助に使うか検討余地ありだが、MVP は端末 updated_at 基準で確定。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
