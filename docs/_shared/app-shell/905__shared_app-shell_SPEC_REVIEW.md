<!-- auto-generated-start -->
# 設計レビューレポート — _shared/app-shell

**レビュー日**: 2026-06-08 / **実施**: Claude (Opus 4.8) / **モード**: auto-pick
**入力**: 001-003 + 全 feature/_shared / **観点**: 組み込み + P1-P82 / **前提**: greenfield（合成 target）。

## 1. サマリー
| 観点 | 評価 | 備考 |
|---|---|---|
| 合成完全性(O57) | OK | 全 feature + 全 _shared を配線、API ハンドラ集約、優先度最後 |
| 認証セッション(P4.46) | OK | 匿名→authed 200 を build フェーズで検証 |
| ルート到達性(O55) | OK | LegalFooter 常設、全 route inbound link |
| 入口理解(O41) | OK | トップにリード文 |
| bootstrap(O36/O37/O56) | OK | dev.sh/CI/favicon/.env.example |

## 2. 指摘事項
### [R1] 全部品依存のため最後に実装 (severity=Info, O57)
- **推奨**: app-shell は全 feature + 全 _shared 実装完了後に tdd。これが無いと「部品はあるが動くアプリが無い」が release まで露見しない（O57 の核心）。
- **chosen**: 優先度最後で確定（feature 設計で対応）。確認のみ。

### [R2] PWA SW と dev の整合 (severity=Low)
- **推奨**: dev では SW 無効化（vite-plugin-pwa の devOptions）。本番のみ有効。
- **chosen**: dev で SW 無効（auto-recommended）。

### [R3] ルーティングライブラリ (severity=Info)
- **推奨**: React Router（軽量・実績）。tdd 時確定。

## 3. コードベース調査: greenfield（合成 target）。Critical/High なし。
## 4. 設計判断ログ
| # | 判断 | 結論 | type |
|---|---|---|---|
| R1 | 実装順序 | 全部品後（最後） | auto-recommended |
| R2 | dev SW | 無効化 | auto-recommended |

## 5. 次のステップ: 全 feature + 全 _shared 実装完了後に `/flow:tdd _shared/app-shell`。
<!-- auto-generated-end -->
