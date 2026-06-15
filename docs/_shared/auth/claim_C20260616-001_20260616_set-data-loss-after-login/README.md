# クレーム判定: ログイン状態で活動セットがパーシャルに消失

- **claim id**: C20260616-001
- **実施日**: 2026-06-16
- **対象**: ../README.md（_shared/auth、同期/owner 境界。実体は _shared/local-sync と協働）
- **基準 SPEC**: ../001__shared_auth_SPEC.md / ../revise_R20260615-001_20260615_account-switch-stop-sync/
- **クレーム内容**: 昨日夕方に Google ログイン状態で「朝の勉強」「夕方の勉強」両セットを作成・計時・振り返り登録まで確認。今朝「夕方の勉強」セットと実績だけ消失（パーシャル）。ログインは継続中。
- **状態**: 判定完了 → fix 分岐済
- **判定結果**: **バグ(fix)**。期待（ログイン状態でデータ保持・パーシャル消失禁止）= SPEC 記載 ≠ 現実（夕方セット+実績消失）。昨日デプロイの R20260615-001 が導入した `wipeOtherOwners`（owner 不一致ローカルの物理削除）/ deviceOverwrite marker / 強制停止データ消失是正と発生タイミングが強く整合 = 回帰最有力。根本原因は単一未確定（複数機序候補）→ fix の調査に委譲。
- **分岐先**: `../fix_C20260616-001_20260616_set-data-loss-after-login/`

## このフォルダのドキュメント

- `000_CLAIM_REPORT.md` — クレーム整理（期待 / 現実 / 文脈 / 影響 / 報告経路）
- `001_TRIAGE.md` — 三項照合 + 判定根拠 + 調査仮説群 + 分岐先

## 関連

- 本 claim の修正: `../fix_C20260616-001_20260616_set-data-loss-after-login/`
- 中心リリース（疑義の起点）: `../revise_R20260615-001_20260615_account-switch-stop-sync/`
- 関連 claim: `../claim_C20260614-002_20260614_google-login-no-op/`
- local-sync 設計: `../../local-sync/001__shared_local-sync_SPEC.md`
