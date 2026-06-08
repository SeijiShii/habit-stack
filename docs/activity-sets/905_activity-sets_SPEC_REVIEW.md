<!-- auto-generated-start -->
# 設計レビューレポート — activity-sets

**レビュー日**: 2026-06-08 / **実施**: Claude (Opus 4.8) / **モード**: auto-pick
**入力**: 001-004 / **観点**: 組み込み + P1-P82 / **前提**: greenfield。

## 1. サマリー
| 観点 | 評価 | 備考 |
|---|---|---|
| 仕様の明確性 | OK | セット/アイテム CRUD・並べ替え・時間帯 |
| 認可 | OK | useOwner + withOwner（SEC-001） |
| 入力検証 | OK | Zod（SEC-002、name 1..60） |
| オフライン | OK | local-sync 経由 |
| テストカバレッジ | OK | 003 CRUD/Zod/reorder + 004 E2E |

## 2. 指摘事項
### [R1] sort_order 採番方式 (severity=Low, P)
- **推奨**: 連番振り直し（隣接平均より単純、衝突なし）。並べ替え時に対象セット内を再採番。
- **chosen**: 連番振り直し（feature §8 で推奨確定）。auto-recommended。
- **反映先**: 002 reorder（既存記載で充足）。

### [R2] ドラッグライブラリ選定 (severity=Info)
- **推奨**: dnd-kit（軽量・a11y 良好）。tdd 時に確定。

## 3. コードベース調査: greenfield。Critical/High なし。
## 4. 設計判断ログ
| # | 判断 | 結論 | type |
|---|---|---|---|
| R1 | sort_order 採番 | 連番振り直し | auto-recommended |

## 5. 次のステップ: `/flow:tdd activity-sets`（db/auth/local-sync 後）。
<!-- auto-generated-end -->
