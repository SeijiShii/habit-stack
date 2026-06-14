# クレーム判定: Google ログインボタンが無反応

- **claim id**: C20260614-002
- **実施日**: 2026-06-14
- **対象**: ../README.md（_shared/auth）
- **基準 SPEC**: ../001__shared_auth_SPEC.md
- **クレーム内容**: Googleログインが設定済みだがボタンを押しても何も起きない
- **状態**: 判定完了 → fix 分岐済
- **判定結果**: バグ(fix)。**根本原因は §7 で更新**。当初の本番設定欠落仮説は実機リモートデバッグで否定（PC で client_id 有効遷移を確認）→ 確定原因 = **Clerk reverification 403（aged guest session）**。`createExternalAccount`（機密操作）が aged session を 403 で弾き、ゲストは factor 無しで reverification 完了不能 + 回復動線無しで恒久的に詰む。コードは catch 無しで 403 を無言握り潰し。
- **分岐先**: `../fix_C20260614-002_20260614_google-link-reverification/`（CODE=403 catch+可視化 実装済 unit green / functional fix=Clerk Dashboard reverification 緩和 Class C）。

## このフォルダのドキュメント
- `000_CLAIM_REPORT.md` — クレーム整理（期待/現実/影響）
- `001_TRIAGE.md` — 三項照合 + 判定根拠 + remediation（PRIMARY=設定 / SECONDARY=小コード）

## 関連
- 本 claim の修正: `../fix_C20260614-002_20260614_google-link-reverification/`（reverification 403 catch+可視化 / Clerk 設定緩和）
- 前回 fix（Google ログイン動線実装）: `../fix_C20260609-002_20260609_google-login-doukan/`
