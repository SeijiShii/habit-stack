# 依存ライブラリ脆弱性スキャン結果（C20260616-001 release-pre）

**スキャン日**: 2026-06-16
**対象**: `package-lock.json`（npm）
**スキャナ**: `npm audit`
**契機**: /flow:auto §3.0c release-pre 必須監査（C20260616-001 データ消失 fix デプロイ前）

## 1. サマリ
- 総検出: 8 件（Critical 1 / High 2 / Moderate 5 / Low 0）
- **本 fix で新規追加された CVE: 0 件**（`package-lock.json` は本 fix で不変＝最終変更 commit `11e4ad5`、依存追加なし）
- 全件が **既知の dev-only（build/test ツールチェーン）** で、本番バンドル非同梱。concept §8 [論点-011] [SEC-DEP-002] で `accepted-risk` 受容済み。
- **release ブロッカー: 0 件**

## 2. Critical / High 詳細（すべて dev-only・accepted-risk 既存）

### 2.1 Critical
- **vitest（@vitest/mocker / Vitest UI server で任意ファイル read+exec）**: dev/test 専用。本番非同梱。修正に vitest3→vite6/7 が必要で Node 22.11 build を破壊するため Node 22.12+ アップ後に移行（SEC-DEP-002）。

### 2.2 High
- **esbuild（dev server が任意サイトからのリクエストを許可）**: build/dev 専用、本番非同梱。
- **vite（Optimized Deps `.map` の path traversal / launch-editor NTLMv2）**: dev 専用、本番非同梱。

> いずれも vitest/vite/esbuild の dev-server・test-runner 系で、production ランタイムに含まれない。`accepted-risk`（Node 22.12+ アップ後に vitest3+vite6 移行で closed 化予定、詳細 `./SECURITY_DEPS_20260608.md#22`）。

## 3. Moderate（5 件、記載のみ）
- vite/esbuild 系の派生（dev-only）。本番影響なし。

## 4. 本 fix（C20260616-001）の攻撃面評価
- 新規エンドポイント: なし
- 新規外部入力: なし（ローカル IndexedDB の owner 付け替えのみ）
- 新規依存: なし
- cross-owner データ露出: なし（`reassignOwnerLocal` はローカル限定。サーバ push は owner をサーバが強制＝SEC-001。付け替え後 push は認証済み owner に帰属）
- → **本 fix は新たな攻撃面を導入しない**。

## 5. 結論
release-pre secure: **新規 finding 0 / ブロッカー 0**。既存 dev-only accepted-risk のみ。デプロイ可。
