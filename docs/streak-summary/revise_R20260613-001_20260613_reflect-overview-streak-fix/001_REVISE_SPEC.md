# streak-summary 変更仕様書（振り返り総覧 + 連続日数の正確化）

> **改修種別**: 機能拡張 + 不具合是正（仕様欠陥の是正を含むため revise で一括対応）
> **issue / slug**: R20260613-001 / reflect-overview-streak-fix
> **基準 SPEC**: `../001_streak-summary_SPEC.md`
> **最終更新**: 2026-06-13
> **タグ**: offline-critical（ローカル集計）, analytics（既存継承）

---

## 1. 変更概要

振り返り（継続サマリ）まわりの 3 要望を一括改修する。
(1) グローバルナビ「継続」→ `/summary` が静的テキストのみで行き止まりになっている問題を、**セット選択ドロップダウン + 全セット総覧**を持つ「振り返り総覧ページ」への置き換えで解消。
(2) 「〇日つづいています」が実際より少なく出る問題を、達成日記録の **UTC 日付 → ユーザーローカル日付** 是正 +「今日未実施でも昨日までの連続を保つ」仕様明確化で修正（既存ローカルデータの再構築 migration を伴う）。
(3) 総覧ページで各セットを**折りたたみ可能 UI**（開閉）で一覧し、セット内の活動アイテムと**セット合計時間**（+アイテム別累計時間）を見られるようにする。

## 2. 変更前 vs 変更後

### 2.1 UC 変更

| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC6 (継続サマリ) | `/summary/:setId` のみ実体。`/summary` は「セット一覧から選んでください。」の静的文言だけで操作不能 | `/summary` = 振り返り総覧ページ。セット選択ドロップダウンで `/summary/:setId` へ遷移可能 | ナビ「継続」からの遷移が行き止まり（要望1） |
| UC6-OV (新規) | なし | 総覧ページに全セットを折りたたみ（`<details>`）で一覧。各セット: 開くとアイテム名 + アイテム別累計時間、ヘッダにセット合計時間（全期間累計）を表示 | セットと活動内容の振り返り一覧（要望3） |
| UC6 streak | 直近(=UTC今日)から遡って連続達成日を数える。今日未達成だと即 0 日。達成日自体が UTC 日付で記録 | 達成日・今日ともに**ユーザーローカル日付**。今日が未達成の場合は昨日を起点に連続を数える（今日は「保留」扱いで途切れにしない） | 2 日続けたのに 1 日と表示される（要望2） |

### 2.2 入出力変更

| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `/summary` ルート | 静的 `<p>` のみ | `SummaryOverviewPage`（ドロップダウン + details 一覧 + 合計時間） | 互換（URL 不変、表示強化のみ） |
| `SummaryRepo` | `getAchievements(setId, start, end)` のみ | + `getSetTotals(): Promise<SetTotal[]>`（execution_session×execution_record join、setId/itemId 別 elapsedSec 集計） | 互換（additive） |
| `summarize()` | 末尾(=配列最終日)が未達なら currentStreak=0 | 最終日が未達のときのみ 1 日スキップして前日から数える（today-pending 許容） | 表示値が変わる（正しい値になる方向） |
| 日付導出 | `toISOString().slice(0,10)`（UTC）が executionRepo.localDate / SummaryPage today / App sessionLocalId に散在 | 共通 util `localDateOf()`（ローカルタイムゾーンの YYYY-MM-DD）に統一 | 記録される date の意味が変わる → §4/migration |

### 2.3 データモデル変更

| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| daily_achievement | スキーマ不変。**date の意味**が UTC 日付 → ローカル日付に是正 | **要**（既存レコードを execution_record の startedAt から再構築、005 参照） |
| execution_session / execution_record | 変更なし（読み取り集計に利用） | 不要 |

### 2.4 バリデーション・エラー変更

| 対象 | 変更前 | 変更後 |
|---|---|---|
| 総覧ページ セット 0 件 | （ページ自体なし） | 「まだセットがありません」+ セット作成導線（`/sets`） |
| 総覧ページ 実行記録 0 件のセット | — | 合計時間 0:00 表示（エラーにしない、中立表現） |

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| streak-summary | 高 | 直接対象（SummaryPage / summarize / SummaryRepo / 新 OverviewPage） |
| execution | 中 | `executionRepo.localDate` の実装是正（コメント通りの仕様に修正、API 形不変） |
| _shared/app-shell (App.tsx) | 中 | `/summary` ルート差し替え + sessionLocalId の日付スタンプをローカル日付化 |
| _shared/local-sync | 低 | 再構築 migration が put/tombstone を発行（既存 outbox 経路をそのまま使用、同期層自体は不変） |

## 4. 後方互換性

