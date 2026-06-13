# app-shell ドキュメントインデックス

**最終更新**: 2026-06-08 16:10
**生成元**: /flow:concept (初期化)

<!-- auto-generated-start -->

## 機能概要 (短縮、詳細は README.md)
アプリ合成レイヤ（合成ルート + UI↔data 配線 + API ルートハンドラ層 + Clerk セッション確立 + PWA + deploy scaffold、O57）

## ファイル一覧（番号順）
| 番号 | ファイル | 種別 | 状態 | 最終更新 | 短い説明 |
|---|---|---|---|---|---|
| 001 | 001__shared_app-shell_SPEC.md | SPEC | 設計済 | 2026-06-08 | 合成ルート + API配線 + 認証(P4.46) + PWA + deploy scaffold (O57) |
| 002 | 002__shared_app-shell_PLAN.md | PLAN | 設計済 | 2026-06-08 | Vite基盤/合成/API配線/グローバルUI/bootstrap 5Phase |
| 003 | 003__shared_app-shell_UNIT_TEST.md | UNIT_TEST | 設計済 | 2026-06-08 | Provider/routes/匿名→authed200/O55到達性 |
| (004 E2E は全 feature E2E が app-shell 上で実行) |
| 101 | 101__shared_app-shell_IMPL_REPORT.md | IMPL_REPORT | 実装完了 | 2026-06-08 | 合成/API配線/PWA/bootstrap + build green |
| 102 | 102__shared_app-shell_UNIT_TEST_REPORT.md | UNIT_TEST_REPORT | 実装完了 | 2026-06-08 | 5テスト + build green |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| claim_C20260609-001_unstyled-ui/ | claim | C20260609-001 / unstyled-ui | 判定完了 | 素の未スタイル UI クレーム判定 | [INDEX](./claim_C20260609-001_unstyled-ui/INDEX.md) |
| revise_R20260613-002_20260613_title-logo/ | revise | R20260613-002 / title-logo | 実装完了（unit green、E2E 未） | アプリタイトル左にロゴ追加、幅不足時はロゴのみ縮退（エリプシス解消、BrandLogo + CSS container query） | [INDEX](./revise_R20260613-002_20260613_title-logo/INDEX.md) |

## 関連
- 親 concept: `../../concept.md` §1.3.2 app-shell 行
- **依存**: 全 feature + 全 _shared
- 実装コード: `§1.4 の対応表参照（横断は集約 → 分散実装）`

## AI アクセスガイド（読み込み順推奨）
- 機能概要 → README.md
- 仕様詳細 → 001_*_SPEC.md (まだ未生成)

## 機能性質タグ
- (まだ未確定。`/flow:feature` 実行時に決定)

<!-- auto-generated-end -->

<!-- user-edit-start -->
<!-- user-edit-end -->
