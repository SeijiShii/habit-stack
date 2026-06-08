# streak-summary 実装計画書

> **入力**: `./001_streak-summary_SPEC.md`, `../execution/`, `../_shared/`
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧（src/features/streak-summary/）

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `model/summarize.ts` | 達成日 → 継続率/連続日数/完遂率/ドット配列（純関数） | types | 130 |
| `model/summaryRepo.ts` | ローカル/サーバから daily_achievements 取得 | local-sync, auth | 70 |
| `api/summary.ts` | サーバ集計（withOwner） | db, auth | 80 |
| `hooks/useSummary.ts` | TanStack Query 集計取得 | summaryRepo | 40 |
| `SummaryPage.tsx` | サマリ画面（ドット/ゲージ/手応えカード） | design, Recharts | 170 |
| `components/AchievementDots.tsx` | カレンダー風ドット（達成=accent、未達=空） | design | 70 |
| `components/RateGauge.tsx` | 継続率ゲージ（穏やか） | design, Recharts | 60 |

## 2. 実装 Phase 分割
### Phase 1: summarize（純関数）
- 継続率 = 達成日/対象日。連続日数（途切れ検出）。完遂率。ドット配列。
- テスト: 各算出、穴あき日が達成カウント、空状態、未来日除外。
### Phase 2: summaryRepo + api/summary（withOwner）
- 認証時サーバ、匿名ローカル。テスト: owner 強制、ローカル集計一致。
### Phase 3: useSummary + UI（ドット/ゲージ/手応えカード）
- 罪悪感回避表現（未達=空ドット）。Recharts ゲージ。

## 3. 依存関係順序
```
summarize(純) → summaryRepo/api → useSummary → SummaryPage(+AchievementDots/RateGauge)
依存: execution(daily_achievements), _shared/db, _shared/local-sync, _shared/auth, design-system, Recharts
```

## 4. 既存ファイルへの影響
- app-shell が /summary ルート登録。

## 5. 横断フォルダへの追加・変更
- なし。

## 6. リスク・注意点
- 継続率の対象日数定義（セット作成日以降 or 期間全体）を summarize で明確化（推奨: セット存在期間 ∩ 指定期間）。
- 罪悪感回避（[論点-001]）: 未達を赤くしない、連続途切れを咎めない。視覚レビューで確認。

## 7. 完了の定義
- [ ] summarize/repo/api/hook/UI 実装
- [ ] 単体 green（継続率/連続/完遂率/穴あき達成/空状態）
- [ ] E2E（004）：実行→サマリに達成反映、期間切替
- [ ] design 適用 + 視覚レビュー（未達が失敗に見えない）green

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
