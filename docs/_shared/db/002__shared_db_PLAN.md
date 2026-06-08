# _shared/db 実装計画書

> **入力**: `./001__shared_db_SPEC.md`, `../../concept.md` §1.4 / §4.3
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧（db/ + src/services/）

| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `db/schema.ts` | Drizzle テーブル + enum 定義（6 テーブル） | drizzle-orm | 180 |
| `db/client.ts` | Neon 接続クライアント（`drizzle(neon(DATABASE_URL))`） | @neondatabase/serverless, drizzle-orm | 25 |
| `db/index.ts` | re-export（schema + client + 型） | 上記 | 15 |
| `drizzle.config.ts` | drizzle-kit 設定（migrations 出力先） | drizzle-kit | 20 |
| `db/migrations/0000_init.sql` | 初期マイグレーション（drizzle-kit generate） | — | 自動生成 |
| `db/seed.ts` | dev 用シード（任意） | client | 40 |

> 言語/FW: TypeScript + Drizzle + Neon serverless driver（concept §4.3 確定）。

## 2. 実装 Phase 分割

### Phase 1 (RED→GREEN→IMPROVE): スキーマ + enum 定義
- 対象: `db/schema.ts`（6 テーブル + 2 enum + index + unique 制約）
- テスト: スキーマの型推論（`$inferSelect/$inferInsert`）が期待形か、enum 値、制約定義の単体検証（drizzle スキーマオブジェクトの shape assert）。
- ゴール: 型エクスポートが `_shared/types` から参照可能。

### Phase 2: 接続クライアント + マイグレーション生成
- 対象: `db/client.ts`, `drizzle.config.ts`, `drizzle-kit generate` で `0000_init.sql`
- テスト: client がモック接続文字列で初期化されること（実 Neon 接続は結合テスト/ローカルで）。
- ゴール: `npm run db:generate` / `db:migrate` が通る。

### Phase 3: シード + クエリヘルパ（任意）
- 対象: `db/seed.ts`、owner_id スコープ付きクエリのサンプル
- ゴール: dev ブランチにシード投入可。

## 3. 依存関係順序

```
db/schema.ts (enum→table→index/unique)
  → db/client.ts (neon driver)
  → drizzle.config.ts → migrations
  → _shared/types が schema 型を re-export
```

## 4. 既存ファイルへの影響
- なし（新規基盤）。Vite プロジェクト初期化（基本部分）が前提。

## 5. 横断フォルダへの追加・変更
| 横断 | 内容 |
|---|---|
| _shared/types | schema 由来の型を供給（本 PLAN で型 export を用意） |

## 6. リスク・注意点
- Neon serverless driver は HTTP/WebSocket。Vercel Functions で edge/node ランタイム選択に注意。
- マイグレーションは前方向のみ。破壊的変更（列削除等）は別レビュー（concept §10.5）。
- owner_id index 必須（SEC-001 性能、全クエリが owner_id で絞る前提）。

## 7. 完了の定義（DoD）
- [ ] schema.ts に 6 テーブル + 2 enum + index/unique 定義
- [ ] `db:generate` でマイグレーション生成 + `db:migrate` 成功（dev ブランチ）
- [ ] 型が `_shared/types` から参照可能
- [ ] 単体テスト green（スキーマ shape / 型推論）
- [ ] E2E は cross-cutting のため本フォルダでは作らない（統合は feature 側 E2E でカバー、出力品質ゲート 15）

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
