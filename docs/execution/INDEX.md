# execution ドキュメントインデックス

**最終更新**: 2026-06-08 16:10
**生成元**: /flow:concept (初期化)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
時間ベース実行フロー（開始/終了/一時停止/再開、タイムスタンプ記録、今日メモ）

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | 001_execution_SPEC.md | SPEC | 設計済 | 2026-06-08 | 時間ベース実行状態機械 + タイムスタンプ経過 + 今日メモ + 達成記録 |
| 002 | 002_execution_PLAN.md | PLAN | 設計済 | 2026-06-08 | machine/elapsed/repo/hook/UI 4Phase |
| 003 | 003_execution_UNIT_TEST.md | UNIT_TEST | 設計済 | 2026-06-08 | 全遷移/経過/復元/穴あき達成 |
| 004 | 004_execution_E2E_TEST.md | E2E_TEST | 設計済 | 2026-06-08 | 実行フロー + 背景化/リロード経過 + offline + 視覚 |
| 101 | 101_execution_IMPL_REPORT.md | IMPL_REPORT | 実装完了 | 2026-06-08 | machine/elapsed/repo/hook/page |
| 102 | 102_execution_UNIT_TEST_REPORT.md | UNIT_TEST_REPORT | 実装完了 | 2026-06-08 | 15テスト green |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| `revise_R20260610-001_20260610_exec-buttons-simplify/` | revise | R20260610-001 / exec-buttons-simplify | 実装完了 | 実行画面の「終了」ボタン削除 + 「次の活動へ」表記統一（表示層のみ、135 green） | `INDEX.md` |
| `claim_C20260610-001_20260610_timer-frozen-display/` | claim | C20260610-001 / timer-frozen-display | 判定完了→fix | 計時中の経過時間が 00:00 で固まる→**バグ判定**。開始/現在時刻表示も同梱 | `001_TRIAGE.md` |
| `fix_C20260610-001_20260610_timer-frozen-display/` | fix | C20260610-001 / timer-frozen-display | 実装完了 | 計時中の経過ライブ表示 + 開始/現在時刻表示（表示層のみ、132 green）。起点: claim C20260610-001 | `INDEX.md` |

## 関連
- 親 concept: `../concept.md` §1.3.1 execution 行
- **依存**: activity-sets, _shared/local-sync, _shared/db, _shared/auth
- 実装コード: `src/features/execution/`

## AI アクセスガイド（読み込み順推奨）
- 機能概要 → README.md
- 仕様詳細 → 001_*_SPEC.md (まだ未生成)

## 機能性質タグ
- (まだ未確定。`/flow:feature` 実行時に決定)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
