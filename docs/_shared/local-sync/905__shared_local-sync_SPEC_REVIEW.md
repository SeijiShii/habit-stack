<!-- auto-generated-start -->
# 設計レビューレポート — _shared/local-sync

**レビュー日**: 2026-06-08 / **実施**: Claude (Opus 4.8) / **モード**: auto-pick
**入力**: 001-003 / **観点**: 組み込み + P1-P82 / **前提**: greenfield。

## 1. サマリー
| 観点 | 評価 | 備考 |
|---|---|---|
| 読み書きソース一致 | OK | local-first + 同期キュー、正本は updated_at 比較で決定（P5） |
| 影響範囲 | N/A | greenfield |
| エラーハンドリング | OK | 競合/冪等/オフライン/リトライ定義 |
| 認可 | OK | api/sync は withOwner、owner サーバ強制（SEC-001） |

## 2. 指摘事項
### [R1] last-write-wins の時計ずれ境界 (severity=Medium, P5)
- **推奨**: updated_at 同値はサーバ受信順で決定的に。端末時計大幅ずれは MVP では端末値基準（concept §3 許容）、将来サーバ受信時刻を補助に。
- **chosen**: 端末 updated_at 基準 + 同値はサーバ受信順（feature 設計 §8 で確定済み）。確認のみ。

### [R2] tombstone と owner 付け替えの整合 (severity=Low, P20)
- **推奨**: mergeGuestData（auth）で owner 付け替え時、deleted_at の tombstone も付け替え対象に含める。
- **chosen**: auth と協調（002 で記載）。auto-recommended。

## 3. コードベース調査: greenfield。Critical/High なし。
## 4. 設計判断ログ
| # | 判断 | 結論 | type |
|---|---|---|---|
| R1 | LWW 境界 | 端末 updated_at + 同値サーバ順 | auto-recommended |

## 5. 次のステップ: `/flow:tdd _shared/local-sync`（db/auth 後）。
<!-- auto-generated-end -->
