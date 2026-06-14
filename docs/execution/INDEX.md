# execution ドキュメントインデックス

**最終更新**: 2026-06-14
**生成元**: /flow:concept (初期化) → /flow:revise R20260614-001/002

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
| `fix_F20260615-001_20260615_stale-in-progress-badge/` | fix | F20260615-001 / stale-in-progress-badge | 実装完了（unit 246 + E2E 25 green） | 計時停止後も「進行中」バッジ／復帰導線が残る。根本原因=done 化時に `["in-progress-session"]` query を invalidate しない（R20260614-001 で読み取りクエリのみ導入）。修正=ExecutionPage done 検知 effect で invalidateQueries | `INDEX.md` |
| `revise_R20260614-001_20260614_running-session-visible-nav/` | revise | R20260614-001 / running-session-visible-nav | テスト完了（unit+E2E green） | 計時中セッションの可視化と導線確立。セット一覧に「進行中」表示 + 進行中セット選択で活動画面へ復帰、セット詳細「開始」で中間ページを挟まず自動開始、別セット計時中の二重開始防止（幽霊セッション根絶） | `INDEX.md` |
| `revise_R20260614-002_20260614_activity-periods/` | revise | R20260614-002 / activity-periods | テスト完了（unit+E2E green） | 活動を 1:N period 化し中断時間を経過から除外（pause で period を閉じ resume で開く）。表示開始時刻は最初の period。起点: claim C20260614-001 | `INDEX.md` |
| `claim_C20260614-001_20260614_pause-time-counted/` | claim | C20260614-001 / pause-time-counted | 判定完了→revise | 中断時間が活動の経過に算入される→**仕様変更判定**（単一ペア→1:N period）。分岐先 revise R20260614-002 | `001_TRIAGE.md` |
| `revise_R20260613-004_20260613_set-total-time/` | revise | R20260613-004 / set-total-time | テスト完了（unit+E2E green） | セット全体の経過時間を計時画面に表示（全 record 合計、sessionElapsedSec 純関数 + formatDuration で振り返りと統一） | `INDEX.md` |
| `revise_R20260611-001_20260611_timing-persistence-resume/` | revise | R20260611-001 / timing-persistence-resume | E2E green | 計時状態の永続化・復帰（毎秒localStorage+15秒backend, account-scoped）+ 4H放置キャップ/自動終了 + ログイン遷移終了。unit 167 + E2E 6/6 green、StrictMode 復元バグ修正、last_saved_at migration 0001 | `INDEX.md` |
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
