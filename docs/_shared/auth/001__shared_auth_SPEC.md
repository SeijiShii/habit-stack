# _shared/auth 仕様書（認証・認可基盤・横断）

> **役割**: Clerk による匿名ゲスト → 段階的認証（Google リンク）、owner resolver（全 API の行レベル所有権強制）、ゲスト→アカウント連携時のデータ引き継ぎ。
> **target_type**: cross-cutting（提供インターフェース + サーバ/クライアント wiring。E2E は feature 側でカバー）
> **タグ**: auth-required（SEC-001）, offline-critical（匿名ローカル → 認証後同期）
> **最終更新**: 2026-06-08
> **入力**: `../../concept.md` §1.1 UC8 / §3.X SEC-001,004 / §4.3、perspectives O22, O05
> **関連ゲート**: /flow:auto P4.46 Auth-impl gate（本番ゲストセッション経路の実コードを実装まで要求）

---

## 1. 提供インターフェース

### 1.1 サーバ側
- `getOwnerId(req): Promise<OwnerId>` — Clerk セッション（`auth()`）から userId を解決。匿名ゲストも Clerk の anonymous user id を返す。**未認証で解決不能なら 401**。
- `withOwner(handler)` — Vercel Function ラッパ。owner を解決して handler に注入し、未解決は 401 を返す。全保護 API はこれを通す。
- `requireOwner(ownerId, resourceOwnerId)` — リソースの owner_id と一致検証（不一致は 403/404）。
- `mergeGuestData(fromOwnerId, toOwnerId)` — ゲスト→アカウント連携時、ローカル由来データの owner_id 付け替え（サーバ側は同期済みデータの再owner化、主処理は local-sync と協調）。

### 1.2 クライアント側
- ClerkProvider ラッパ（`<AuthProvider>`）。
- 初回起動: **匿名サインイン**（Clerk anonymous / no-password）を自動実行 → 0 タップで実行開始可能（O22）。
- `useOwner()` — 現在の owner id（匿名 or 認証）。
- `linkWithGoogle()` — 段階的認証。匿名ユーザーを Google OAuth でアップグレード（同一 owner id を維持 or 移行処理を起動）。**データ引き継ぎ時・複数端末同期時**に呼ぶ（`/account` 画面の任意導線）。**応援（tip）はログイン不要のため呼ばない**（O46🎁）。
- `signOut()` / `deleteAllData()`（O54 セルフサービス削除導線、§6.x）。

## 2. 入出力（提供 API）
### 2.1 副作用
- 匿名サインインで Clerk セッション確立（cookie/token）。
- Google リンクで Clerk user に external account 紐付け。
- mergeGuestData で DB の owner_id 付け替え + local-sync 再同期。

## 3. データモデル
- DB スキーマ変更なし（owner_id = Clerk user id を各テーブルが保持、_shared/db §3.3）。
- ゲスト→アカウント移行は owner_id 文字列の付け替えのみ（新規テーブル不要）。

## 4. バリデーション + エラーケース
| 条件 | 振る舞い |
|---|---|
| 未認証で保護 API アクセス | `withOwner` が 401 |
| 他人のリソース参照（owner_id 不一致） | `requireOwner` が 404（存在秘匿） |
| 匿名サインイン失敗（Clerk 障害） | クライアントはローカル（IndexedDB）動作継続、同期は復帰後（offline-critical） |
| Google リンク中断 | 匿名セッション維持、再試行可能 |
| owner_id をクライアントが詐称 | サーバは Clerk セッション由来値のみ使用（クライアント送信 owner を無視、SEC-001） |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 | 根拠 |
|---|---|---|
| 初回起動→実行可能 | 体感1秒（匿名は非ブロッキング、ローカル先行） | §3 NFR / O22 |
| owner 解決 | サーバ側 Clerk 検証 < 100ms | 性能 |

### 5.2 連携
| 連携先 | 内容 |
|---|---|
| _shared/db | owner_id をクエリに強制（owner resolver 経由） |
| _shared/local-sync | 匿名ローカル → 認証時同期、mergeGuestData 協調 |
| tip-jar | **ログイン不要**（応援=対価なしのギフト、ゲストのまま決済完結。O46🎁 / CF-20260609-010。`linkWithGoogle` ゲートを課さない） |
| 全 feature API | withOwner でラップ |

## 6. タグ別追加項目

### 6.1 認可（auth-required / SEC-001, SEC-004）
- **owner resolver パターン**: 全保護 API は `withOwner` 経由。owner_id はサーバ側 Clerk セッションからのみ。Drizzle クエリは必ず `where owner_id = ownerId`。
- **PII ログ（SEC-004）**: 認証エラー/owner ログに email・Google プロフィールを出さない。Sentry beforeSend でマスク。
- **削除セルフサービス（O54、concept §9.2）**: `deleteAllData()` が owner_id 配下の全データ（sets/items/sessions/records/achievements）+ ローカル IndexedDB を削除。匿名は運営が特定不能のためアプリ内完結（非交渉の必須導線）。

### 6.3 オフライン（offline-critical）
- 匿名は IndexedDB に local-first（owner = 端末ローカルのゲスト識別 or Clerk anonymous id）。Google リンク時に `mergeGuestData` でサーバ owner に統合。

## 7. スコープ外
- パスキー（WebAuthn）= v2（concept §12.7）
- メール/パスワード認証（匿名 + Google のみ）
- RLS（アプリ層 owner resolver で代替、_shared/db §6.1）

## 8. 未決事項
### [論点-009] ゲスト→アカウント移行時の owner id 統合方式
- **影響範囲**: linkWithGoogle / mergeGuestData / local-sync
- **問い**: Clerk anonymous→authed で (a) 同一 user id が維持されるか（移行不要）/ (b) 新 user id になりローカルデータの owner 付け替えが要るか。
- **候補**: 案A Clerk の anonymous→permanent upgrade で同一 id 維持（移行最小）。案B 新 id + mergeGuestData で DB/local の owner 付け替え。
- **推奨**: 案A（Clerk が anonymous user の永続化アップグレードを提供する場合、最小実装）。提供されない場合は案B。実装着手時に Clerk API で確認。
- **判断期限**: tdd 着手前（Phase 3）/ **担当**: 実装時に Clerk ドキュメント確認

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
