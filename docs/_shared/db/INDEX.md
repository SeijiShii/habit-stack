# db ドキュメントインデックス

**最終更新**: 2026-06-08 16:10
**生成元**: /flow:concept (初期化)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
DB スキーマ・マイグレーション（Neon + Drizzle）

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | 001__shared_db_SPEC.md | SPEC | 設計済 | 2026-06-08 | Drizzle 6 テーブル + enum + owner_id 分離 + 同期メタ |
| 002 | 002__shared_db_PLAN.md | PLAN | 設計済 | 2026-06-08 | schema/client/migrations 3 Phase |
| 003 | 003__shared_db_UNIT_TEST.md | UNIT_TEST | 設計済 | 2026-06-08 | 型テスト + 制約/index assert |
| 101 | 101__shared_db_IMPL_REPORT.md | IMPL_REPORT | 実装完了 | 2026-06-08 | 5テーブル/client/migration + 基盤scaffold |
| 102 | 102__shared_db_UNIT_TEST_REPORT.md | UNIT_TEST_REPORT | 実装完了 | 2026-06-08 | 12/12 green |
| (004 E2E は cross-cutting のため skip) |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| (なし。`/flow:revise` / `/flow:fix` / `/flow:claim` で生成) |

## 関連
- 親 concept: `../../concept.md` §1.3.2 db 行
- **依存**: (なし)
- 実装コード: `§1.4 の対応表参照（横断は集約 → 分散実装）`

## AI アクセスガイド（読み込み順推奨）
- 機能概要 → README.md
- 仕様詳細 → 001_*_SPEC.md (まだ未生成)

## 機能性質タグ
- cross-cutting, auth-required (owner_id 分離/SEC-001), offline-critical (同期メタ)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
