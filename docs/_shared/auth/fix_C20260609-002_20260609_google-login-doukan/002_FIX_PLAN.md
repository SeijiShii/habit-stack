# 修正計画: Google ログイン/連携動線の実装

> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, src/components/auth/*, src/services/auth/*, src/features/local-sync/*
> **最終更新**: 2026-06-09

---

## 0. 方針サマリ（claim TRIAGE §4 で確定済の制約）
- **本丸 = データ引き継ぎ・複数端末同期のための Google ログイン/連携動線を在らせる**。
- **tip（応援投げ銭）はログイン不要・ゲスト継続**（対価無しのギフト、O46🎁/CF-20260609-010）。tip にログインゲートを付けない。
- 連携は **Clerk `createExternalAccount(oauth_google)` で「同一 owner id を維持」パスを primary**（auth SPEC §3）→ サーバ/ローカルの既存データはそのまま所有が保たれ、データ移行不要。`reassignOwner`（実装済）は新 id になる fallback 経路。

## 1. 修正対象ファイル

| ファイル | 修正内容 | before | after |
|---|---|---|---|
| `src/services/auth/linkWithGoogle.ts`（新規） | `linkWithGoogle(user, redirectUrl)` — Clerk anonymous user に Google external account を連携（同一 userId 維持）。injectable（O35、テストは mock） | 不在 | `createExternalAccount({strategy:'oauth_google', redirectUrl})` → verification.externalVerificationRedirectURL へ遷移 |
| `src/services/auth/ownerContext.tsx` | `OwnerState` に `isLinked`（authed=外部アカウント連携済か）/ `email`（連携後の表示用）を追加 | `{ownerId, isLoaded, isLocalGuest}` | `+ isLinked, email?` |
| `src/components/auth/AuthProvider.tsx` | `ClerkOwnerBridge` で `useUser()` から external account 有無を解決し `isLinked`/`email` を OwnerContext に供給。連携完了後の sync push を起動 | guest ticket のみ | `+ isLinked 解決 + post-link sync` |
| `src/features/account/AccountPage.tsx`（新規） | アカウント画面。ゲスト時=「Google で引き継ぐ」CTA / 連携済=email 表示 + サインアウト。**O54 セルフサービス削除（deleteAllData、既存）の動線もここに併設**（別 claim だが同一画面が自然） | 不在 | `/account` ルート |
| `src/App.tsx` | `<Route path="/account" element={<AccountPage/>}>` 追加 | 無 | 有 |
| `src/components/AppLayout.tsx` | メイン nav に「アカウント」inbound 動線（常設導線、O55）。ゲスト時はバッジ「ゲスト」表示で連携余地を示す | nav 3 項目 | `+ /account` |
| `src/features/local-sync/syncRepo.ts`（配線） | 連携成功時に guest データをサーバ owner へ push（同一 id なら push のみ、新 id なら `reassignOwner` 後 push） | — | post-link sync hook |
| `docs/concept.md` §1.2 / `docs/_shared/auth/001__shared_auth_SPEC.md` §3 / `docs/tip-jar/*SPEC` | 「課金時のみ Google ログイン必須」「tip-jar: 課金前に linkWithGoogle 必須」を **donation 非ゲート**に校正（O46🎁） | 「課金前 linkWithGoogle 必須」 | 「応援投げ銭はログイン不要。Google ログインは引き継ぎ・同期のための任意導線」 |

## 2. 修正範囲の限定方針
- **根本原因（UI 動線 + client 関数の欠落）のみ実装**。server merge（reassignOwner）は既存を再利用、guest セッションは無改変。
- **純粋に additive**（新 component + 新 route + 新関数）。既存ゲストフローを一切変えないため副作用リスクが低い。
- O54 セルフサービス削除動線は厳密には別 claim だが、`/account` 画面に同居させるのが自然（deleteAllData は実装済・動線のみ欠落）。本 fix のスコープに含めるかは実装時に判断（含めると O12×O22 ペアの audit Critical も同時解消）。

## 3. 副作用なき確認方法
- 既存テスト維持: `src/components/auth/*.test.tsx`, `src/services/auth/*.test.ts`, `src/features/local-sync/*.test.ts`（116 green を破壊しない）。
- 追加テスト: 003_REGRESSION_TEST.md 参照（linkWithGoogle 単体 + AccountPage 表示分岐 + 動線到達 + post-link sync）。
- 手動確認（release 実機）: ゲスト → /account → Google で引き継ぐ → 連携後 email 表示 → 別端末で同 Google ログイン → データが見える。

## 4. リリース戦略
- 方式: **通常リリース**（additive、本番ダウンではない omission の解消）。feature flag 不要。
- severity=high だが production incident ではないため hotfix 緊急展開は不要。
- **⚠️ Class C 人手ゲート（release §3.1 social OAuth）**: Google ログインの実稼働には **GCP custom OAuth client 作成 + Clerk production instance の Google social connection 設定（Use custom credentials）** が必要。コードは Clerk mock で unit green にできるが、**本番で実 Google ログインが 1 回通るまで完了にしない**（release §3.4 smoke、guest token スモークでは検知不能）。GCP プロジェクトは seiji 既定で共有（CF-20260531-003）。
- 展開計画: ① コード実装（tdd、Class A）→ ② GCP/Clerk OAuth 設定（Class C、release）→ ③ 再デプロイ → ④ 本番で実 Google ログイン 1 回検証。

## 5. ロールバック方針
- コード revert で戻せる: ✅（additive なので revert で旧状態に戻る、データ非破壊）
- DB ロールバック: 不要（reassignOwner は連携時のみ起動、未連携ユーザーに影響なし）
- 手順: 当該 commit を revert → 再デプロイ。連携済ユーザーは Clerk 側に external account が残るが無害。

## 6. 関係者通知
- 通知先: seiji（GCP/Clerk OAuth 設定は本人作業）
- タイミング: 実装完了 → release で OAuth 設定を 1問1答案内

## 7. DoD
- [ ] `linkWithGoogle()` 実装 + 単体テスト green
- [ ] `/account` 画面 + nav 動線（到達テスト green、O55）
- [ ] OwnerContext に isLinked/email、連携後 email 表示
- [ ] post-link sync 配線（同一 id=push / 新 id=reassignOwner+push）
- [ ] 003 REGRESSION_TEST 全成功 / 既存 116 テスト破壊なし
- [ ] concept §1.2 / auth SPEC §3 / tip-jar SPEC の donation 非ゲート校正
- [ ] **（release）本番で実 Google ログインが 1 回通る**（GCP+Clerk OAuth 設定済、§3.4 smoke）
- [ ] `_shared/auth` の ✅ を「login 動線含め完了」に正す

## 8. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-09 | 初版 | /flow:fix |
