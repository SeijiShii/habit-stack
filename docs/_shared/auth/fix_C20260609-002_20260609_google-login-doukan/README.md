# バグ修正: Google ログイン/連携動線の欠落

- **issue / slug**: C20260609-002 / google-login-doukan
- **重大度**: high
- **実施日**: 2026-06-09
- **対象**: ../README.md（_shared/auth）
- **基準 SPEC**: ../001__shared_auth_SPEC.md §3（linkWithGoogle）
- **起点クレーム**: ../claim_C20260609-002_20260609_no-login-doukan/001_TRIAGE.md（decision: D20260609-010-001）
- **バグレポート**: 「ログインがない / 契約違反。画面や機能を作っても動線がない」
- **状態**: 修正計画済（実装 = /flow:tdd 待ち）

## このフォルダのドキュメント
- `000_調査レポート.md` — 症状/期待/影響/AI_LOG タイムライン
- `001_ROOT_CAUSE.md` — 5 Whys（根本=契約2部の片方欠落 + audit 検出漏れ）
- `002_FIX_PLAN.md` — linkWithGoogle + /account 動線 + post-link sync + SPEC校正
- `003_REGRESSION_TEST.md` — 動線到達/linkWithGoogle/表示分岐/tip非ゲート
- `004_POSTMORTEM.md` — プロセス振り返り + 再発防止（O22/audit/claim 横展開済）

## 関連
- flow 横展開: CF-20260609-009（O22 required_signals + audit #4 3.6）/ CF-20260609-010（O46 donation）/ CF-20260609-011（claim auto-route）
- server merge 基盤: `../../../src/services/auth/dataOps.ts` `reassignOwner`（実装済・再利用）
