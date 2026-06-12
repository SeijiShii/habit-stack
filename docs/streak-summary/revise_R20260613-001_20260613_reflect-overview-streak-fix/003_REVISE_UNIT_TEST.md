# streak-summary 単体テスト計画（振り返り総覧 + 連続日数の正確化）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 summarize.test.ts / SummaryPage.test.tsx
> **最終更新**: 2026-06-13

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U-LD-01 | localDateOf | ローカル時刻 2026-06-13 08:00 相当の Date | "2026-06-13"（端末ローカル日付、UTC slice と異なるケースを TZ 固定で検証） |
| U-LD-02 | formatDuration | 0 / 90 / 3661 / 7200 | "0分" / "1分" / "1時間1分" / "2時間" |
| U-ST-01 | summarize streak | 達成 {6/11,6/12}、期間末尾 6/13 未達 | currentStreak=2（today-pending 許容） |
| U-ST-02 | summarize streak | 達成 {6/11,6/12,6/13}、末尾 6/13 | currentStreak=3 |
| U-OV-01 | overview 集計 | sessions(2 set) + records(elapsedSec 混在) | setId 別 totalSec / itemId 別 totalSec が合算一致 |
| U-OV-02 | SummaryRepo.getSetTotals | owner 混在 + deletedAt あり | 自 owner かつ未削除のみ集計 |
| U-MG-01 | rebuildAchievements | UTC 日付の daily_achievement + ISO startedAt の records | ローカル日付で upsert、旧ズレ日付は tombstone |
| U-MG-02 | rebuildAchievements 冪等 | 2 回連続実行 | 2 回目は無変化（フラグ or 内容同値） |
| U-PG-01 | SummaryOverviewPage | セット 2 件 + 記録あり | details 2 件、ヘッダにセット名+合計時間、開くとアイテム+時間 |
| U-PG-02 | SummaryOverviewPage ドロップダウン | セット選択 | `/summary/:setId` へ navigate |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U-PG-03 | SummaryOverviewPage | セット 0 件 | 空状態メッセージ + /sets 導線、throw しない |
| U-OV-03 | overview 集計 | session に紐づかない record | 無視して継続 |
| U-MG-03 | rebuildAchievements | execution_record 0 件 | 達成全 tombstone はせず no-op（記録なし owner を壊さない） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U-ST-03 | summarize streak | 末尾未達かつ前日も未達 | currentStreak=0 |
| U-ST-04 | summarize streak | 期間 1 日のみ・未達 | 0（スキップで配列外に出ない） |
| U-LD-03 | localDateOf | 日付境界（ローカル 00:00 / 23:59） | 同一ローカル日付 |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| summarize 既存「末尾未達で streak=0」系 | summarize.test.ts | 末尾未達 → 0 を期待 | 末尾のみ未達は前日から数える期待値に更新 | SPEC §7.1 仕様変更 |

## 3. 削除テストケース

なし。

## 4. リグレッション強化

- 既存 summarize（達成率・dots・isEmpty）/ SummaryPage（期間切替・空状態）/ ShareButton テストは全維持
- executionRepo の persist/restore 系テストは全維持（localDate の戻り値形式 YYYY-MM-DD は不変）

## 5. Mock 方針差分

| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| LocalStore | インメモリ fake | 同じ fake を migration / getSetTotals でも使用 | 一貫性 |
| TZ | 未考慮 | localDateOf テストのみ `TZ=Asia/Tokyo` 等で固定（vitest env） | UTC ズレ再現 |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承 |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-13 | 初版作成 | /flow:revise |
