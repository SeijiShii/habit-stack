# _shared/db 仕様書（DB スキーマ・横断基盤）

> **役割**: Neon (Postgres) + Drizzle ORM のスキーマ定義・マイグレーション。全 feature が参照する永続化の SoT。
> **target_type**: cross-cutting（提供インターフェース。UI なし、E2E は feature 側でカバー）
> **タグ**: auth-required（owner_id 行レベル分離 / SEC-001）, offline-critical（同期メタ: client_local_id / updated_at / deleted_at）
> **最終更新**: 2026-06-08
> **入力**: `../../concept.md` §5.1 / §3.X SEC / §4.3、`./README.md`

---

## 1. 提供インターフェース

Drizzle スキーマ（`db/schema.ts`）+ マイグレーション（drizzle-kit）+ 型エクスポート（`_shared/types` へ供給）+ Neon 接続クライアント（`db/client.ts`）を提供。各 feature は Drizzle クエリビルダ経由でアクセスし、**生 SQL は使わない**。

### 1.1 設計方針
- **全テーブルに `owner_id text not null`**（Clerk user id、匿名ゲスト含む）→ SEC-001 owner-check の土台。アプリ層 owner resolver（`_shared/auth`）が全クエリを owner_id で絞る。
- **同期メタ**（offline-critical）: `client_local_id text`（IndexedDB 由来の冪等キー）/ `updated_at timestamptz`（last-write-wins 比較キー）/ `deleted_at timestamptz null`（ソフト削除 = 同期 tombstone）。
- **時刻は全て UTC `timestamptz`**。経過時間はアプリ層でタイムスタンプ差分算出（D20260608-004）。
- **PK は uuid**（クライアント生成可 → オフライン採番 + 同期冪等）。

## 2. 入出力（提供 API = Drizzle テーブル + クエリ）

### 2.1 副作用
- マイグレーション適用で Neon にテーブル/インデックス作成。
- 各 feature の CRUD は upsert（同期）含む。アプリ層が owner_id を必ず付与。

## 3. データモデル

### 3.1 enum
| enum | 値 |
|---|---|
| `time_of_day` | morning / noon / evening / night |
| `session_status` | running / paused / done |

### 3.2 テーブル（新規 6 件）

#### activity_sets（活動セット）
| field | 型 | 制約 |
|---|---|---|
| id | uuid | PK（クライアント生成可） |
| owner_id | text | not null, index |
| name | text | not null, 1..60 |
| time_of_day | time_of_day | not null |
| sort_order | int | not null default 0 |
| created_at / updated_at | timestamptz | not null |
| deleted_at | timestamptz | null（tombstone） |

index: `(owner_id, deleted_at)`

#### activity_items（アイテム）
| field | 型 | 制約 |
|---|---|---|
| id | uuid | PK |
| set_id | uuid | FK→activity_sets, not null, index |
| owner_id | text | not null, index |
| name | text | not null, 1..60 |
| sort_order | int | not null default 0 |
| created_at / updated_at | timestamptz | not null |
| deleted_at | timestamptz | null |

index: `(set_id, deleted_at)`, `(owner_id)`

#### execution_sessions（実行セッション = セットを回した 1 回）
| field | 型 | 制約 |
|---|---|---|
| id | uuid | PK |
| owner_id | text | not null, index |
| set_id | uuid | FK→activity_sets, not null |
| started_at | timestamptz | not null |
| ended_at | timestamptz | null（進行中=null） |
| status | session_status | not null default 'running' |
| client_local_id | text | not null（IndexedDB 冪等キー）, unique(owner_id, client_local_id) |
| synced_at | timestamptz | null |
| created_at / updated_at | timestamptz | not null |

index: `(owner_id, started_at)`

#### execution_records（アイテム単位の時間記録 + 今日メモ）
| field | 型 | 制約 |
|---|---|---|
| id | uuid | PK |
| session_id | uuid | FK→execution_sessions, not null, index |
| item_id | uuid | FK→activity_items, not null |
| owner_id | text | not null, index |
| started_at | timestamptz | not null |
| ended_at | timestamptz | null |
| elapsed_sec | int | not null default 0（タイムスタンプ差分算出値を保存） |
| paused_total_sec | int | not null default 0 |
| note | text | null, 0..280 |
| client_local_id | text | not null, unique(owner_id, client_local_id) |
| synced_at | timestamptz | null |
| created_at / updated_at | timestamptz | not null |

