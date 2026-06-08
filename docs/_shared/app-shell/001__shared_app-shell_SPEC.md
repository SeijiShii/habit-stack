# _shared/app-shell 仕様書（アプリ合成レイヤ・横断、O57）

> **役割**: 全 feature + 全 _shared を 1 つの動く・デプロイ可能な PWA に組み立てる合成 target。合成ルート（main/App/router/providers）+ UI↔data 配線 + API ルートハンドラ層 + Clerk セッション確立 + PWA + deploy scaffold。
> **target_type**: cross-cutting（合成。優先度最後、全部に依存）
> **タグ**: auth-required, offline-critical（PWA/SW）
> **最終更新**: 2026-06-08
> **入力**: 全 feature SPEC + 全 _shared SPEC、concept §1.3.2 / §4.5 / §4.7 / §10、perspectives O57/O36/O37/O22/O55/O56
> **重要**: これが無いと「部品は全部あるが動くアプリが無い」状態が release まで露見する（O57）。

---

## 1. 提供インターフェース（合成）

### 1.1 合成ルート
- `index.html`（PWA manifest/icon link、SEC-003 publishable env のみ）
- `src/main.tsx`（エントリ、Providers ツリー）
- `src/App.tsx` + `src/routes.tsx`（ルーティング: /, /sets, /sets/:id, /run/:setId, /summary, /legal/*, settings）
- Providers: `AuthProvider`（Clerk 匿名サインイン）、TanStack QueryClientProvider、design テーマ、ErrorBoundary（Sentry）

### 1.2 UI↔data 配線
- 各 feature の hooks（useSets/useExecution/useSummary）を画面に接続。
- グローバル UI: ナビ、フッタ（LegalFooter 常設 O55）、FeedbackWidget（O40）、TipJarButton（満足ピーク）。
- 入口の「これは何？」リード文/インフォボタン（O41）。

### 1.3 API ルートハンドラ層
- `api/` 配下の Vercel Functions を実装済み service に配線（sync/push・pull、tip/checkout、stripe-webhook、feedback、summary、health）。全保護 API は `withOwner`。

### 1.4 認証セッション確立（O22）
- 初回起動で匿名 Clerk セッション確立 → 0 タップ実行。段階認証（Google）導線。
- **P4.46 hard gate**: 本番ゲストセッション経路の実コードが通る（匿名→authed で保護 API 200）。

### 1.5 PWA + deploy scaffold（O36/O37）
- PWA: manifest.json、Service Worker（オフライン: local-first はアプリ層、SW は静的キャッシュ）、ブランドマーク（O56、design SVG 由来）。
- dev: `scripts/dev.sh`（Vite + vercel dev + health check + smoke）/ `scripts/stop.sh`。
- CI/CD: `.github/workflows/ci.yml`（lint/typecheck/unit/E2E sandbox/audit/coverage）+ Vercel preview 自動 + `dependabot.yml`。
- `.env.example`（全 env キー、実値なし、SEC-003）。

## 2. 入出力
- 合成のため新 API は health のみ（`/api/health`）。他は feature の API を集約配線。

## 3. データモデル
- なし（合成）。

## 4. バリデーション + エラーケース
| 条件 | 振る舞い |
|---|---|
| 起動時 Clerk 障害 | ローカル（IndexedDB）で動作継続、同期は後で（offline-critical） |
| ルート未定義 | 404 ページ（design 準拠） |
| 想定外例外 | ErrorBoundary + Sentry（PII scrub、SEC-004） |
| orphaned route | なし（全 route に inbound link、O55） |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 |
|---|---|
| 起動→実行可能 | 体感1秒（匿名非ブロッキング、O22） |
| デプロイ可能性 | `bash scripts/dev.sh` で全起動 + smoke green、PR で CI green、main で Vercel preview |
### 5.2 連携
| 連携先 | 内容 |
|---|---|
| 全 feature | hooks/UI を画面配線、API ハンドラ集約 |
| 全 _shared | Providers（auth/db/local-sync/types）、legal フッタ |
| design-system | テーマ/トークン/ブランドマーク適用 |

## 6. タグ別追加項目
### 6.1 認可（auth-required）
- 全 API ルートを withOwner で配線。匿名セッション確立（P4.46）。
### 6.3 オフライン（offline-critical / PWA）
- SW で静的アセットキャッシュ、local-first はアプリ層。オフライン起動可。

## 7. スコープ外
- 各 feature の中身（app-shell は配線のみ）
- 本番デプロイ実行（Class B、/flow:release）

## 8. 未決事項
- 現時点で論点なし（2026-06-08）。ルーティングライブラリ（React Router 等）は実装時に確定（推奨: React Router、軽量）。SW は vite-plugin-pwa を想定。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
