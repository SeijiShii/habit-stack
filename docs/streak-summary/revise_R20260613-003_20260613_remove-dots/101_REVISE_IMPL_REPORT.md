# 実装レポート: streak-summary R20260613-003（達成日ドット表示の廃止）

## 実装日時
2026-06-13 17:42 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md] / [002_REVISE_PLAN.md] / [003_REVISE_UNIT_TEST.md]
- [AI_LOG セッション](../../../AI_LOG/D20260613_011_tdd_streak-summary_revise_R20260613-003.md)

## 変更一覧

### Phase 1: モデルからの dots 除去（軽・メイン直接）
- `model/summarize.ts` — `Summary` から `dots: Dot[]` を削除、return から `dots` を除去。`Dot` interface は export を外し内部表現に降格（達成日数・連続日数の算出には引き続き局所 `dots` 配列を使用）。
- `model/summarize.test.ts` — B2 の `s.dots.find(...)` アサーションを `expect(s.achievedDays).toBe(2)`（抜けた日を数えない検証）に置換。

### Phase 2: UI からのドット撤去（軽・メイン直接）
- `SummaryPage.tsx` — `<AchievementDots dots={summary.dots} />` 行と `AchievementDots` import を削除（`RateGauge` import は維持）。
- `components.tsx` — `AchievementDots` 関数と `Dot` import を削除（`RateGauge` のみ残存）。
- `SummaryPage.test.tsx` — SM-S1 を「ドット廃止」に更新し、`getByLabelText('達成日')` を `queryByLabelText('達成日')).toBeNull()` に置換。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | なし |
| 計画から省略した変更 | なし |
| 想定外の問題と対処 | なし（`Dot` の消費者は components.tsx 単独だったため型エラーなし） |

## PR Description

### タイトル
streak-summary: ふりかえり画面の達成日ドット（丸）表示を廃止（R20260613-003）

### 概要
継続画面で狭幅時に縦並びに崩れていた達成日ドットを廃止。継続率バーと「N日つづいています」テキストで継続を可視化する。`Summary.dots` と `AchievementDots` を整理（dead code 削除）。

### 変更内容
- `Summary` から `dots` 除去（内部の達成判定計算は維持）
- `AchievementDots` コンポーネント削除、`SummaryPage` からドット撤去
- 関連単体テストを集計値検証 / ドット非存在検証に更新

### テスト
- 全体 200/200 green、typecheck clean