index: `(session_id)`, `(owner_id, started_at)`

#### daily_achievements（達成日キャッシュ = 継続率の高速集計用）
| field | 型 | 制約 |
|---|---|---|
| id | uuid | PK |
| owner_id | text | not null, index |
| set_id | uuid | FK→activity_sets, not null |
| date | date | not null（ユーザーローカル日付、サーバは値を保存） |
| achieved | boolean | not null default true |
| item_done_count | int | not null default 0（穴あき可視化の補助） |
| created_at / updated_at | timestamptz | not null |

unique: `(owner_id, set_id, date)` / index: `(owner_id, date)`

> **継続の定義（D20260608-003）**: セット単位・穴あき許容。その日にセット内 1 アイテム以上実行 → `achieved=true`。同期/実行確定時に streak-summary が upsert。継続率 = 達成日数 / 対象日数。

### 3.3 users テーブルは作らない（MVP）
owner_id = Clerk user id を直接保持。匿名ゲスト→Google リンクは Clerk 側で同一 user id を維持し、移行は `_shared/auth` が担う（DB スキーマ変更不要）。将来プロフィールが要れば `users` 追加。

## 4. バリデーション + エラーケース

### 4.1 バリデーション（アプリ層 Zod と二重、SEC-002）
| 対象 | ルール |
|---|---|
| name | 1..60 文字、trim 後非空 |
| note | 0..280 文字 |
| time_of_day | enum 値のみ |
| sort_order | int >= 0 |
| owner_id | 非空（owner resolver が注入、クライアント値を信用しない） |

### 4.2 エラーケース
| 条件 | 振る舞い |
|---|---|
| FK 違反（存在しない set_id） | 制約エラー → アプリ層 400 |
| unique(owner_id, client_local_id) 衝突 | upsert（冪等、同期再送を吸収） |
| owner_id 不一致での参照 | アプリ層 owner resolver が 0 件に絞る（DB に到達させない） |

## 5. 機能固有 NFR + 連携

### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| クエリ応答 | owner_id index で主要クエリ < 50ms（無料枠 Neon） | §3 NFR 性能 |
| マイグレーション | drizzle-kit で前方向のみ、破壊的変更は別レビュー | 安全運用 |

### 5.2 連携
| 連携先 | 内容 |
|---|---|
| _shared/types | テーブル型を Drizzle `$inferSelect/$inferInsert` で供給 |
| _shared/auth | owner resolver が全クエリに owner_id を強制 |
| _shared/local-sync | client_local_id / updated_at / deleted_at で双方向同期 |
| 全 feature | activity-sets / execution / streak-summary / tip-jar が参照 |

## 6. タグ別追加項目

### 6.1 認可（auth-required / SEC-001）
- DB レベルでは RLS を使わず（Neon serverless + Drizzle、Clerk 認証のため）、**アプリ層 owner resolver で全クエリに `where owner_id = :ownerId` を強制**。生クエリ禁止。
- owner_id はサーバ側で Clerk セッションから解決した値のみ使用（クライアント送信値を信用しない）。

### 6.3 オフライン（offline-critical）
- 同期メタ（client_local_id / updated_at / deleted_at）で local-sync が冪等 upsert + last-write-wins。tombstone で削除も同期。

## 7. スコープ外
- RLS ポリシー（アプリ層 owner-check で代替）
- users プロフィールテーブル（v2）
- 監査ログテーブル（単一ユーザー自己データのため不要、concept §12.7）

## 8. 未決事項
- 現時点で論点なし（2026-06-08）。daily_achievements を「キャッシュ（再計算可能）」とするか「正本」とするかは streak-summary 設計（§7）で確定 → 現状はキャッシュ方針（同期/実行確定時に upsert、再計算可能）。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
