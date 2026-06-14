# 改修 #R20260615-001 ドキュメントインデックス

**issue / slug**: R20260615-001 / account-switch-stop-sync
**実施日**: 2026-06-15
**状態**: 設計完了（実装待ち）

<!-- auto-generated-start -->

## ファイル一覧
| 番号 | ファイル | 種別 | 最終更新 |
|---|---|---|---|
| — | README.md | 概要 | 2026-06-15 |
| 001 | 001_REVISE_SPEC.md | 変更仕様書（停止条件緩和 + 確認 + 同期ポリシー + データ消失是正） | 2026-06-15 |
| 002 | 002_REVISE_PLAN.md | 変更計画書（LoginEndGuard 撤去 / 確認ゲート / wipeOwner 再利用 / 4 Phase） | 2026-06-15 |
| 003 | 003_REVISE_UNIT_TEST.md | 単体テスト計画（確認分岐 / wipe / 上書き / 保持） | 2026-06-15 |
| 004 | 004_REVISE_E2E_TEST.md | E2E 計画（緩和/確認/上書き/削除 + リグレッション + 表示残存観点） | 2026-06-15 |

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
