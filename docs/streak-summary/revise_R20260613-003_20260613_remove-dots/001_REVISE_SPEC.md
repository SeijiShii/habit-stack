# streak-summary 変更仕様書（達成日ドット表示の廃止）

> **改修種別**: 機能削除（UI 要素の撤去 + 関連 dead code 整理）
> **issue / slug**: R20260613-003 / remove-dots
> **基準 SPEC**: `../001_streak-summary_SPEC.md`
> **最終更新**: 2026-06-13
> **タグ**: stateful（達成日集計）

---

## 1. 変更概要

継続画面（`SummaryPage`, ルート `/summary`）に表示している達成日ドット（`AchievementDots`、達成=accent の丸 / 未達=空丸）が、狭幅で `flex-wrap` により縦に折り返して縦並びになり見栄えが崩れる。この**丸表示そのものを廃止**する。継続の可視化は継続率バー（`RateGauge`）と「N日つづいています」テキストで引き続き提供するため、情報の本質は失われない。`AchievementDots` コンポーネントと、それ専用に算出していた `summarize().dots` は不要となるため整理（dead code 削除）する。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 継続可視化 | 継続率バー + 連続日数テキスト + 達成日ドット列 | 継続率バー + 連続日数テキスト（**ドット廃止**） | 狭幅での縦並び崩れ。情報は率/連続日数で代替可能 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `SummaryPage` 描画 | `<RateGauge/> <streak/> <AchievementDots/>` | `<RateGauge/> <streak/>`（AchievementDots 削除） | 互換（表示削除のみ） |
| `summarize()` 戻り値 | `{ achievedDays, totalDays, rate, currentStreak, isEmpty, dots[] }` | `{ achievedDays, totalDays, rate, currentStreak, isEmpty }`（`dots` 削除） | 内部 API。消費者は SummaryPage のみ |
| `components.tsx` | `AchievementDots`, `RateGauge` | `RateGauge` のみ（`AchievementDots` 削除） | 互換（未使用化） |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| （なし） | `daily_achievements` 等の永続データは不変。表示・派生計算のみ削除 | 不要 |

### 2.4 バリデーション・エラー変更
変更なし。空状態（「まだ記録がありません」）は維持。

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `SummaryPage.tsx` | 中 | ドット描画行と import を削除（直接対象） |
| `components.tsx` | 低 | `AchievementDots` 削除 |
| `model/summarize.ts` | 低 | `dots`/`Dot` 型と算出ロジック削除 |
| `model/summarize.test.ts` | 低 | dots 関連テスト削除 |
| `SummaryOverviewPage`（総覧） | なし | ドットを使っていない。影響なし |

## 4. 後方互換性

- **互換維持**: ✅（表示要素と内部派生値の削除のみ。永続データ・公開契約に影響なし）
- 非互換変更なし。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅
- 手順: 当該コミットを revert（DB 変更なし）。

## 6. リリース戦略

- **方式**: 一括（低リスクな表示削除。フィーチャーフラグ不要）
- ロールアウト: 同日 UI 改修バッチ（R20260613-002/-004）と合わせて次回 release。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
継続画面は「期間切替（7日/30日）→ 継続率バー + 『N日つづいています』」を表示。達成日ドットは表示しない。空状態は前向きメッセージのまま。

### 7.2 入出力（新仕様）
`summarize(records, dates)` は `{ achievedDays, totalDays, rate, currentStreak, isEmpty }` を返す（`dots` なし）。

### 7.3 データモデル（新仕様）
変更なし。

### 7.4 バリデーション・エラー（新仕様）
変更なし。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- charter §2.2 / [論点-001]（罪悪感回避）: 未達を danger 色にしないという原則はドット廃止により論点自体が縮小。率バーは従来どおり中立表現。
- ShareButton（O31）・期間切替は不変。

## 8. タグ別追加項目
- **stateful**: 達成日の集計（`getAchievements`）は不変。ドットは集計結果の一表現にすぎず、撤去しても集計・連続日数・率に影響なし。

## 9. 未決事項

> 現時点で論点なし (2026-06-13)。`dots` の削除範囲（表示のみ撤去 vs モデルからも削除）は、消費者が `SummaryPage` 単一であることを確認済みのためモデルごと削除で確定（auto-pick、Class A）。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-13 | 初版作成 | /flow:revise |
