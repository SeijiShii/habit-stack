# AI_LOG セッション D20260608_031 — /flow:release

**実行日時**: 2026-06-08 20:15 〜 (進行中、Class C 人間ハンドオフ)
**コマンド**: /flow:release（/flow:auto P4.7 Release gate）
**対象**: habit-stack 公開準備
**実行者**: Claude (Opus 4.8) + seiji
**状態**: 進行中（Phase 1 env FILL = Class C、人間の実キー入力待ち）
**ファイル**: `D20260608_031_release_habit-stack.md`

## live 化判定
- ① .env.production.local 不在 → ② .env.development.local 不在 → .env.local 不在 = **test/dev のまま（pre-release）**
- PJ = 公開 + tip-jar 課金 → live 化必須（便宜 DEV → 本番一本化モデル）

## Phase 1 の意味
便宜 DEV 環境（dev/test キー）を構築 → Phase 2 ローカル動作確認 → Phase 3 本番リリース。
書込先 = `.env.development.local`（Vite、.env.local は prod build で焼き込まれるため使わない）。

## 依存グラフ（canonical 順序）
公開ドメイン確定(§3.2) → URL-bound 設定(Stripe webhook/APP_URL) → デプロイ → promote 告知

## 必要キー（.env.example SoT）
- Clerk: VITE_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY（dev instance、test キー）
- Neon: DATABASE_URL（新規 or branch、無料枠）
- Stripe: VITE_STRIPE_PUBLISHABLE_KEY / STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET（test、webhook はドメイン確定後）
- Sentry: VITE_SENTRY_DSN / SENTRY_DSN（任意、未配線時 skip 可）
- APP_URL（公開ドメイン）
- feedback-hub: HUB_FEEDBACK_ENDPOINT / HUB_SERVICE_INFO_SECRET（[論点-010]、未構築なら空=degrade）

## Decisions（進行中）
```yaml
- id: D20260608-056
  timestamp: 2026-06-08T20:15:00+09:00
  command: /flow:release
  phase: Phase 1.0 / live 化判定
  question: live 化状態
  options:
    - test/dev のまま（pre-release）
  recommended: test/dev のまま
  chosen: test/dev のまま（実キーゼロ、便宜 DEV から構築）
  chosen_type: auto-recommended
  depends_on: []
  context: .env.production.local/.env.development.local/.env.local 全不在。公開+課金 PJ で live 化必須。
- id: D20260608-057
  timestamp: 2026-06-08T20:18:00+09:00
  command: /flow:release
  phase: Phase 1 §3.2 / 公開ドメイン確定（[論点-002]）
  question: 公開ドメイン
  options:
    - habit-stack.givers.work（サブドメ） (recommended)
    - 別サブドメ名
    - vercel.app で開始
  recommended: habit-stack.givers.work
  chosen: habit-stack.givers.work（givers.work サブドメ運用、O29 撤退リスク最小、PJ slug）
  chosen_type: explicit-choice
  depends_on: [D20260608-056]
  context: |
    公開 URL=https://habit-stack.givers.work / Stripe webhook=/api/tip/webhook / APP_URL=同。
    [論点-002] resolved。webhook URL・告知 URL の上流確定。
```
