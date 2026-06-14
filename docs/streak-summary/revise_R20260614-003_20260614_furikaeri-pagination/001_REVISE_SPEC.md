# streak-summary 変更仕様書（活動記録のページネーション）

> **改修種別**: 機能追加（表示のページング、UI のみ）
> **issue / slug**: R20260614-003 / furikaeri-pagination
> **基準 SPEC**: `../001_streak-summary_SPEC.md`
> **最終更新**: 2026-06-14
> **タグ**: analytics 寄りの閲覧画面（穏やかな UI、O38/O39）
> **状態**: 実装完了（unit green）

---

## 1. 変更概要

ふりかえり画面（`SummaryPage`, ルート `/summary`）の「活動の記録」テーブル（`ActivityTable`）は、`getActivities(setId)` で取得した全セッション（1 セッション = 1 行、startedAt 降順 / newest first）を**上限なしで全件描画**していた。活動記録は継続するほど累積で増え続けるため、長期ユーザーでは行数が肥大化し視認性が落ちる。

本改修では、活動記録を **10 件/ページ**でページネーションする。`SummaryPage` に `page` state を持たせ、全件配列を `slice(page*10, page*10+10)` した結果だけを `ActivityTable` に渡す。活動が 10 件を超えるときのみ、静かなトーンのページ操作 nav（「前へ」/「{現在} / {総ページ}」/「次へ」）を表示する。リポジトリ層（`summaryRepo.getActivities`）は据え置き（全件取得のまま、ページングは画面側で実施）。

煽らない analytics 画面のトーン（O38/O39）に合わせ、ページ操作も控えめな見た目（プレーンなボタン + テキストインジケータ）に留める。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 活動記録の一覧 | 全セッションを 1 画面に全件表示（上限なし） | 最新 10 件/ページで表示し、10 件超のとき前へ/次へで移動 | 累積で肥大化し視認性が低下するため |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `SummaryPage` 描画 | `<ActivityTable activities={q.data.activities}/>`（全件） | `page` state を持ち `activities.slice(cur*10, cur*10+10)` を渡す。10 件超のみページ nav 表示 | 互換（表示のみ） |
| `ActivityTable` props | `activities: Activity[]`（全件） | `activities: Activity[]`（slice 済み）。**シグネチャ・実装ともに変更なし** | 完全互換 |
| `summaryRepo.getActivities` | 全件返却 | 全件返却（**据え置き**） | 変更なし |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| （なし） | 永続データ（`execution_session` / `execution_record` 等）は不変。表示の切り出しのみ | 不要 |

### 2.4 バリデーション・エラー変更
変更なし。空状態（活動 0 件で `ActivityTable` は `null`）・記録なしの前向きメッセージは従来どおり。ページ操作は範囲外に出ない（先頭で「前へ」disabled、末尾で「次へ」disabled、`cur = Math.min(page, pageCount-1)` でガード）。

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `SummaryPage.tsx` | 中 | `page` state + セット切替時の page リセット（useEffect）+ `slice` + ページ操作 nav の追加（直接対象） |
| `components.tsx`（`ActivityTable`） | 低 | 受け取る配列が slice 済みになるだけ。コードは変更なし |
| `model/summaryRepo.ts`（`getActivities`） | なし | 据え置き（全件取得のまま） |
| 期間ボタン（7/30/全期間） | なし | 達成率（RateGauge/streak）にのみ作用。活動記録のページングとは独立 |

## 4. 後方互換性

- **互換維持**: ✅（**完全互換**。表示の切り出しのみで、props シグネチャ・永続データ・リポジトリ契約に影響なし）
- 非互換変更なし。10 件以下のセットでは見た目・挙動とも従来と完全に同一（ページ操作 nav 非表示）。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅
- 手順: 当該コミットを revert（DB 変更なし、マイグレーションなし）。revert で全件描画に戻る。

## 6. リリース戦略

- **方式**: 一括（低リスクな表示改善。フィーチャーフラグ不要）
- ロールアウト: 次回 release バンドルに同梱。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
ふりかえり画面でセットを選ぶと、そのセットの活動記録が**最新 10 件**表示される。活動が 10 件を超える場合のみ、テーブル下部にページ操作 nav（`aria-label="活動の記録ページ"`）が出る:

- 「前へ」ボタン: 先頭ページで `disabled`。クリックで 1 ページ戻る。
- インジケータ: `data-testid="page-indicator"` の「{cur+1} / {pageCount}」テキスト。
- 「次へ」ボタン: 末尾ページで `disabled`。クリックで 1 ページ進む。

セット切替（`setId` 変更）で `page` は 0（先頭）にリセットされる（`useEffect([setId])`）。

### 7.2 入出力（新仕様）
- `PAGE_SIZE = 10`（定数）。
- `pageCount = Math.max(1, Math.ceil(activities.length / PAGE_SIZE))`。
- `cur = Math.min(page, pageCount - 1)`（範囲外ガード）。
- `pageItems = activities.slice(cur*PAGE_SIZE, cur*PAGE_SIZE + PAGE_SIZE)` を `ActivityTable` に渡す。
- 並び順は従来どおり newest first（startedAt 降順）。よって 1 ページ目 = 最新 10 件。

### 7.3 データモデル（新仕様）
変更なし。

### 7.4 バリデーション・エラー（新仕様）
- `page` は `setPage((p) => Math.max(0, p-1))` / `Math.min(pageCount-1, p+1)` でクランプ。
- 活動 0 件のとき `ActivityTable` は `null` を返す（従来どおり）。ページ nav も非表示。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- **穏やかな UI（O38/O39）**: ページ操作は煽らない静かなトーン（プレーンなボタン + 「{n} / {m}」テキスト）。煽り表現・派手なバッジは使わない。
- 期間切替（7/30/全期間）・ShareButton（O31）・セット切替ドロップダウンは不変。
- アクセシビリティ: ページ nav に `aria-label="活動の記録ページ"`。境界ページでボタンを `disabled`。

## 8. タグ別追加項目
- **analytics 寄りの閲覧画面**: 活動記録は「振り返って眺める」ための情報。ページングは閲覧性を保つための表示制御で、集計値（率・連続日数）には一切影響しない。トーンは穏やかさを維持（O38/O39）。

## 9. 未決事項

> 現時点で論点なし (2026-06-14)。ページサイズ（10 件）は要望どおり固定。ページングを画面側で行う（リポジトリ据え置き）方針は、現状データ規模ではメモリ・性能とも問題なく、契約を変えない最小変更として確定（auto-pick、Class A）。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版作成（実装完了・unit green を反映） | /flow:revise |
