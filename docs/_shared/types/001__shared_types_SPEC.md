# _shared/types 仕様書（共通型定義・横断基盤）

> **役割**: ドメイン型・enum・同期エンベロープ型の単一定義。DB 由来型を集約し全 feature へ供給。
> **target_type**: cross-cutting（提供インターフェース、UI/E2E なし）
> **タグ**: cross-cutting
> **最終更新**: 2026-06-08
> **入力**: `../db/001__shared_db_SPEC.md`, `../../concept.md` §5.1

---

## 1. 提供インターフェース

`src/types/` に型を定義し re-export。実行時値を持たない（型のみ + enum リテラル定数）。

### 1.1 提供する型
- **DB 由来型**: `_shared/db` の Drizzle `$inferSelect`/`$inferInsert` を意味名で re-export（`ActivitySet`, `ActivitySetInsert`, `ActivityItem`, `ExecutionSession`, `ExecutionRecord`, `DailyAchievement` と各 Insert）。
- **enum リテラル**: `TimeOfDay = 'morning'|'noon'|'evening'|'night'`、`SessionStatus = 'running'|'paused'|'done'`（const オブジェクト + union 型）。
- **同期エンベロープ**（offline-critical）: `SyncEnvelope<T> = { entity, op: 'upsert'|'delete', payload: T, client_local_id, updated_at }`、`SyncPullResult`, `SyncPushResult`。
- **ドメイン VO**: `OwnerId = string`（branded type 推奨）、`Iso8601 = string`、`ContinuationRate = { achievedDays: number; totalDays: number; rate: number }`。
- **API DTO**: 各 feature の Zod スキーマから `z.infer` した入出力型はその feature 側に置く（ここには共通のみ）。

## 2. 入出力
- 副作用なし（型定義 + const）。

## 3. データモデル
- DB スキーマ（_shared/db §3）の型を再エクスポートするのみ。新規エンティティ定義はしない。

## 4. バリデーション + エラーケース
- 型レベルのみ（実行時バリデーションは各 feature の Zod、SEC-002）。
- branded `OwnerId` で「クライアント由来の素 string」を owner として誤用しにくくする（型ガード）。

## 5. 機能固有 NFR + 連携
### 5.1 NFR
- ビルド時型チェックのみ。実行時コストゼロ。

### 5.2 連携
| 連携先 | 内容 |
|---|---|
| _shared/db | Drizzle 型を input |
| 全 feature / _shared/local-sync | 型を import |

## 6. タグ別追加項目
- なし（純粋型）。

## 7. スコープ外
- 実行時バリデーション（各 feature Zod）
- API クライアント生成

## 8. 未決事項
- 現時点で論点なし（2026-06-08）。`OwnerId` を branded type にするかは実装時に確定（推奨: branded）。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
