# local-sync ドキュメントインデックス

**最終更新**: 2026-06-08 16:10
**生成元**: /flow:concept (初期化)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
local-first 同期層（IndexedDB + Neon 同期キュー、タイムスタンプ方式、競合解決）

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | 001__shared_local-sync_SPEC.md | SPEC | 設計済 | 2026-06-08 | IndexedDB local-first + 同期キュー + LWW + tombstone |
| 002 | 002__shared_local-sync_PLAN.md | PLAN | 設計済 | 2026-06-08 | localStore/syncQueue/conflict/api/useSync |
| 003 | 003__shared_local-sync_UNIT_TEST.md | UNIT_TEST | 設計済 | 2026-06-08 | 競合/冪等/tombstone/オフライン |
| (004 E2E は feature 側 offline シナリオでカバー) |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| (なし。`/flow:revise` / `/flow:fix` / `/flow:claim` で生成) |

## 関連
- 親 concept: `../../concept.md` §1.3.2 local-sync 行
- **依存**: _shared/db, _shared/types
- 実装コード: `§1.4 の対応表参照（横断は集約 → 分散実装）`

## AI アクセスガイド（読み込み順推奨）
- 機能概要 → README.md
- 仕様詳細 → 001_*_SPEC.md (まだ未生成)

## 機能性質タグ
- (まだ未確定。`/flow:feature` 実行時に決定)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
