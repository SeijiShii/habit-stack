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
- id: D20260608-058
  timestamp: 2026-06-08T20:40:00+09:00
  command: /flow:release
  phase: Phase 1 §1.0c / DEV スキップ判断
  question: DEV/test 環境を作るか本番直行か
  options:
    - prod-direct (本番直行) (recommended)
    - DEV-first (慎重)
  recommended: prod-direct
  chosen: prod-direct (本番直行) — 116 unit/integration + E2E green・課金系 test 検証済・ドメイン確定済で推奨条件充足
  chosen_type: explicit-choice
  depends_on: [D20260608-057]
  context: |
    §1.0c 新機構 (CF-20260608-011) の初適用。FILL先=.env.production.local(live)、
    Phase2 ローカル確認 skip → post-deploy スモーク(実機+100円実課金 B-4)。
    依存順: GitHub push → Vercel+domain DNS → Clerk prod instance(clerk.<domain> DNS) → Neon prod → Stripe live+webhook → FILL → deploy。

---
## 追記 (D20260609_001 auto 再開, 2026-06-09 12:05)
- §4.5.1#0 no-key/Class-A 残作業を点検 → **デプロイ scaffold (§3.1c) が未生成**を検出 = Class A no-key 作業あり → 停止せず生成
- 生成 (commit f65b6a8): scripts/vercel-build.mjs (Build Output API, Web 標準ハンドラ, esbuild bundle で O51 回避) / sync-prod-env.sh / deploy-prod.sh (関数数ガード 7/12) / with-env.sh
- ローカル検証: vite build + 7 関数 bundle 成功、各 .mjs import OK (ERR_MODULE_NOT_FOUND なし)
- → **Class A 枯渇**。残り = GitHub/Vercel/Clerk prod/Neon/Stripe live + FILL + deploy = 全 Class C/B human gate。Phase 1 prod FILL ハンドオフへ。

---
## デプロイ完了 (D20260609_001, 2026-06-09 14:18)
- prod-direct 実行: GitHub push (SeijiShii/habit-stack) → Vercel link (quadii) → domain habit-stack.givers.work (CNAME) → Clerk prod (5 DNS verified) → Neon prod (migrate 5 tables) → Stripe live + webhook → FILL → deploy
- **本番 2 バグを deploy 中に検出・修正**:
  1. Web 標準ハンドラが launcherType:Nodejs で hang/500 → vercel-build に Node↔Web adapter (commit c7ad9f7)
  2. Clerk guest createUser 識別子なしで 422→503 → 合成 email+password (commit a10a386, CF-20260529-016)
  3. env テンプレ CLERK_PUBLISHABLE_KEY (server) 欠落 → 追加 (commit d6333b3) + flow 横展開 (CF-20260609-005)
- post-deploy smoke green: / 200 / api/health 200 / api/auth/guest 200(ticket) / api/sync/pull 401(gate OK)
- 公開 URL: https://habit-stack.givers.work
- 残: 実機ブラウザ確認 + Stripe webhook テストイベント + 実 100円 tip (B-4) / P4.8 promote 告知文生成
