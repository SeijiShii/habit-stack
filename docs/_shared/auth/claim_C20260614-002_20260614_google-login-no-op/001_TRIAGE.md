# クレーム判定レポート

**claim id**: C20260614-002
**判定日**: 2026-06-14
**判定者**: Claude (opus-4-8) + seiji
**判定**: バグ (fix) — ただし**根本原因はコードではなく本番設定の欠落**（production Clerk instance に Google カスタム OAuth 認証情報が未登録）。remediation = 設定作業（`/flow:release` §3.1 social sign-in OAuth）。

## 1. 三項照合

### 1.1 期待 (Expected)
「Google で引き継ぐ」押下で Google OAuth 同意フロー（リダイレクト）が始まる。

### 1.2 既存仕様 (Spec)
- concept §1.1/§1.2: 「引き継ぎたいときだけ Google ログイン」「課金時のみ Google ログイン必須」。
- `_shared/auth` SPEC §3: `linkWithGoogle()` で匿名 user を Google OAuth でアップグレード（O22 段階的認証）。
- = SPEC は Google ログインが**機能すること**を契約。

### 1.3 現実 (Actual)
- **コードは正しい**（実装欠陥ではない）:
  - `src/features/account/AccountPage.tsx:39-47` `onLink` → `linkGoogle()`。
  - `src/services/auth/linkWithGoogle.ts:28-41`: `user.createExternalAccount({ strategy: "oauth_google", redirectUrl })` → `externalVerificationRedirectURL` があれば navigate。
  - unit `linkWithGoogle.test.ts` green。ボタンは表示（`linkGoogle` 定義済 = クライアント Clerk 初期化済）。
- **本番 Clerk = production instance**: `.env.production.local` の `VITE_CLERK_PUBLISHABLE_KEY` / `CLERK_PUBLISHABLE_KEY` = `pk_live_*`、`CLERK_SECRET_KEY` = `sk_live_*`（prefix 確認、値は非表示）。
- **production instance は Clerk 共有 OAuth アプリを使えない**（CF-20260531-002）。Google social connection に**自前の OAuth client（Google Cloud Console）+ Clerk のカスタム認証情報**が未登録だと、`createExternalAccount({strategy:"oauth_google"})` は検証リダイレクト URL を返さない（or client_id 空で失敗）→ `linkWithGoogle` の `if (target)` が false → **navigate されず無反応**（エラーも出ない）。
- → 症状「ボタンを押しても何も起きない（エラーも無い）」と完全一致。

### 1.4 照合結果
期待 = SPEC（Google ログインは機能すべき）≠ 現実（本番で無反応）。だが**コードは SPEC を満たしており**、欠落しているのは **production Clerk instance の Google カスタム OAuth 設定**。= 実装バグではなく**本番リリース設定の欠落（social sign-in launch blocker、CF-20260531-002 / O22）**。前回 fix C20260609-002 は動線（ボタン+コード）を実装したが、本番 OAuth 設定（dev instance では共有 OAuth で動くため検出されない）が未完だった。

## 2. 判定根拠

1. コード（ボタン配線 + `createExternalAccount(oauth_google)` + redirect 遷移）は正しく unit green。実装欠陥ではない。
2. 本番が production Clerk instance（`pk_live_`）であることを確認。production instance は共有 OAuth 非対応で、provider 別カスタム OAuth client + Clerk カスタム認証情報が必須（CF-20260531-002、Clerk 仕様）。
3. 未設定だと `createExternalAccount` がリダイレクト URL を返さず `linkWithGoogle` が黙って no-op → 症状「無反応・エラー無し」を説明できる唯一の整合的原因。
4. dev instance なら共有 OAuth で動くため、ローカル/dev では露見せず本番のみで顕在化（前回 fix が見逃した理由）。
5. よって remediation は**コード修正ではなく本番設定作業**（Google Cloud Console OAuth client 作成 → Clerk production instance に Use custom credentials 登録）= `/flow:release` §3.1 の social sign-in OAuth セットアップ。

## 3. 推奨 remediation（コードでない = 通常の fix 分岐に乗らない）

### 3.1 PRIMARY（必須・本番設定、human dashboard = Class C/B）
`/flow:release` §3.1 social sign-in custom OAuth セットアップ:
1. **Google Cloud Console**（共有 GCP プロジェクト、CF-20260531-003）→ OAuth consent screen を External + 本番公開（Testing のままだとテストユーザーしか入れない）。
2. **Credentials → OAuth client ID (Web application)** 作成 → **Authorized redirect URI = `https://clerk.<本番ドメイン>/v1/oauth_callback`**（Clerk 本番 instance が指定する値）を登録 → Client ID / Secret 取得。
   - 本番ドメイン = habit-stack.givers.work 系。Clerk production instance の正確な redirect URI は Clerk Dashboard の Google connection 設定で確認。
3. **Clerk Dashboard → 本番 instance → User & Authentication → SSO Connections → Google → 「Use custom credentials」ON** → Client ID/Secret 貼付。
4. 検証: 本番 /account で実際に「Google で引き継ぐ」を押し、Google 同意画面まで遷移 → 連携完了して authed owner になること（guest token スモークでは Clerk を経由せず client_id 空を見逃すため、**ブラウザで social ボタンまで実踏が必須**）。

> まず Clerk Dashboard で「Google connection に custom credentials が入っているか」を確認するのが最短の切り分け。入っていなければ本 finding 確定。

### 3.2 SECONDARY（任意・小コード改善、`/flow:fix`）
`AccountPage.tsx onLink` は try/finally で **catch が無く**、`linkGoogle()` が throw しても**ユーザーに何も表示されない**（無反応の一因にもなり得る）。OAuth 開始失敗時に「Google 連携を開始できませんでした」等のフィードバックを出す小修正を別途 `/flow:fix _shared/auth` で検討可（設定修正後も failsafe として有用）。ただし PRIMARY（設定）を直さない限りボタンは動かないため、二次対応。

## 4. 却下時の対応
該当なし（バグ判定）。

## 5. 判定保留時の論点
該当なし。ただし PRIMARY remediation は **human dashboard 作業（Class C/B）**で、claim/コードコマンドでは自動実行できない（claim 根本原則 #1: 実装/設定はユーザー承認の伴う作業に委ね、停止して提示する）。→ 自動 route せず、本レポートで human action を提示。

## 6. 関連
- クレーム原文: `./000_CLAIM_REPORT.md`
- 前回 fix（動線実装）: `../fix_C20260609-002_20260609_google-login-doukan/`
- remediation SoT: `~/.claude/flow-data/env-acquisition-guide.md` + `/flow:release` §3.1 social OAuth / perspectives O22 / CF-20260531-002
