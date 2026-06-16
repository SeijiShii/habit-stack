# 実装レポート: 認証トークン陳腐化 → owner churn データ消失 fix（bousai guest-JWT 機構の移植）

## 実装日時
2026-06-17（JST）

## モード
fix（C20260617-001、案A=bousai revise_003 guest 自前署名 JWT 機構の移植 + one-time orphan migration）

## 関連ドキュメント
- ./000_調査レポート.md / ./001_ROOT_CAUSE.md / ./002_FIX_PLAN.md / ./003_REGRESSION_TEST.md / ./004_POSTMORTEM.md
- AI_LOG: ../../AI_LOG/D20260617_002_fix__shared_auth_C20260617-001.md
- 範型: bousai-bag-checker `src/shared/auth/*`（revise_003）

## 注意事項
ファイルパス・行番号は実装日時時点。

## 重要な前提（実装中に判明 → 方針確定）
- **server sync は未配線**（`useSync`/`SyncQueue` は `App.tsx` で未使用）→ 本バグは **100% クライアント側 owner churn**（`AuthProvider` が owner を churn する Clerk guest userId に直結）。
- ユーザー決定: **完全 bousai 移植**（ゲストを Clerk 非セッション化、owner=永続 guest JWT sub、連携は OAuth sign-in + reassign）。

## 変更一覧

### 新規（bousai 範型の移植）
| ファイル | 内容 | テスト |
|---|---|---|
| `src/services/auth/guestToken.ts` | 自前署名 guest JWT (HS256) sign/verify。iss=habit-stack-guest, TTL 180日。server 専用署名。 | guestToken.test.ts (9) |
| `src/services/auth/guestClient.ts` | localStorage 永続（key=habit-stack.guestToken）get/store/clear/fetch/buildEnsure + decodeGuestSub。 | guestClient.test.ts (11) |
| `src/services/auth/guestProvision.ts` | provisionGuest=genSub(`guest_<uuid>`)+signToken。**Clerk createUser しない**（churn 源除去・MAU 不消費）。 | guestProvision.test.ts (3) |
| `src/services/auth/guestOrClerkAdapter.ts` | 複合 owner resolver。Bearer の iss で guest JWT を verify→sub、else Clerk フォールバック（additive・SEC-001 維持）。 | guestOrClerkAdapter.test.ts (5) |

### 改修（カットオーバー）
| ファイル | before | after |
|---|---|---|
| `src/components/auth/AuthProvider.tsx` | owner=Clerk userId（guest=Clerk ticket セッション、churn 源）。link は refreshGuestTicket+createExternalAccount の reverification 回避ダンス。 | **未サインイン時 owner=永続 guest JWT sub**（Clerk userId を見ない=churn 免疫）。`pickOwnerId` 純ロジック抽出。Google ログインは OAuth sign-in 一本化（O58、reverification 壁を踏まない）。連携確立で clearGuestToken。 |
| `src/app/repos.ts` | deviceOverwrite marker gate でのみ reassign。 | owner 確立時に **`reassignOtherOwnersTo` を無条件実行** = ①旧 churn データ（旧 Clerk guest userId / 旧ローカルゲスト id）回収 ②ゲスト→アカウント引き継ぎ。破棄せず付け替え。 |
| `api/auth/guest.ts` | Clerk 匿名 user 作成 + `{ticket}` 返却。 | provisionGuest + signGuestToken(GUEST_TOKEN_SECRET) で `{guestToken}` 返却。secret 未設定は 503 degrade。 |
| `src/server/context.ts` | adapter=Clerk のみ。 | 複合 adapter（guest JWT iss 振り分け + Clerk フォールバック）を配線。 |
| `.env.example` | — | `GUEST_TOKEN_SECRET` を追加（release Phase 1 FILL 対象）。 |

### 削除（旧 churn 機構＝本バグの発生源）
- `src/services/auth/guestSession.ts`（issueGuestTicket=Clerk createUser churn 源）+ test
- `src/services/auth/linkWithGoogle.ts`（createExternalAccount 連携）+ test
- `src/services/auth/deviceOverwrite.ts`（wipe marker）+ test
- → いずれも新方式で不要・未参照（dead code）。削除で churn 源を物理的に除去。

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 計画にない追加 | (1) server sync 未配線の判明 → クライアント主眼に焦点。(2) 旧 churn 3 ファイルの削除（計画は「撤去/縮退」、実際は完全削除）。(3) `pickOwnerId` 純ロジック抽出（回帰テスト容易化）。 |
| 計画から省略 | DB users 行 upsert（habit-stack は owner=free string で FK なし→不要）。guestClient の single-flight `ensureGuestSession`（AuthProvider 内の ensuring ref で代替）。 |
| 想定外 | tsc TS2774（setActive 常時定義）→ setActive 不使用（OAuth は /sso-callback が session 確立）で解消。 |
| degraded 耐性 | GUEST_TOKEN_SECRET 未設定でも client は永続ローカルゲスト id で動作 = owner 安定（churn しない）。secret はサーバ owner 検証（将来 sync）用。 |

## PR Description
### タイトル
fix(auth): 認証トークン失効→リロードの owner churn データ消失を根治（bousai guest-JWT 移植）

### 概要
匿名ゲストを Clerk セッションから切り離し、サーバ自前署名 guest JWT を localStorage に永続して owner を sub に固定。Clerk セッション失効・リロードをまたいでも owner が churn せず、owner-scoped ローカルデータが orphan 化しない。既存 orphan データは owner 確立時の無条件 reassign で回収。

### テスト
- 新規 28 + 回帰（pickOwnerId churn 免疫 4）。全 272 tests green / tsc clean。
- 旧 churn 機構削除で本バグの発生コードを物理除去。
