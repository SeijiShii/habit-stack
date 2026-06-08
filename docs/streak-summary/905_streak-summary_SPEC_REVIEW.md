<!-- auto-generated-start -->
# 設計レビューレポート — streak-summary

**レビュー日**: 2026-06-08 / **実施**: Claude (Opus 4.8) / **モード**: auto-pick
**入力**: 001-004 / **観点**: 組み込み + P1-P82 / **前提**: greenfield。

## 1. サマリー
| 観点 | 評価 | 備考 |
|---|---|---|
| 集計の明確性 | OK | 継続率=達成日/対象日、連続日数、完遂率 |
| 読み書きソース(P5) | OK | daily_achievements（キャッシュ）読み、正本=records 再計算可（db R1 連動） |
| UX 安全性 | OK | 未達=空ドット中立、罪悪感回避（charter §2.2/[論点-001]） |

## 2. 指摘事項
### [R1] 対象日数の定義 (severity=Medium, P15)
- **問題**: 継続率の分母（対象日数）が曖昧だと率が変動。
- **推奨**: 対象日数 = **セット存在期間 ∩ 指定期間**（セット作成日以降〜今日）。未来日除外。summarize で明示。
- **chosen**: セット存在期間 ∩ 指定期間（feature 設計 §6 で確定）。auto-recommended。
- **反映先**: 002（既存記載で充足）。

### [R2] daily_achievements 欠落時の再計算経路 (severity=Low, db R1 連動)
- **推奨**: キャッシュ欠落時 execution_records から summarize で再計算（db spec-review R1 と整合）。
- **chosen**: 再計算経路を summarize に実装（auto-recommended）。

## 3. コードベース調査: greenfield。Critical/High なし。
## 4. 設計判断ログ
| # | 判断 | 結論 | type |
|---|---|---|---|
| R1 | 対象日数定義 | セット存在期間∩指定期間 | auto-recommended |

## 5. 次のステップ: `/flow:tdd streak-summary`（execution 後）。
<!-- auto-generated-end -->
