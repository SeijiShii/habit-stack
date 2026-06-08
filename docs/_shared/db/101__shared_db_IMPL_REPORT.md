# 実装レポート: _shared/db

## 実装日時
2026-06-08 18:15 (JST)

## モード
feature

## 関連ドキュメント
- 001__shared_db_SPEC.md / 002__shared_db_PLAN.md / 003__shared_db_UNIT_TEST.md
- 905__shared_db_SPEC_REVIEW.md
- [AI_LOG](../../AI_LOG/D20260608_018_tdd__shared_db.md)

## 注意事項
ファイルパス・行番号は実装日時時点。

## 変更一覧

### Phase 1: スキーマ + enum 定義
- `db/schema.ts`: 2 enum（time_of_day / session_status）+ 5 テーブル（activity_sets / activity_items / execution_sessions / execution_records / daily_achievements）。owner_id 行分離（SEC-001）、同期メタ（client_local_id / updated_at / deleted_at）、index/unique 制約。
- `db/index.ts`: barrel re-export（型供給を _shared/types へ）。

### Phase 2: 接続クライアント + マイグレーション
- `db/client.ts`: `createDb(url)` = neon-http + drizzle。空 URL で明示エラー、接続は遅延（副作用なし）。
- `drizzle.config.ts`: drizzle-kit 設定（migrations 出力先 db/migrations）。
- `db/migrations/0000_*.sql`: 初期マイグレーション生成（5 tables、`drizzle-kit generate`）。

### プロジェクト基盤（最初の tdd 対象のため最小 scaffold を同梱）
- `package.json`（type:module、test/typecheck/db スクリプト、drizzle-orm/@neondatabase/serverless + vitest/drizzle-kit/typescript）
- `tsconfig.json`（strict、Bundler resolution、path alias）
- `vitest.config.ts`（node env、coverage thresholds 80/70）
- npm install 実行済み（脆弱性 9 件 → /flow:secure --phase=deps で要確認）

## 実装計画からの差分

| 項目 | 内容 |
|---|---|
| 計画にない追加変更 | プロジェクト基盤 scaffold（package.json 等）— 最初の tdd 対象のため必要 |
| 計画から省略した変更 | Phase 3 seed.ts（任意、MVP 後回し） |
| 想定外の問題と対処 | ドキュメントの「6 テーブル」は実際は 5 テーブル（users は owner_id 列で代替、SPEC §3.3 の方針どおり）。表記ゆれのみ、設計は一致。vitest coverage 設定を thresholds 配下へ修正（typecheck green 化） |

## PR Description
### タイトル
_shared/db: Drizzle スキーマ（5 テーブル/owner_id 分離/同期メタ）+ プロジェクト基盤

### 概要
habit-stack の永続化基盤。Neon + Drizzle で 5 テーブル + 2 enum を定義し、行レベル owner 分離（SEC-001）と local-first 同期メタを備える。最初の実装対象のため最小プロジェクト基盤も同梱。

### 変更内容
- 5 テーブル + 2 enum、owner_id index、(owner_id,client_local_id) / (owner_id,set_id,date) unique
- createDb（neon-http + drizzle、空 URL エラー）
- 初期マイグレーション生成

### テスト
- 12/12 パス（100%）。enum/列/制約/index/型推論/client 初期化。typecheck green。
