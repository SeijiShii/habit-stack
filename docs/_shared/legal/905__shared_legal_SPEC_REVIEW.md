<!-- auto-generated-start -->
# 設計レビューレポート — _shared/legal

**レビュー日**: 2026-06-08 / **実施**: Claude (Opus 4.8) / **モード**: auto-pick
**入力**: 001-003 + concept §9 / **観点**: 組み込み + P1-P82 / **前提**: greenfield。

## 1. サマリー
| 観点 | 評価 | 備考 |
|---|---|---|
| 法務必須項目網羅 | OK | プラポリ/規約/特商法 + O54 ゲスト削除文言 |
| ルート到達性(O55) | OK | LegalFooter 常設、3 route inbound link |
| 既存実装再利用 | OK | 同意記録は Clerk metadata（新規テーブル回避、P19） |

## 2. 指摘事項
### [R1] 特商法販売者情報のプレースホルダ管理 (severity=Medium)
- **推奨**: MVP は雛形（「請求あれば遅滞なく開示」）。tip-jar 公開前に seiji の事業形態で確定差し替え。公開前チェックを PREREQUISITES §6 と連動。
- **chosen**: 雛形 + 公開前差し替え（feature §8 で確定済み）。確認のみ。

### [R2] O54 ゲスト削除文言の必須化 (severity=High, legal_required)
- **推奨**: プラポリ本文に「運営側で特定不能 → アプリ内セルフサービス削除」を必ず含める。窓口削除を約束しない。テスト N2 で text assert。
- **chosen**: 003 N2 で担保済み（feature 設計で対応）。確認のみ。

## 3. コードベース調査: greenfield。Critical なし、High 1（O54、設計で対応済み）。
## 4. 設計判断ログ
| # | 判断 | 結論 | type |
|---|---|---|---|
| R2 | O54 ゲスト削除文言 | プラポリ必須 + text assert | auto-recommended |

## 5. 次のステップ: `/flow:tdd _shared/legal`。
<!-- auto-generated-end -->
