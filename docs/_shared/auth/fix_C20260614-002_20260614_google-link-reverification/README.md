# バグ修正: aged guest session の Google 連携 reverification 403

- **issue / slug**: C20260614-002 / google-link-reverification
- **重大度**: high
- **実施日**: 2026-06-14
- **対象**: ../README.md（_shared/auth）
- **基準 SPEC**: ../001__shared_auth_SPEC.md §3（linkWithGoogle）
- **起点クレーム**: ../claim_C20260614-002_20260614_google-login-no-op/001_TRIAGE.md §7・§8（root cause 確定）
- **バグレポート**: 本番 /account「Google で引き継ぐ」が PC（fresh）では動くが aged guest session（スマホ）で無反応。`POST /v1/me/external_accounts → 403 "additional verification"`（chrome://inspect で確認）
- **状態**: 実装完了（unit green）。CODE 修正（catch + 可視化）実装済・auth suite 32 tests green / tsc clean。残 = Clerk Dashboard reverification 緩和（PRIMARY 機能修正、Class C）+ aged guest 実機 smoke

## このフォルダのドキュメント
- `000_調査レポート.md` — 症状/期待/影響/AI_LOG タイムライン（リモートデバッグで 403 確定）
- `001_ROOT_CAUSE.md` — 5 Whys（根本=fresh のみ検証で aged guest reverification を未捕捉）
- `002_FIX_PLAN.md` — 2 トラック（PRIMARY=Clerk 設定緩和 / CODE=403 catch+可視化、実装済 / option=session fresh 化は未実装）
- `003_REGRESSION_TEST.md` — 403→alert / linkErrorMessage 分岐 / 既存維持 / aged guest smoke
- `004_POSTMORTEM.md` — severity=high。検知=実機リモートデバッグ。再発防止（O22/release/code、CF-20260614-001）

## 関連
- 前回 fix（Google ログイン動線実装、本番 aged session を未検証）: `../fix_C20260609-002_20260609_google-login-doukan/`
- flow 横展開: CF-20260614-001（O22 required_signals_reverification / release §3.4 #4.5 / audit #4 step3.8）
- server merge 基盤: `../../../src/services/auth/dataOps.ts` `reassignOwner`（option トラックで使用想定）
