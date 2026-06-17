<!-- auto-generated-start -->
# 設計レベル脆弱性レビュー — guest 自前署名 JWT 認証機構（C20260617-001）

**レビュー日**: 2026-06-17
**レビュー実施者**: Claude (Opus 4.8) + seiji
**対象**: _shared/auth（C20260617-001 で Clerk 非セッション化 → 自前署名 guest JWT に刷新された認証機構）
**入力**: src/services/auth/{guestToken,guestProvision,owner,guestClient}.ts + api/auth/guest.ts + concept §3/§8 + .env.example/.gitignore
**観点ソース**: ~/.claude/flow-data/perspectives.md（O23-O28 + legal_required O54）
**severity-threshold**: medium
**契機**: /flow:auto §3.0c 鮮度ゲート（前回 secure = D20260616_006 deps-only、以降に auth 機構が全面刷新 = 新規攻撃面の design-level 再レビュー）

## 1. PJ 性質判定
複数ユーザー / 公開（givers.work）/ 無償（tip-jar 投げ銭のみ）/ 個人情報扱いあり（習慣ログ）/ AI なし / 国内向け。ゲスト+Google progressive auth（O22 require）。

## 2. 脆弱性パターン照合結果

### 2.1 サマリ
- Critical: 0 件
- High: 0 件
- Medium: 0 件
- Low: 0 件（Info 注記 1 件、§2.3）
- 法令必須（O54 DSR）: 充足（既往、§2.4）
- **新規 §8 論点登録: 0 件**

### 2.2 新機構の脆弱性照合（PASS 詳細）

| 観点 | 検証項目 | verdict | 根拠 |
|---|---|---|---|
| O25 秘密情報管理 | guest JWT 署名鍵 | ✅ PASS | `GUEST_TOKEN_SECRET` は server env のみ（`process.env`、VITE_ 露出なし）。`.env.example` 記載済 + `.gitignore` に `.env`/`.env.local`/`.env.*.local`。署名は `api/auth/*` server 専用、pure fn は secret を引数注入（env 読まない=テスト可） |
| O23 認可漏れ / owner 解決 | guest sub 偽造・他人データ越境 | ✅ PASS | 署名 server 専用 → client は不透明 token 保持のみ = `sub` 偽造不可（SEC-001 維持）。`withOwner` は server-side adapter からのみ owner 解決、**クライアント送信 owner 値を一切信用しない**。`requireOwner` は owner 不一致を **404（存在秘匿）** にマップ（403 で他人リソース存在を漏らさない） |
| 認証トークン設計 | JWT 署名・検証の堅牢性 | ✅ PASS | HS256 HMAC-SHA256（`node:crypto`）。署名比較は **`timingSafeEqual`**（タイミング攻撃耐性）。検証は header の `alg` を無視し常に HS256 再計算で照合 → **alg=none / alg confusion 不成立**（secret なしに HMAC 偽造不可）。`iss="habit-stack-guest"` 固定検証で Clerk JWT を guest 経路に誤受理しない。`exp`（既定 180 日）検証あり |
| O24 入力検証 | token 形式 | ✅ PASS | `parts.length !== 3` で malformed 弾き、payload JSON parse 失敗は `GuestTokenError` → handler が 401 マップ |
| O26 PII ログ漏洩 | token 値ログ出力 | ✅ PASS | 実装コメントで「token 値はログに出さない」明記、エラーは `GuestTokenError`（メッセージ定数、token 非含有） |
| O27 レート制限 | guest 発行 endpoint | ✅ PASS（既往） | `POST /api/auth/guest` は既存 SEC-005 レート制限/Turnstile 方針配下。新機構でも POST 限定（GET=405）+ secret 不在時 503 degrade |
| O28 依存脆弱性 | 新規 deps | ✅ PASS | 新機構は `node:crypto` 組み込みのみ使用、lockfile 不変。SECURITY_DEPS_20260616（deps、新規 finding 0、dev-only accepted-risk のみ）が fresh |

### 2.3 Info 注記（非 finding）
- **guest JWT TTL = 180 日（長命）**: 失効戦略は「長命 + 連携成功時に client 側で破棄（`clearGuestToken`）」。これは **owner churn 根治の設計意図そのもの**（Clerk セッション失効/リロードに耐える）であり脆弱性ではない。署名は server 専用・偽造不可・iss 固定のため長命でも越境リスクなし。連携時破棄でゲスト痕跡を残さない。→ 受容（設計通り）。

### 2.4 O54 DSR-feasibility ペア検査（legal_required, O22×O12）
- ✅ 充足（既往）: in-app セルフサービス削除 `selfDelete`/`dataOps`（本番 DELETE /api/account 401 で履行可能、prior smoke）+ 閲覧 UI による開示 + プラポリ明記。guest-JWT 化は DSR 履行性を悪化させない（owner-scoped 削除は owner 解決経路に依存、新機構でも `withOwner` 経由で同一）。

## 3. §8 未決事項に登録した論点
なし（新規 Critical/High = 0）。既存 SEC-001〜005（accepted-as-requirement）は新機構でも維持されていることを確認。

## 4. 次のステップ
- 本 L1 レビューで新機構は 0 新規 finding → release-pre のセキュリティ面はクリア。
- L3 実装後コードレビューは任意（Anthropic `security-review`）。本機構は unit 272 green + 本 L1 design review で設計妥当性を確認済。
- L4 継続監視は既存方針（Node 22.12+ アップ時に vitest3+vite6 移行で SEC-DEP-002 closed）。
<!-- auto-generated-end -->
