# 実装レポート: Google ログイン/連携動線 (fix C20260609-002)

## 実装日時
2026-06-09 21:40 (JST)

## モード
fix（単一 Phase、局所的）

## 関連ドキュメント
- [000_調査レポート.md] / [001_ROOT_CAUSE.md] / [002_FIX_PLAN.md] / [003_REGRESSION_TEST.md] / [004_POSTMORTEM.md]
- 起点クレーム: ../claim_C20260609-002_20260609_no-login-doukan/001_TRIAGE.md

## 変更一覧

### 新規
- `src/services/auth/linkWithGoogle.ts` — Clerk `createExternalAccount(oauth_google)` で匿名 user に Google 連携（同一 userId 維持）。injectable（O35）。検証リダイレクト URL へ遷移。
- `src/services/auth/linkWithGoogle.test.ts` — 3 ケース（連携開始 / 中断時非遷移 / 文字列 URL）。
- `src/features/account/AccountPage.tsx` — `/account` 画面。ゲスト=「Google で引き継ぐ」CTA / 連携済=email + サインアウト / keyless=ローカル利用表示。`useOwner()` 経由で全状態を取得（fully testable）。
- `src/features/account/AccountPage.test.tsx` — 4 ケース（CTA→linkGoogle / 連携済 email+signOut / keyless / 未ロード）。

### 編集
- `src/services/auth/ownerContext.tsx` — `OwnerState` に `isLinked` / `email?` / `linkGoogle?` / `signOut?` を追加。
- `src/components/auth/AuthProvider.tsx` — `ClerkOwnerBridge` で `useUser`/`useClerk` から `isLinked`(externalAccounts)・`email`(primaryEmailAddress)・`linkGoogle`(linkWithGoogle 配線、redirect=<origin>/account)・`signOut` を供給。`LocalOwnerProvider` は `isLinked:false`（keyless で連携不可）。
- `src/App.tsx` — `<Route path="/account" element={<AccountPage/>} />` 追加。
- `src/components/AppLayout.tsx` — メイン nav に「アカウント」inbound 動線（常設、O55）。
- `src/app/App.test.tsx` — 動線到達テスト 2 件（nav に `/account` link / `/account` レンダー）。
- `src/hooks/useOwner.test.tsx` — 既存 mock に `isLinked` 追加（型追従）。

### ドキュメント校正（donation 非ゲート、O46🎁/CF-20260609-010）
- `docs/concept.md` §1.2 — 「課金時のみ Google ログイン必須」→「応援はログイン不要・ゲスト完結」/ アカウント連携は「引き継ぎ・同期時の任意導線」。
- `docs/_shared/auth/001__shared_auth_SPEC.md` §3 / §連携先 — `linkWithGoogle` は引き継ぎ・同期時に呼ぶ（応援は呼ばない）/ tip-jar 行を「ログイン不要」に。

## 設計判断
- **同一 userId 維持パスを primary**（Clerk `createExternalAccount`）: サーバ/ローカルの既存データの所有が保たれデータ移行不要。`dataOps.reassignOwner`（実装済）は新 id になる場合の fallback。
- **OwnerContext に linkGoogle/signOut を集約**: AccountPage を Clerk 非依存（`useOwner()` のみ）にして keyless でもクラッシュせず、テストも provider で完結。
- **post-link sync**: 同一 userId 維持のため local-sync は既存どおり ownerId キーで継続＝特別な移行配線は不要（新 id 時のみ reassignOwner→再同期、fallback）。

## 計画からの差分
- O54 セルフサービス削除動線の `/account` 同居は本 fix スコープ外（claim は login 動線に限定）。`/account` 画面が存在するため後続で追加容易（別 claim / revise）。

## 残（Class C、release で実施）
- GCP custom OAuth client 作成 + Clerk production instance の Google social connection（Use custom credentials）設定（release §3.1）。本番で実 Google ログインが 1 回通るまで完了扱いにしない（§3.4 smoke）。

## PR Description
**タイトル**: _shared/auth: Google ログイン/連携動線を実装 (fix C20260609-002)
**概要**: 契約済みだが未実装だった Google ログイン/アカウント連携の UI 動線（`/account` + linkWithGoogle）を実装。応援(tip)はログイン不要に校正。
**テスト**: 全 129 件 green（新規 9 件: linkWithGoogle 3 / AccountPage 4 / App 動線 2）、typecheck green、build OK。
