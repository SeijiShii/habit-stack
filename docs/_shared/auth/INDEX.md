# auth ドキュメントインデックス

**最終更新**: 2026-06-17（claim_C20260617-001 追加）
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
| `fix_C20260614-002_20260614_google-link-reverification/` | fix | C20260614-002 / google-link-reverification | 実装完了(unit green) | aged guest session の `createExternalAccount` が Clerk reverification で 403。**機能修正=連携直前に同一 userId でセッション fresh 化**（refreshGuestTicket + signIn.create ticket、reverification window 回避、churn なし）+ CODE=403 catch+可視化。全 230 tests green | `001_ROOT_CAUSE.md` |
| `revise_R20260611-002_20260611_self-service-delete/` | revise | R20260611-002 / self-service-delete | E2E green | O54 セルフ削除 UI 導線実装（AccountPage 削除導線 + DELETE /api/account + purgeAllData + wipeOwner outbox 拡張）。176 unit + 8 E2E green。AUDIT_20260611_2000 Critical 解消（「配線待ち」の完了） | `INDEX.md` |
| `revise_R20260615-001_20260615_account-switch-stop-sync/` | revise | R20260615-001 / account-switch-stop-sync | 実装完了（unit 245 green） | アカウント切替（Google ログイン/サインアウト）を契機に計時停止条件を緩和（`/account` 閲覧では止めない）＋確認ダイアログ＋強制停止時データ消失是正。同期ポリシー: 未連携ログイン=保持アップロード / 既存データ持ち=デバイス上書き / サインアウト=デバイス wipe（サーバ保持）。LoginEndGuard 撤去・wipeOwner 再利用・migration 不要 | `INDEX.md` |
| `claim_C20260616-001_20260616_set-data-loss-after-login/` | claim | C20260616-001 / set-data-loss-after-login | 判定完了→fix分岐 | ログイン状態で活動セットがパーシャル消失（「夕方の勉強」+実績のみ喪失、「朝の勉強」残存）。**バグ(fix)**: 期待(ログイン状態でデータ保持・パーシャル消失禁止)=SPEC ≠ 現実。昨日デプロイ R20260615-001 の `wipeOtherOwners`(owner 不一致ローカル物理削除)/deviceOverwrite marker/強制停止是正/getAllByOwner の deletedAt フィルタと発生タイミング整合＝回帰最有力。根本原因は単一未確定→fix 調査へ | `001_TRIAGE.md` |
| `fix_C20260616-001_20260616_set-data-loss-after-login/` | fix | C20260616-001 / set-data-loss-after-login | 実装完了（unit 248 green） | **根本原因確定**: 既存アカウントサインインで userId churn → 旧 owner に取り残されたローカル未同期データを `wipeOtherOwners`→`wipeOwner` が **outbox ごと物理削除**（同期前消滅＝不可逆）。`reassignOwner` は dead code でローカル owner 移行皆無。物理 wipe は read 隔離で正当性に不要（R20260615-001 spec-review R2 自認）。**即時 mitigation=wipe 撤去（機能リグレッションゼロ）** + 恒久=owner 保全/移行+確認。Postmortem 生成済 | `INDEX.md` |
| `fix_C20260617-001_20260617_token-stale-owner-churn-data-loss/` | fix | C20260617-001 / token-stale-owner-churn-data-loss | 修正計画済→tdd | **根本=サーバ発行ゲスト userId のクライアント未永続**（論点-009 案A 未着手）。認証トークン失効→リロードで新ゲスト userId 発行→owner churn→`getAllByOwner` orphan＝データ消失。**bousai は revise_003 で guest 自前署名 JWT 永続（Clerk 非セッション化）済＝churn 不在**、habit-stack/prayer-list は ticket 方式のまま被災。修正=**bousai 機構の移植（案A）+ one-time orphan migration**。flow tooling 是正済（CF-20260617-001: audit step 3.9 + perspectives O22 (D) + scaffold §1.7、検証 bousai PASS/habit・prayer HIGH）。Postmortem 生成済 | `INDEX.md` |
| `claim_C20260617-001_20260617_token-stale-owner-churn-data-loss/` | claim | C20260617-001 / token-stale-owner-churn-data-loss | 判定完了→fix分岐 | ログイン後作成データが、認証トークン(Clerk セッション)陳腐化後の再読込で消失・再ログインでも復旧せず。**バグ(fix)**: 期待(認証遷移でデータ欠損させず引き継ぐ=concept §1.1 UC8/§3 NFR) ≠ 現実。**C20260616-001 とは別機序**: あちら=明示サインインの wipe(fix 済)、本件=**session 失効→新ゲスト userId 発行で owner churn→getAllByOwner で orphan 化**。根本=サーバ発行ゲスト userId のクライアント未永続(`issueGuestTicket` が毎回 createUser)。→ fix_C20260617-001 へ分岐 | `001_TRIAGE.md` |

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
