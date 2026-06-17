# AI_LOG — /flow:release（C20260617-001 guest-auth fix 本番反映）

- **実行日時**: 2026-06-17（JST）
- **コマンド**: /flow:release（/flow:auto P4.7 Release gate から dispatch）
- **実行者**: seiji + Claude
- **状態**: 完了（本番デプロイ + post-deploy スモーク green）
- **metrics**: deploy_target=production / deployed_url=https://habit-stack.givers.work / check_result=smoke green (guest EP 200) / paid_confirmed=N/A（投げ銭経路は本 fix で変更なし）
- **含まれる decision 範囲**: live 判定 / 不足検出 / 本番直行判断 / secret FILL / デプロイ Class B / スモーク

## 主要決定サマリ

| decision_id | テーマ | chosen | type |
|---|---|---|---|
| D20260617-021 | live 化判定（§1.0） | ① .env.production.local CLERK/STRIPE_SECRET_KEY=sk_live 検出 → **live 化済**（test→live swap skip）。残作業 = GUEST_TOKEN_SECRET prod FILL + 再デプロイ | auto-recommended |
| D20260617-022 | 不足検出（§1.1） | **GUEST_TOKEN_SECRET が .env.production.local 不在**（C20260617-001 新規 var、server-side HMAC secret）。未設定だと prod guest EP 503 degrade。function count=8（Hobby 12 内）、deploy scaffold あり | auto-recommended |

## 依存関係
- depends_on: D20260617-020（release-pre full audit C0/H0）、D20260617-014（tdd 完了）

## 生成・更新したアーティファクト
- docs/AI_LOG/D20260617_009_release_habit-stack.md
- （Phase 進行に応じて追記）

## Decisions

```yaml
- id: D20260617-021
  timestamp: 2026-06-17T14:30:00+09:00
  question: live 化状態の判定（§1.0 SoT 順序）
  chosen: live 化済（test→live swap skip）
  chosen_type: auto-recommended
  context: ① .env.production.local の CLERK_SECRET_KEY=sk_live / STRIPE_SECRET_KEY=sk_live を prefix read で検出。公開 URL https://habit-stack.givers.work（Clerk prod / Neon prod / Stripe live）。残作業 = (a) GUEST_TOKEN_SECRET prod FILL → (b) 再デプロイ（§1.0 live 分岐 b、CF-20260610-002 で再デプロイ前に target 確認）。
- id: D20260617-022
  timestamp: 2026-06-17T14:30:30+09:00
  question: 不足検出（§1.1）
  chosen: GUEST_TOKEN_SECRET（.env.production.local 不在、deploy-target prod env も要設定）
  chosen_type: auto-recommended
  context: |
    C20260617-001 の guest 自前署名 JWT（HS256）の署名鍵。server-side のみ（VITE_ 露出なし）、外部 provider なし = openssl rand -hex 32 で生成可（生成=Class A、prod env への配置=Class C）。
    未設定時の挙動: api/auth/guest.ts は secret 不在で 503 "guest_unavailable" を返し、フロントは localStorage ローカルゲストに degrade（offline-critical なので白画面にはならないが、guest JWT 永続による owner churn 根治が prod で効かない）。
    → デプロイ前に prod env (Vercel production) へ設定必須。function count=8（Hobby 12 内、CF-20260529-015 トラップなし）。deploy-prod.sh/sync-prod-env.sh/vercel-build.mjs 完備。
- id: D20260617-023
  timestamp: 2026-06-17T14:33:00+09:00
  question: §1.0c case ii デプロイ方式（preview 先行 vs 本番直行）
  chosen: 本番 prod 直行（seiji 選択）
  chosen_type: explicit-choice
  context: auth+データ系改修だが 272 unit（owner-churn 回帰含む）+ full audit C0/H0 + secure L1 C0/H0 で十分カバー、habit-stack は従来 prod-direct（Build Output API CLI deploy）。推奨は preview 先行だったが seiji が本番直行を選択。
- id: D20260617-024
  timestamp: 2026-06-17T14:34:00+09:00
  question: GUEST_TOKEN_SECRET 生成 + Class B 本番デプロイ実行
  chosen: openssl rand -hex 32 で生成 → .env.production.local 配置（値非表示、gitignored 確認）→ bash scripts/deploy-prod.sh で本番デプロイ（Class B 明示承認済）
  chosen_type: explicit-choice
  context: |
    GUEST_TOKEN_SECRET=64hex 生成・配置。deploy-prod.sh 監査済（sync-prod-env→vercel-build→関数数ガード→deploy --prebuilt --prod）。
    §3.3 Class B 確認 = seiji「デプロイ実行」承認。
    デプロイ結果: READY、aliased https://habit-stack.givers.work（dpl_2zHMF2E3kxfhGz82uyXJq8rGxiAd）。
- id: D20260617-025
  timestamp: 2026-06-17T14:36:00+09:00
  question: post-deploy スモーク（§3.4）
  chosen: 全 green
  chosen_type: auto-recommended
  context: |
    GET / =200 / GET /api/health =200 / POST /api/auth/guest =200（secret 設定前は 503、新 GUEST_TOKEN_SECRET で発行成功）/ GET /api/sync/pull =401（未認証ゲート、O22 #4 PASS）。
    guest token = iss=habit-stack-guest / sub=guest_* / exp あり = 新自前署名 JWT 機構が本番稼働を確認。owner churn 根治が prod で有効化。
    残（Class C、本 fix と独立）: 実機スマホでの reload-persistence 目視確認 + 既存残の 100円 live tip B-4。
```
