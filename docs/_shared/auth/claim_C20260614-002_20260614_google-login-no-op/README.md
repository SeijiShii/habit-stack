# クレーム判定: Google ログインボタンが無反応

- **claim id**: C20260614-002
- **実施日**: 2026-06-14
- **対象**: ../README.md（_shared/auth）
- **基準 SPEC**: ../001__shared_auth_SPEC.md
- **クレーム内容**: Googleログインが設定済みだがボタンを押しても何も起きない
- **状態**: 判定完了
- **判定結果**: バグ(fix) — 根本原因は本番設定欠落（production Clerk instance に Google カスタム OAuth 未登録、CF-20260531-002）。コードは正しい。
- **分岐先**: 自動 route なし。remediation = `/flow:release` §3.1 social OAuth セットアップ（human dashboard = Class C/B）。二次的に `/flow:fix`（onLink のエラー表示）候補。

## このフォルダのドキュメント
- `000_CLAIM_REPORT.md` — クレーム整理（期待/現実/影響）
- `001_TRIAGE.md` — 三項照合 + 判定根拠 + remediation（PRIMARY=設定 / SECONDARY=小コード）

## 関連
- 前回 fix（Google ログイン動線実装）: `../fix_C20260609-002_20260609_google-login-doukan/`
