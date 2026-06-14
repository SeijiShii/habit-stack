# streak-summary ドキュメントインデックス

**最終更新**: 2026-06-14
**生成元**: /flow:revise R20260614-003

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
継続サマリ（達成日判定・継続日数・継続率・期間指定可視化）

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | 001_streak-summary_SPEC.md | SPEC | 設計済 | 2026-06-08 | 継続率/連続日数/達成ドット + 罪悪感回避UX |
| 002 | 002_streak-summary_PLAN.md | PLAN | 設計済 | 2026-06-08 | summarize/repo/api/UI + Recharts |
| 003 | 003_streak-summary_UNIT_TEST.md | UNIT_TEST | 設計済 | 2026-06-08 | 継続率/連続/穴あき達成/空状態 |
| 004 | 004_streak-summary_E2E_TEST.md | E2E_TEST | 設計済 | 2026-06-08 | サマリ表示/期間切替 + 未達非danger視覚 |
| 101 | 101_streak-summary_IMPL_REPORT.md | IMPL_REPORT | 実装完了 | 2026-06-08 | summarize/repo/components/page |
| 102 | 102_streak-summary_UNIT_TEST_REPORT.md | UNIT_TEST_REPORT | 実装完了 | 2026-06-08 | 8テスト green |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| revise_R20260614-003_20260614_furikaeri-pagination/ | revise | R20260614-003/furikaeri-pagination | テスト完了（unit green、E2E は unit 網羅） | ふりかえりの活動記録一覧を 10 件/ページでページネーション（フロント側 slice + 前へ/次へ、setId 切替で先頭へ） | [INDEX](./revise_R20260614-003_20260614_furikaeri-pagination/INDEX.md) |
| revise_O31_20260609_share-button/ | revise | O31/share-button | 実装完了 | シェアボタン追加 (O31 公開周知導線) | [INDEX](./revise_O31_20260609_share-button/INDEX.md) |
| revise_R20260613-001_20260613_reflect-overview-streak-fix/ | revise | R20260613-001/reflect-overview-streak-fix | E2E green (2026-06-13) | 振り返り総覧(ドロップダウン+折りたたみ+合計時間) + streak ローカル日付是正 + 達成日再構築 migration | [INDEX](./revise_R20260613-001_20260613_reflect-overview-streak-fix/INDEX.md) |
| revise_R20260613-003_20260613_remove-dots/ | revise | R20260613-003/remove-dots | テスト完了（unit+E2E green） | ふりかえり画面の達成日ドット（丸）表示を廃止（縦並び崩れ解消、率バー+連続日数で代替、dead code 整理） | [INDEX](./revise_R20260613-003_20260613_remove-dots/INDEX.md) |

## 関連
- 親 concept: `../concept.md` §1.3.1 streak-summary 行
- **依存**: execution, _shared/db
- 実装コード: `src/features/streak-summary/`

## AI アクセスガイド（読み込み順推奨）
- 機能概要 → README.md
- 仕様詳細 → 001_*_SPEC.md (まだ未生成)

## 機能性質タグ
- (まだ未確定。`/flow:feature` 実行時に決定)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
