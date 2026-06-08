<!-- auto-generated-start -->
# 設計レビューレポート — execution

**レビュー日**: 2026-06-08 / **実施**: Claude (Opus 4.8) / **モード**: auto-pick
**入力**: 001-004 / **観点**: 組み込み + P1-P82 / **前提**: greenfield。

## 1. サマリー
| 観点 | 評価 | 備考 |
|---|---|---|
| 状態機械の明確性 | OK | running/paused/done、全遷移定義 |
| 記録の正確性 | OK | タイムスタンプ差分（生タイマー不使用）、now 注入でテスト決定的 |
| 達成判定 | OK | セット単位・穴あき許容（D20260608-003） |
| 副作用分岐(P11) | OK | pause/resume の paused_total_sec 分岐を含む |
| テストカバレッジ | OK | 全遷移 + 経過 + 復元 + 穴あき達成 |

## 2. 指摘事項
### [R1] 表示用 setInterval と記録の分離 (severity=Medium, P16)
- **問題**: 経過の「表示更新」と「記録値」の責務を混同しないこと（BE/FE 計算重複の P16）。
- **推奨**: **記録 = タイムスタンプ差分（now-start-paused）、表示 = setInterval で再計算描画のみ**。記録に setInterval 累積値を使わない。002 Phase 4 で明示済み。
- **chosen**: 表示と記録を分離（feature 設計で対応）。確認のみ。

### [R2] 端末時計戻りのクランプ (severity=Low)
- **推奨**: elapsed 負値は 0 にクランプ（003 E1）。auto-recommended。

### [R3] 進行中 session 復元の堅牢性 (severity=Low)
- **推奨**: IndexedDB 破損時はフォールバック（新規 session）、エラーを Sentry へ（PII なし）。

## 3. コードベース調査: greenfield。Critical/High なし。
## 4. 設計判断ログ
| # | 判断 | 結論 | type |
|---|---|---|---|
| R1 | 表示/記録分離 | 記録=タイムスタンプ、表示=setInterval描画 | auto-recommended |

## 5. 次のステップ: `/flow:tdd execution`（activity-sets/local-sync 後）。
<!-- auto-generated-end -->
