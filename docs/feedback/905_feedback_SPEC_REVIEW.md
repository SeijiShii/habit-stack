<!-- auto-generated-start -->
# 設計レビューレポート — feedback

**レビュー日**: 2026-06-08 / **実施**: Claude (Opus 4.8) / **モード**: auto-pick
**入力**: 001-004 / **観点**: 組み込み + P1-P82 / **前提**: greenfield。

## 1. サマリー
| 観点 | 評価 | 備考 |
|---|---|---|
| PII 保護 | OK | 送信前 scrub（SEC-004、法令）テスト 100% カバレッジ |
| degrade 設計 | OK | hub env 未設定時のフォールバック定義 |
| レート制限 | OK | O27（Turnstile/レート） |

## 2. 指摘事項
### [R1] PII scrub の網羅性検証 (severity=High, SEC-004 legal)
- **推奨**: メール/位置/電話/本文 PII の全パターンを単体テストでカバー（003 PII scrub 100%）。スクショは MVP 任意 + 警告。
- **chosen**: 003 で 100% カバレッジ必須（feature 設計で対応）。確認のみ。

### [R2] [論点-010] hub 所在 (severity=Medium)
- **推奨**: 既存 hub 接続のみ（無改修）。未構築なら別 PJ 化（concept §8 論点-003 と統合）。env 未設定時 degrade。
- **chosen**: open 維持（実装着手前に seiji 確認）。

## 3. コードベース調査: greenfield。Critical なし、High 1（PII、設計で対応済み）。
## 4. 設計判断ログ
| # | 判断 | 結論 | type |
|---|---|---|---|
| R1 | PII scrub 網羅 | 単体 100% 必須 | auto-recommended |
| R2 | hub 所在 | open（seiji 確認） | open |

## 5. 次のステップ: `/flow:tdd feedback`（auth 後）。
<!-- auto-generated-end -->
