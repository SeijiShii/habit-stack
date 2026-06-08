<!-- auto-generated-start -->
# 設計レビューレポート — tip-jar

**レビュー日**: 2026-06-08 / **実施**: Claude (Opus 4.8) / **モード**: auto-pick
**入力**: 001-004 / **観点**: 組み込み + P1-P82 / **前提**: greenfield。

## 1. サマリー
| 観点 | 評価 | 備考 |
|---|---|---|
| webhook 署名(SEC-005) | OK | raw body + STRIPE_WEBHOOK_SECRET 検証、冪等 |
| 価格透明性(O43) | OK | 金額 CTA 前明示 |
| 認可 | OK | checkout は withOwner、匿名→Google リンク誘導 |
| charter §2.2 | OK | 射幸心/見返りなし、非ブロッキング |

## 2. 指摘事項
### [R1] webhook の raw body 取得 (severity=High, SEC-005)
- **問題**: Vercel Functions の bodyParser が JSON パースすると署名検証が壊れる。
- **推奨**: webhook 関数は **bodyParser 無効化（raw body）**。vercel-fn-config で設定。time-budget 知見流用。003 で raw body 改変テスト。
- **chosen**: bodyParser 無効化 + raw body 署名検証（feature 設計 §6 で対応）。確認のみ。

### [R2] tips 記録テーブルの要否 (severity=Low)
- **推奨**: 軽量 tips テーブル（累計参考、正本は Stripe）。MVP は最小。
- **chosen**: 軽量 tips（auto-recommended、_shared/db に追加可）。

### [R3] 実課金は Class B-4 (severity=Info)
- live キー + 実課金疎通は /flow:release で本人明示承認（test→live swap）。E2E は test/mock。

## 3. コードベース調査: greenfield。Critical なし、High 1（署名、設計で対応済み）。
## 4. 設計判断ログ
| # | 判断 | 結論 | type |
|---|---|---|---|
| R1 | webhook raw body | bodyParser 無効化 + 署名検証 | auto-recommended |
| R2 | tips テーブル | 軽量追加 | auto-recommended |

## 5. 次のステップ: `/flow:tdd tip-jar`（auth 後）。実課金 live は /flow:release。
<!-- auto-generated-end -->
