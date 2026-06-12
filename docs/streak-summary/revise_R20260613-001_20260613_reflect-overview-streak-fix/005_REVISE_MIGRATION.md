# streak-summary マイグレーション計画（達成日のローカル日付再構築）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`
> **最終更新**: 2026-06-13

---

## 1. 移行対象

| 対象 | 種別 | 変更内容 |
|---|---|---|
| IndexedDB `daily_achievement`（クライアントローカル） | Storage（ローカルデータ変換） | date を UTC 由来 → ローカル日付由来に再構築 |
| Neon `daily_achievements` | DB（間接） | クライアントの再構築結果が既存 outbox 同期で伝播（サーバ側操作なし） |

DB スキーマ変更: なし。サーバ側で実行する手順: なし（クライアント内 migration）。

## 2. 移行手順

実装: `src/services/sync/migrations/rebuildAchievements.ts`。`repos.ts` 初期化時に owner ごとに 1 回実行（localStorage のバージョンフラグ `migration:achievements-local-date:v1:<ownerId>` で制御）。

### Step 1: 再導出
- 内容: owner の execution_session（setId）+ execution_record（startedAt, elapsedSec）を読み、`elapsedSec > 0` の record ごとに `localDateOf(startedAt)` で {setId, date} 達成集合を再計算
- 検証: 集合サイズ > 0（record 0 件なら全体 no-op で終了 = U-MG-03）
- 想定所要時間: 数十 ms（ローカル 1 パス）

### Step 2: upsert
- 内容: 再計算した各 {setId, date} を daily_achievement へ put（id = `owner:set:date`、既存と同形式、itemDoneCount は当日 record 数）
- 検証: put 後の getAllByOwner に全 date が存在

### Step 3: 余剰 tombstone
- 内容: 既存 daily_achievement のうち再計算集合に**ない** {setId, date} を `deletedAt` 付き put（tombstone、outbox でサーバへも削除伝播）
- 検証: 再計算集合と store 上の有効レコード集合が一致

### Step 4: フラグ確定
- 内容: バージョンフラグを書き、以後スキップ
- 検証: リロード後に再実行されない（U-MG-02 冪等）

## 3. ロールバック手順

| 元 Step | 逆操作 | 検証 |
|---|---|---|
| 全体 | 不要（旧コードでも再構築後データは閲覧可能。壊れる操作なし） | 旧ビルドでサマリ表示確認 |
| Step 3 tombstone | 万一必要なら execution_record から再 upsert（同 migration の再実行で再現可能 = データ正本は record 側） | 件数一致 |

## 4. ダウンタイム

- 要否: 不要（クライアント内、初回ロード時に非同期実行）

## 5. 失敗時の対応

| 失敗箇所 | 対応 |
|---|---|
| migration 中の例外 | フラグを書かずに中断 → 次回ロードで再実行（各 put は冪等 id） |
| 同期競合（複数端末） | last-write-wins（既存 _shared/local-sync の競合解決に委ねる。両端末とも同じ再導出をするため収束） |

## 6. 事前準備

- バックアップ: 不要（正本 = execution_record、達成はキャッシュ。summaryRepo の既存コメント通り）
- ステージング検証: ローカル E2E（E2E-MG-01）で代替
- 関係者通知: 不要（単一開発者）

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-13 | 初版作成 | /flow:revise |
