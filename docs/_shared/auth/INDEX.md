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
| 101 | 101__shared_auth_IMPL_REPORT.md | IMPL_REPORT | 実装完了 | 2026-06-08 | owner resolver/匿名ゲストセッション(実Clerk)/Provider/O54削除/移行。P4.46 充足 |
| 102 | 102__shared_auth_UNIT_TEST_REPORT.md | UNIT_TEST_REPORT | 実装完了 | 2026-06-08 | 19テスト green（匿名→authed 200含む） |
| 後続 | Google リンク UI / delete・merge のローカル IndexedDB 側 | 配線待ち | 2026-06-08 | app-shell UI / local-sync 配線時。サーバ側は実装済 |
| 論点-009 | ゲスト→アカウント owner 統合方式 | open | 2026-06-08 | reassignOwner(案B)実装済、Clerk 永続化アップグレード可なら案A優先 |

## サブフォルダ（改修・バグ修正・クレーム判定履歴）
| パス | 種別 | issue/slug | 状態 | 概要 | INDEX |
|---|---|---|---|---|---|
| `claim_C20260614-002_20260614_google-login-no-op/` | claim | C20260614-002 / google-login-no-op | 判定完了→fix分岐 | Google ログインボタン無反応。当初の本番設定欠落仮説は実機リモートデバッグで否定 → 確定原因=**Clerk reverification 403（aged guest session）**。→ fix_C20260614-002 へ分岐 | `001_TRIAGE.md` §7 |
| `fix_C20260614-002_20260614_google-link-reverification/` | fix | C20260614-002 / google-link-reverification | 実装完了(unit green) | aged guest session の `createExternalAccount` が Clerk reverification で 403。CODE=403 を catch+role="alert" で可視化（無言失敗撲滅、auth suite 32 tests green）。functional fix は Clerk Dashboard で reverification 緩和（Class C） | `001_ROOT_CAUSE.md` |
| `revise_R20260611-002_20260611_self-service-delete/` | revise | R20260611-002 / self-service-delete | E2E green | O54 セルフ削除 UI 導線実装（AccountPage 削除導線 + DELETE /api/account + purgeAllData + wipeOwner outbox 拡張）。176 unit + 8 E2E green。AUDIT_20260611_2000 Critical 解消（「配線待ち」の完了） | `INDEX.md` |

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
