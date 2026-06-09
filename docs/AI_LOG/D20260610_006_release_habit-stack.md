# AI_LOG セッション D20260610_006 — release habit-stack

**実行日時**: 2026-06-10 (+09:00)
**コマンド**: /flow:release
**対象**: habit-stack (live 化済 PJ の改修デプロイ)
**実行者**: Claude (opus-4-8)
**状態**: 完了 (本番デプロイ済 + smoke green)

## 主要決定サマリ
- §1.0 live 判定: `.env.production.local` CLERK_SECRET_KEY=sk_live_ + STRIPE_SECRET_KEY=sk_live_ → **live 化済**。
- §1.0c (case ii, CF-20260610-002): 改修の deploy target を 1問1答 → seiji「本番 prod 直行」。
- §1.1 env: 不足なし。空値 4 件 (VITE_STRIPE_PUBLISHABLE_KEY=server redirect 未参照 / Sentry / Hub) は optional でブロッカーなし。関数数 7 (<12)。
- §3.3 Class B 明示確認 → yes → `bash scripts/deploy-prod.sh` 実行。
- デプロイ: Production READY、aliased **https://habit-stack.givers.work**。
- §3.4 smoke: / 200 / guest 200 (O22 認証 UX 稼働) / api 500 なし (O51) / sync GET は SPA fallback (leak なし)。
- 改修バンドル: execution timer fix (C20260610-001) + Google ログイン動線 (C20260609-002) のコードが本番化。
- **残: Google ログインは GCP custom OAuth + Clerk production social connection 設定 (Class C) 未了のため本番では未稼働** (seiji が prod 直行を選択時に了承)。

## Decisions

```yaml
- id: D20260610-024
  timestamp: 2026-06-10T00:00:00+09:00
  command: /flow:release
  phase: §1.0c deploy target (live PJ 改修)
  question: 改修を preview 先行 / prod 直行 のどちらに出すか
  options: [preview 先行, 本番 prod 直行, timer fix だけ先に prod]
  recommended: preview 先行
  chosen: 本番 prod 直行
  chosen_type: explicit-choice
  context: live 化済 PJ。timer fix=低リスク、Google ログイン動線=要 OAuth 設定。seiji が prod 直行を選択。

- id: D20260610-025
  timestamp: 2026-06-10T00:00:00+09:00
  command: /flow:release
  phase: §3.3 Class B デプロイ確認 + §3.4 実行
  question: 本番デプロイ実行
  chosen: yes → deploy-prod.sh 実行 → Production READY (https://habit-stack.givers.work) + smoke green
  chosen_type: explicit-choice
  depends_on: [D20260610-024]
  context: 7 functions, --prebuilt --prod。smoke: frontend 200 / guest 200 / api 非 500。webhook 未変更で再検証不要。
```

metrics:
  wall_clock_minutes: ~10
  deploy_target: production
  deployed_url: https://habit-stack.givers.work
  check_result: smoke-green (frontend 200 / guest 200 / no 5xx)
  collected_vars: none (live 化済、env 既設定)
  pj_tags: [habit-tracker, pwa, clerk, stripe]
