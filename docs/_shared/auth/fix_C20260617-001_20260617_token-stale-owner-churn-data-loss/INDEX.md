# バグ修正 #C20260617-001 ドキュメントインデックス

**issue / slug**: C20260617-001 / token-stale-owner-churn-data-loss
**重大度**: high
**実施日**: 2026-06-17
**状態**: 実装完了（unit 272 green / tsc clean、bousai guest-JWT 移植 + churn 源削除）→ /flow:e2e or release-pre

<!-- auto-generated-start -->

## ファイル一覧
| 番号 | ファイル | 種別 | 最終更新 |
|---|---|---|---|
| 000 | 000_調査レポート.md | 調査 | 2026-06-17 |
| 001 | 001_ROOT_CAUSE.md | 根本原因（5 Whys） | 2026-06-17 |
| 002 | 002_FIX_PLAN.md | 修正計画（bousai 移植） | 2026-06-17 |
| 003 | 003_REGRESSION_TEST.md | リグレッションテスト | 2026-06-17 |
| 004 | 004_POSTMORTEM.md | Postmortem | 2026-06-17 |
| 101 | 101_FIX_IMPL_REPORT.md | 実装レポート | 2026-06-17 |
| 102 | 102_FIX_UNIT_TEST_REPORT.md | 単体テストレポート | 2026-06-17 |
| — | README.md | 概要 | 2026-06-17 |

## 関連
- 親 INDEX: `../INDEX.md`
- 起点クレーム: `../claim_C20260617-001_20260617_token-stale-owner-churn-data-loss/001_TRIAGE.md`
- 範型: bousai-bag-checker `src/shared/auth/*`（revise_003）
- tooling 是正: flow-suite CF-20260617-001（audit #4 step 3.9 / perspectives O22 (D) / scaffold §1.7）

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
