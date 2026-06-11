# 単体テストレポート: execution R20260611-001（計時状態の永続化・復帰）

## 実施日時
2026-06-11（JST）

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md] - 単体テスト計画

## テスト実行環境
- ランタイム: Node + Vitest 2.1.9
- DOM: happy-dom / fake-indexeddb（IndexedDB 模擬）

## テスト結果（追加・変更分）

| # | テストケース | テストファイル | 結果 |
|---|------------|-------------|------|
| U-R1-01/02/B1/B2/B3/E1 | 4H キャップ境界 | model/elapsed.test.ts | ✅ |
| U-HB-01/02/03/E1/E2 | ハートビート save/load/clear/owner不一致/破損 | model/heartbeat.test.ts | ✅ |
| U-REC-01〜03/B1/E1/E2 | decideRecovery resume/autoEnd/境界/fallback/巻き戻し | model/recovery.test.ts | ✅ |
| U-LOGIN-01/02 | isLoginPath（/account=true, summary=false） | model/recovery.test.ts | ✅ |
| U-REC-05 | restoreInProgress 損失なし復元 + found id 採用（R6） | model/executionRepo.test.ts | ✅ |
| U-REC-06/07 | endInProgressNow 0秒非達成 / >0秒達成（R3/R8） | model/executionRepo.test.ts | ✅ |
| E-RESUME | マウント復元（開始に戻らない） | ExecutionPage.test.tsx | ✅ |
| E-IDLE×2 | 4H超 自動終了 + strict 達成 | ExecutionPage.test.tsx | ✅ |

## 追加テストケース
| # | 対象 | 追加理由 |
|---|------|---------|
| restoreInProgress の id 採用 | repo | spec-review R6（日跨ぎ重複防止）の回帰防止 |
| endInProgressNow no-op | repo | 進行中なし時の安全確認 |

## サマリー

| 項目 | 値 |
|------|-----|
| execution 関連テスト | 53件（elapsed10 / heartbeat5 / recovery10 / repo8 / machine9 / page11） |
| プロジェクト全体 | 167件 |
| 成功 | 167件 |
| 失敗 | 0件 |
| 成功率 | 100% |
| typecheck | clean |

## 既知の制約（リグレッションではない）
- 15秒 backend の実ネットワーク push は SyncQueue の App マウント（既存ギャップ）に依存。本改修は outbox 投入まで（101 差分参照）。
