# execution マイグレーション計画（last_saved_at 列追加）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`
> **最終更新**: 2026-06-11

---

## 1. 移行対象

| 対象 | 種別 | 変更内容 |
|---|---|---|
| `execution_sessions.last_saved_at` | DB（Postgres / Neon） | `timestamptz NULL` 列を additive 追加。進行中セッションのハートビート（最終生存時刻）を保持 |

> localStorage 新規キー `hs:exec:hb:<ownerId>` はクライアント側追加のみで DB マイグレーション不要（既存 guest-id キーに無影響）。

## 2. 移行手順

### Step 1: drizzle migration 生成・適用
- 内容: `db/migrations/0001_add_last_saved_at.sql`
  ```sql
  ALTER TABLE "execution_sessions" ADD COLUMN "last_saved_at" timestamptz;
  ```
- `db/schema.ts` に `lastSavedAt: ts("last_saved_at")` を追加し、drizzle-kit generate で SQL を確定（手書きと一致確認）。
- 適用順: **staging に先行適用 → 検証 → 本番**。
- 検証クエリ:
  ```sql
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'execution_sessions' AND column_name = 'last_saved_at';
  -- 期待: last_saved_at | timestamp with time zone | YES
  ```
- 想定所要時間: 数秒（additive nullable、テーブルロックは即時、データ書換なし）。

### Step 2: アプリデプロイ（列を利用するコード）
- 内容: 15秒 flush が `last_saved_at` を書き始める。pull は行全体で透過。
- 検証: 計時中セッションで
  ```sql
  SELECT id, status, started_at, last_saved_at
  FROM execution_sessions
  WHERE status <> 'done'
  ORDER BY updated_at DESC LIMIT 5;
  -- 期待: 進行中行の last_saved_at が ~15秒間隔で更新されている
  ```

## 3. ロールバック手順

| 元 Step | 逆操作 | 検証 |
|---|---|---|
| Step 2（アプリ） | コード revert（旧挙動へ） | アプリが last_saved_at を書かない／読まないことを確認 |
| Step 1（列追加） | 任意。`ALTER TABLE "execution_sessions" DROP COLUMN "last_saved_at";`（**非必須** — nullable 残置で無害） | 列削除後も既存機能が動作 |

> 推奨: ロールバック時は **列を残す**（DROP しない）。再前進時の再適用コストを避け、データ損失リスクもない。

## 4. ダウンタイム

- 要否: **不要**（additive nullable、既存行の書換なし、Postgres は即時メタデータ変更）。
- 影響範囲: なし（読み書き継続可能）。

## 5. 失敗時の対応

| 失敗箇所 | 対応 | 連絡先 |
|---|---|---|
| migration 適用失敗 | トランザクション内なら自動ロールバック。権限/接続を確認し再実行（冪等: `ADD COLUMN IF NOT EXISTS` も検討） | seiji |
| デプロイ後 push エラー | outbox 保持で再送（冪等）。列不在が原因なら migration 適用順を確認 | seiji |

## 6. 事前準備

- バックアップ: Neon の自動バックアップ/ブランチで足る（additive のため低リスク）。
- ステージング検証: 必須（Step 1-2 を staging で先行）。
- 関係者通知: 不要（無停止・後方互換）。

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-11 | 初版作成 | /flow:revise |
