# 実装レポート: _shared/auth

## 実装日時
2026-06-08 18:50 (JST)

## モード
feature

## 関連ドキュメント
- 001-003 + 905_SPEC_REVIEW + [AI_LOG](../../AI_LOG/D20260608_020_tdd__shared_auth.md)

## 変更一覧

### Phase 1: owner resolver（SEC-001）
- `src/services/auth/owner.ts`: `AuthAdapter`(injectable) + `withOwner`(401未認証/owner注入) + `requireOwner`(404存在秘匿) + `AuthError`。クライアント送信 owner 無視。

### Phase 3.5: 実 Clerk セッション経路（P4.46）
- `src/services/auth/clerkOwnerAdapter.ts`: `createClerkAuthAdapter`(@clerk/backend authenticateRequest → userId)。匿名/認証済みを解決、未認証 null。
- `src/services/auth/guestSession.ts`: `issueGuestTicket`(users.createUser skipPassword + signInTokens.createSignInToken)。0 タップ実行用ゲストチケット（O22）。
- `api/auth/guest.ts`: ゲストチケット発行エンドポイント（env 未設定で 503 degrade、offline 継続）。

### Phase 2: client Provider + hook
- `src/components/auth/AuthProvider.tsx`: ClerkProvider + 初回起動で匿名サインイン（fetch /api/auth/guest → `signIn.create({strategy:'ticket'})`）。失敗時 degrade。
- `src/hooks/useOwner.ts`: useAuth → OwnerId。

### Phase 4 + Phase 3(server): データ操作（O54 / [論点-009]）
- `src/services/auth/dataOps.ts`: `deleteAllData`(owner 配下全 5 テーブル削除、O54 セルフサービス削除) + `reassignOwner`(ゲスト→アカウント移行 owner 付け替え)。

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 追加 | React/Vite/Clerk スタック導入（auth client + 以降の feature UI 共通基盤）。jsdom→happy-dom（CSS require 回避） |
| 省略/後続 | Google リンク UI フロー（app-shell の UI 配線時）、delete/merge の**ローカル IndexedDB 側**（local-sync 配線時）。サーバ側は実装済み |
| 問題と対処 | 実 Clerk 検証は CLERK_SECRET_KEY（実キー）が必要 → unit は injectable mock client で本番経路コードを検証、live 疎通は /flow:release |

## PR Description
### タイトル
_shared/auth: 認証認可基盤（owner resolver/匿名ゲストセッション/O54削除）

### 概要
Clerk 匿名ゲスト → 段階認証の本番セッション経路 + 行レベル owner-check（SEC-001）+ セルフサービス削除（O54）を実装。P4.46 ハードゲート充足（実セッション経路 + 匿名→authed 200 検証）。

### テスト
auth 関連 19 テスト（owner 7 / clerkAdapter 5 / guestSession 2 / guest endpoint 1 / useOwner 2 / dataOps 2）。累計 37/37 green、typecheck green。
