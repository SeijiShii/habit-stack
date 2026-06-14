# 改修 #R20260615-001 ドキュメントインデックス

**issue / slug**: R20260615-001 / account-switch-stop-sync
**実施日**: 2026-06-15
**状態**: テスト完了（unit 245 green / tsc clean / E2E 24 green）

<!-- auto-generated-start -->

## ファイル一覧
| 番号 | ファイル | 種別 | 最終更新 |
|---|---|---|---|
| — | README.md | 概要 | 2026-06-15 |
| 001 | 001_REVISE_SPEC.md | 変更仕様書（停止条件緩和 + 確認 + 同期ポリシー + データ消失是正） | 2026-06-15 |
| 002 | 002_REVISE_PLAN.md | 変更計画書（LoginEndGuard 撤去 / 確認ゲート / wipeOwner 再利用 / 4 Phase） | 2026-06-15 |
| 003 | 003_REVISE_UNIT_TEST.md | 単体テスト計画（確認分岐 / wipe / 上書き / 保持） | 2026-06-15 |
| 004 | 004_REVISE_E2E_TEST.md | E2E 計画（緩和/確認/上書き/削除 + リグレッション + 表示残存観点） | 2026-06-15 |
| 905 | 905_REVISE_SPEC_REVIEW.md | 設計レビュー（R1-R6、P91 追加） | 2026-06-15 |
| 101 | 101_REVISE_IMPL_REPORT.md | 実装レポート | 2026-06-15 |
| 102 | 102_REVISE_UNIT_TEST_REPORT.md | 単体テストレポート（245 green） | 2026-06-15 |
| 103 | 103_REVISE_E2E_REPORT.md | E2E レポート（24 green、E-01/E-01b 追加） | 2026-06-15 |

## 関連
- 親機能 INDEX: `../INDEX.md`
- 基準 SPEC: `../001__shared_auth_SPEC.md`
- 過去改修: `../revise_R20260611-002_*`（O54 削除）, `../../../execution/revise_R20260614-001_*`（計時中可視化）
- 起点: `../claim_C20260614-002_*` / `../fix_C20260614-002_*`（Google ログイン統合・自動分岐）
- 後続（別起票）: 計時停止後の「進行中」表示残存 → `/flow:fix execution`
- AI_LOG: `../../../AI_LOG/D20260615_001_revise__shared_auth_R20260615-001.md`

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
