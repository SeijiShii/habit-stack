# 実装レポート: _shared/app-shell

## 実装日時
2026-06-08 19:34 (JST)

## モード
feature（合成 target、O57、優先度最後）

## 関連ドキュメント
- 001-003 + 905 + [AI_LOG](../../AI_LOG/D20260608_028_tdd__shared_app-shell.md)

## 変更一覧
### 合成ルート + Providers
- `index.html`（PWA/icon link）、`src/main.tsx`（ErrorBoundary > AuthProvider > QueryClientProvider > BrowserRouter > App + theme.css）。
- `src/App.tsx` + ルーティング（/ /sets /summary/:setId /legal/* + 404）。
- `src/app/repos.ts`（useRepos: LocalStore + owner から SetsRepo/ExecutionRepo/SummaryRepo を提供）。
### グローバル UI
- `src/components/AppLayout.tsx`（ナビ + 入口リード O41 + インフォボタン + フッタ法務 O55）。
- `src/components/ErrorBoundary.tsx`（フォールバック + Sentry 配線点）。
- `src/pages/HomePage.tsx`。
### API ルートハンドラ配線（Vercel Function エントリ）
- `api/health.ts` + `src/server/context.ts`（遅延配線）+ sync/push・pull・tip/checkout・tip/webhook の default wired export（実 Clerk/Stripe/Neon）。
### デザイン適用
- `src/styles/theme.css`（design-system トークンを CSS 変数化）。
### bootstrap（O36/O37/O56）
- `scripts/dev.sh` / `stop.sh`、`.github/workflows/ci.yml`（typecheck/test/build/audit）+ `dependabot.yml`、`.env.example`、`scripts/gen-favicon.mjs` + `public/`（favicon.svg + 派生 PNG 192/512/maskable/apple-touch）、`vite.config.ts`（PWA: manifest + SW、dev は SW 無効 R2）。

## 完了条件（O57/O36/O37）
- ✅ **`vite build` 成功**（251 modules、manifest + SW 生成、dist 出力）= デプロイ可能なアプリが組み上がった
- ✅ 全 route に inbound link（O55）、入口「これは何？」（O41）
- ✅ 匿名→authed セッション経路（P4.46、auth で実装済を配線）
- ✅ ブランドマーク + PWA インストール可（O56）
- ✅ CI yaml（O37）、dev.sh（O36）

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 追加 | react-router-dom / vite-plugin-pwa / sharp 導入 |
| 後続 | 本番デプロイ実行（Class B、/flow:release）。consent 記録 / 運用者通知の実配線は実キー時 |
| 問題と対処 | なし（build green） |

## PR Description
### タイトル
_shared/app-shell: アプリ合成レイヤ（O57 合成ルート/API配線/PWA/bootstrap）
### 概要
全 feature + 全 _shared を 1 つの動く・デプロイ可能な PWA に組み立て。build 成功で O57 を実証。
### テスト
5 テスト（App 合成: ホーム/法務/O41/O55/404）+ vite build green。累計 115/115 green。
