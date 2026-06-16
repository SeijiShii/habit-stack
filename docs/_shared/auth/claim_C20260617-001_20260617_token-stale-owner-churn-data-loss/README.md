# クレーム判定: 認証トークン陳腐化 → 再読み込みでデータ消失（再ログインでも復旧せず）

- **claim id**: C20260617-001
- **実施日**: 2026-06-17
- **対象**: ../README.md （_shared/auth）
- **基準 SPEC**: ../../../concept.md §1.1 UC8 / §3 NFR、../../local-sync/001__shared_local-sync_SPEC.md
- **クレーム内容**: ログイン後に作成したデータが、認証トークン（Clerk セッション）の陳腐化後の再読み込みでデバイスから消失。再ログインでも復旧しない。bousai-bag-checker の Google ログインでは起きない。
- **状態**: 判定完了 → 分岐実行（/flow:fix）
- **判定結果**: バグ (fix)
- **分岐先**: ../fix_C20260617-001_20260617_token-stale-owner-churn-data-loss/

## このフォルダに置くドキュメント

- `000_CLAIM_REPORT.md` — クレーム整理（期待 / 現実 / 文脈 / 影響 / 報告経路）
- `001_TRIAGE.md` — 判定レポート（三項照合 + バグ判定根拠 + 根本原因仮説 + 分岐先）

## 関連

- 別機序の先行データ消失 fix（デプロイ済）: ../fix_C20260616-001_20260616_set-data-loss-after-login/
- 連携失敗の素地: ../claim_C20260614-002_20260614_google-login-no-op/
- 分岐先: ../fix_C20260617-001_20260617_token-stale-owner-churn-data-loss/
