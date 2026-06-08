# auth ドキュメントインデックス

**最終更新**: 2026-06-08 16:10
**生成元**: /flow:concept (初期化)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
認証・認可基盤（Clerk 匿名ゲスト → 段階的認証 + ゲスト→アカウント連携データ引き継ぎ）

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | 001__shared_auth_SPEC.md | SPEC | 設計済 | 2026-06-08 | Clerk 匿名→段階認証 + owner resolver + 移行 + 削除(O54) |
| 002 | 002__shared_auth_PLAN.md | PLAN | 設計済 | 2026-06-08 | owner/guest/Provider/delete 4+Phase |
| 003 | 003__shared_auth_UNIT_TEST.md | UNIT_TEST | 設計済 | 2026-06-08 | 401/403/200 + 匿名→authed(P4.46) + PII マスク |
| 実装 | Phase 1 owner resolver (withOwner/requireOwner) | 実装中 | 2026-06-08 | src/services/auth/owner.ts 7テスト green。Phase2-4(Provider/Googleリンク/deleteAllData)+3.5(実Clerk) は React/Clerk 導入後 |
| 論点-009 | ゲスト→アカウント owner 統合方式 | open | 2026-06-08 | 実装時 Clerk API 確認 |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| (なし。`/flow:revise` / `/flow:fix` / `/flow:claim` で生成) |

## 関連
- 親 concept: `../../concept.md` §1.3.2 auth 行
- **依存**: _shared/db
- 実装コード: `§1.4 の対応表参照（横断は集約 → 分散実装）`

## AI アクセスガイド（読み込み順推奨）
- 機能概要 → README.md
- 仕様詳細 → 001_*_SPEC.md (まだ未生成)

## 機能性質タグ
- (まだ未確定。`/flow:feature` 実行時に決定)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
