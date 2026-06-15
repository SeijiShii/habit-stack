# D20260615_011 release habit-stack

> **実行日時**: 2026-06-15（JST）
> **コマンド**: /flow:release（/flow:auto P4.7 Release gate から dispatch）
> **対象**: R20260615-001 + F20260615-001 の本番反映
> **実行者**: Claude (opus-4-8) + seiji
> **状態**: 完了（prod デプロイ済 + 自動スモーク green）
> **metrics**: { deploy_target: production, functions: 8, deployed_url: "https://habit-stack.givers.work", smoke: green }

## サマリ

R20260615-001（アカウント切替時の計時停止緩和 + デバイス⇔アカウント同期ポリシー）+ F20260615-001（計時停止後の「進行中」表示残存 fix）を本番 prod へ直行デプロイ。§1.0 = live 化済（Clerk/Stripe sk_live_）、§1.0c = ユーザーが prod-direct 選択。build 8 functions（上限内）、`vercel deploy --prebuilt --prod` で READY。canonical `habit-stack.givers.work` で frontend 200 / guest 200 / 認証ゲート 401 / デプロイ JS hash = local build 一致を確認。

## 実機・人間確認（post-deploy、ユーザー手番）
以下は実機スマホ + 実 Clerk/Google が要るため未実施（ユーザーが任意のタイミングで）:
- aged guest session での Google ログイン（C20260614-002 領域、release §3.4 #4.5）
- サインアウト → デバイス wipe / 既存アカウントログイン → 上書き の実 Clerk 挙動
- アカウント切替時の「計時中の活動があります。停止しますか？」確認ダイアログ
- 計時終了 → 一覧でバッジ消滅（F20260615-001、実機）

## Decisions

```yaml
- id: D20260615-043
  timestamp: 2026-06-15T09:50:00+09:00
  command: /flow:release
  phase: §1.0 + §1.0c
  question: live 判定 + デプロイ target
  options: [preview 先行, prod 直行, デプロイしない]
  recommended: preview 先行（auth/データ系改修）
  chosen: prod 直行（ユーザー選択）。§1.0 = .env.production.local CLERK/STRIPE_SECRET_KEY = sk_live_ → live 化済
  chosen_type: explicit-choice
  depends_on: [D20260615-042]
  context: live PJ 改修。CF-20260610-002 に従い target を 1問1答（silent 直行しない）。ユーザーが prod-direct を選択。

- id: D20260615-044
  timestamp: 2026-06-15T09:55:00+09:00
  command: /flow:release
  phase: Phase 3 デプロイ + §3.4 スモーク
  question: 本番デプロイ実行 + 検証
  options: []
  recommended: build 検証 → deploy → 自動スモーク
  chosen: |
    Class A build 検証（8 functions < 12、static + PWA OK）→ bash scripts/deploy-prod.sh（vercel authed=quadiishii-9506、CLI deploy）→ READY。
    canonical habit-stack.givers.work: frontend 200 / POST /api/auth/guest 200（O22 OK 非 500/非 401）/ GET /api/sync/pull 401（owner ゲート正常）/ deploy JS hash=local 一致。
  chosen_type: auto-recommended
  depends_on: [D20260615-043]
  context: |
    deploy URL は Deployment Protection で 401 だが canonical 独自ドメインは公開 200。実機 social/wipe/上書きはユーザー手番（post-deploy）。
```
