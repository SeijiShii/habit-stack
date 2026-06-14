# execution マイグレーション計画（periods の保持・任意の backend 列追加）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`
> **origin**: claim C20260614-001
> **最終更新**: 2026-06-14

---

## 1. 移行対象

| 対象 | 種別 | 変更内容 | 必須 |
|---|---|---|---|
| IndexedDB `execution_record` | クライアントストレージ（**構造正本**） | record に `periods`（JSON 配列）を保持。スキーマレスのため列定義変更は不要（オブジェクト形状の additive 拡張） | ✅（コード側のみ。DDL なし） |
| backend `execution_records.periods` | DB（Postgres / Neon） | `periods jsonb NULL` 列を additive 追加 | ⚠️ **任意**（IndexedDB が正本のため未追加でも実害なし） |

> periods は **additive**。既存の `started_at`/`ended_at`/`elapsed_sec`/`paused_total_sec` 列はそのまま使い続ける（派生・互換）。

## 2. 既存データの扱い

- **移行不要**。既存の完了レコードは保存済み `elapsed_sec` を信頼し、**遡及補正しない**（過去の値は不変）。
- 読み取り時に `periods` が欠落しているレコード（legacy）は、アプリ側で `[{ startedAt, endedAt }]`（単一区間）を合成して扱う（`executionRepo.restoreInProgress` の合成ロジック、SPEC §4）。
- データ変換バッチ・バックフィルは不要。

## 3. 移行手順（任意の backend 列を追加する場合）

### Step 1: drizzle migration 生成・適用（任意）
- 内容: `db/migrations/000X_add_periods.sql`
  ```sql
  ALTER TABLE "execution_records" ADD COLUMN "periods" jsonb;
  ```
- `db/schema.ts` の `executionRecords` に `periods: jsonb("periods")`（nullable）を追加し、drizzle-kit generate で SQL を確定（手書きと一致確認）。
- 適用順: **staging に先行適用 → 検証 → 本番**。
- 検証クエリ:
  ```sql
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'execution_records' AND column_name = 'periods';
  -- 期待: periods | jsonb | YES
  ```
- 想定所要時間: 数秒（additive nullable、データ書換なし、Postgres は即時メタデータ変更）。

### Step 2: アプリデプロイ（periods を読み書きするコード）
- 内容: persist で periods を書き、restore で periods を読む（欠落時は合成）。
- 検証: 中断を挟んだ計時セッションを 1 件実行し、`periods` 配列が記録されていること、`elapsed_sec` が periods 合計と一致することを確認。

## 4. ロールバック手順

| 元 Step | 逆操作 | 検証 |
|---|---|---|
| Step 2（アプリ） | コード revert（旧 単一ペア + pausedTotalSec 挙動へ） | periods 列が残っていても旧コードは読まないため無害 |
| Step 1（列追加・任意） | 任意。`ALTER TABLE "execution_records" DROP COLUMN "periods";`（**非必須** — nullable jsonb 残置で無害） | 列削除後も既存機能が動作 |

> 推奨: ロールバック時は **列を残す**（DROP しない）。再前進時の再適用コストを避け、データ損失リスクもない。periods 列は additive のため残置で完全に無害。

## 5. ダウンタイム

- 要否: **不要**（additive nullable、既存行の書換なし、オンライン適用）。
- 影響範囲: なし（読み書き継続可能）。

## 6. 検証（履歴合計の不変性）

- **既存セッションの振り返り合計時間が改修前後で不変**であることを確認する（summaryRepo は確定 `elapsedSec` を集計するため、periods 導入は過去の合計に影響しない）。
  ```sql
  -- 改修前後で同一であること
  SELECT date, SUM(elapsed_sec) FROM execution_records
  WHERE ended_at IS NOT NULL GROUP BY date ORDER BY date;
  ```
- 新規セッション: 中断を挟んだ活動で `elapsed_sec` = periods 合計（中断区間を除外）であること。
- legacy 復帰: periods 欠落の進行中セッションが `[{startedAt, endedAt}]` 合成で復帰し、保存済み elapsed が維持されること。

## 7. 失敗時の対応

| 失敗箇所 | 対応 | 連絡先 |
|---|---|---|
| migration 適用失敗（任意列） | トランザクション内なら自動ロールバック。`ADD COLUMN IF NOT EXISTS` を検討して再実行（冪等） | seiji |
| デプロイ後 push エラー | outbox 保持で再送（冪等）。列不在が原因なら migration 適用順を確認（または列追加を見送り IndexedDB 正本で運用） | seiji |

## 8. 事前準備

- バックアップ: Neon の自動バックアップ/ブランチで足る（additive のため低リスク）。
- ステージング検証: backend 列を追加する場合は必須。IndexedDB のみなら不要。
- 関係者通知: 不要（無停止・後方互換）。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版作成（claim C20260614-001 起点） | /flow:revise |
