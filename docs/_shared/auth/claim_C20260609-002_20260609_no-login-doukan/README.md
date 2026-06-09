# クレーム判定: ログイン動線が無い（契約済み Google ログインの未実装）

- **claim id**: C20260609-002
- **実施日**: 2026-06-09
- **対象**: ../README.md（_shared/auth）
- **基準 SPEC**: ../001__shared_auth_SPEC.md §3（linkWithGoogle）
- **クレーム内容**: 「ログインがない / 契約違反。画面や機能を作っても動線がない。auditで検知しない」
- **状態**: 判定完了
- **判定結果**: バグ (fix) — 契約済み・✅完了扱いの Google ログイン/アカウント連携 UI 動線が未実装
- **分岐先**: `/flow:fix _shared/auth C20260609-002 --severity=high`（tip=ゲスト確定、ログイン動線=引き継ぎ/同期用）

## このフォルダのドキュメント
- `000_CLAIM_REPORT.md` — クレーム整理（期待/現実/影響）
- `001_TRIAGE.md` — 三項照合 + 判定根拠 + 推奨分岐先 + 付随論点（tip-gating × O46）

## 関連
- flow 横展開: perspectives O22 required_signals（a9ada65）/ audit #4 3.6（d119cd5）/ CF-20260609-009
- O55 orphaned-route（route 前提のため本件は非該当、#4 3.6 が補完）