- **互換維持**: ✅（UI は additive、API/スキーマ不変）
- ただし daily_achievement の **既存ローカルデータは UTC 日付で記録済み** → そのままでは是正後の today と整合しないため、初回ロード時にローカル再構築 migration を実行（005_REVISE_MIGRATION.md）。
- 再構築は execution_record（ISO タイムスタンプ保持）から再導出するため情報損失なし。`achieved` 判定は「有効経過 > 0 のアイテムが 1 つ以上」（strict 基準）で近似する（過去の auto/strict モード履歴は復元不能、既知の近似）。
- backend 同期: 再構築で更新/tombstone されたレコードは既存 outbox 経由で伝播（クライアント主導、サーバ側変更なし）。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅
- **migration のロールバック**: 不要扱い。再構築後のローカル日付データは旧コード（UTC today）でも閲覧可能（ズレが旧状態に戻るだけで破壊なし）。migration 実行済みフラグ（バージョンキー）は revert 後は単に未参照。
- 手順: git revert → 再デプロイ。DB/スキーマ変更なし。

## 6. リリース戦略

- **方式**: 一括（フィーチャーフラグ不要）
- 理由: スキーマ不変・additive UI・migration はクライアント内で冪等（バージョンフラグで 1 回実行）。
- ロールアウト: ローカル検証（unit + E2E）→ 本番 prod 直行（release §1.0c の既存方針を継承）。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC

**UC6-OV: 振り返り総覧（新規）**
1. ナビ「継続」→ `/summary` で総覧ページを表示。
2. ページ上部に**セット選択ドロップダウン**（`<select>`、ラベル「セットを選ぶ」）。選択すると `/summary/:setId`（既存の個別サマリ）へ遷移。
3. 下部に全セットの一覧。各セットは `<details>/<summary>` による折りたたみ。閉状態でも **セット名 + セット合計時間** が見える。
4. 開くと、そのセットの活動アイテム一覧（名前 + アイテム別累計時間）を表示。
5. 合計時間は**全期間累計**（execution_record.elapsedSec の合算、進行中レコード含む保存済み値）。表示形式は `H時間M分`（1 時間未満は `M分`、0 は `0分`）。
6. セット 0 件時は空状態メッセージ + `/sets` への導線。

**UC6 streak（是正）**
- 達成日（daily_achievement.date）と「今日」はともにユーザーのローカルタイムゾーンの YYYY-MM-DD。
- currentStreak: 表示期間の最終日（=今日）から遡って連続達成日を数える。**最終日のみ未達を許容**し（今日まだやっていないだけ）、その場合は前日から数える。前日も未達なら 0。
- 例: 達成 {6/11, 6/12}、今日 6/13 未実施 → 「2日つづいています」。6/13 実施後 → 3日。

### 7.2 入出力（新仕様）

```
SummaryRepo.getSetTotals(): Promise<SetTotal[]>
SetTotal = { setId: string; totalSec: number; items: { itemId: string; totalSec: number }[] }
集計: execution_record を execution_session.setId で引き、elapsedSec を setId / itemId 別に合算（owner スコープ、deletedAt 除外）。
セット名・アイテム名は setsRepo（既存 listSets/listItems）から取得し UI 層で結合。

localDateOf(d: Date): string  // 端末ローカル TZ の YYYY-MM-DD（新 util、src/services/time/）
```

### 7.3 データモデル（新仕様）
変更なし（§2.3 の通り date 解釈是正のみ）。

### 7.4 バリデーション・エラー（新仕様）
§2.4 の通り。集計レコード欠損（session に紐づかない record）は無視して継続（throw しない）。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- 集計はローカル（IndexedDB）完結、オフラインで全機能動作（既存 NFR 継承）。
- 総覧の集計はセット数 × 記録数が増えても 1 パスで O(records)。
- 罪悪感を煽らない表現を維持（未達を danger 色にしない、charter §2.2）。総覧の合計時間 0 も中立表現。

## 8. タグ別追加項目

- **offline-critical**: 総覧・migration ともネットワーク不要。migration は同期前のローカルデータにも安全（outbox 経由で後追い同期）。
- **analytics**: 既存イベントの変更なし。

## 9. 未決事項

### [論点-001] 総覧の合計時間に期間フィルタを付けるか
- **影響範囲**: SummaryOverviewPage / getSetTotals
- **詰めるべき問い**: 全期間累計のままでよいか、7/30 日フィルタを総覧にも置くか
- **候補案**: (a) 全期間のみ (b) 個別サマリと同じ 7/30 日切替
- **推奨**: (a) で出して反応を見る（要望は「セット内の合計時間を見れるように」のみ。総覧はシンプル優先）
- **判断期限**: 次回 revise まで保留可
- **担当**: seiji

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-13 | 初版作成 | /flow:revise |
