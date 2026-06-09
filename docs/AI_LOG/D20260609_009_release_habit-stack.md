# D20260609_009 /flow:release habit-stack

状態: 進行中（残=実機 B-4 スモークのみ、人間手番）
metrics: { command: flow:release, phase: post-deploy-smoke }

## §1.0 live 化判定
- ① `.env.production.local` 実 read: `CLERK_SECRET_KEY=sk_live_*` / `STRIPE_SECRET_KEY=sk_live_*` / `STRIPE_WEBHOOK_SECRET=whsec_*` 検出 → **live 化済**
- → test→live swap skip。残作業 = (a) 未記入キー FILL / (b) 未デプロイ commit 再デプロイ / Phase2 軽めスモーク

## (a) 未記入キー点検 → FILL 不要
- VITE_STRIPE_PUBLISHABLE_KEY 空: server redirect 型 checkout で client 未参照（#3c）= 不要
- VITE_SENTRY_DSN / SENTRY_DSN 空: 任意（未配線）= skip 可
- HUB_FEEDBACK_ENDPOINT 空: feedback-hub 論点-003/010 open = 未配線
- → 必須キーは全充足。FILL 作業なし

## (b) 未デプロイ commit 点検 → 再デプロイ不要（HEAD = live を実証）
- working tree clean。HEAD のローカル build asset hash が live と完全一致:
  - CSS `index-DIsSz_IC.css` == live ✅ / JS `index-Db40-rXo.js` == live ✅（content-hash 一致 = 同一ソース）
- 14:18 deploy 後の commit（design 適用 00dddf5 / header fix 94872e4 / O31 ShareButton 1d326d5 / wording 24527d5）は全て live に反映済
  - live CSS に `btn-primary`/`header{` 確認、live index JS に wording 校正文字列 5/5 確認
  - ShareButton(navigator.share) は SummaryPage 別チャンク（index JS 不在は code-split による正常）
- ※ SCENARIO §5 cursor「最終更新 14:18」は stale。実体は HEAD まで deploy 済

## webhook raw-body 監査（CF-20260607-001 / 決済 PJ §3.4#3.6）
- api/tip/webhook.ts: Web 標準ハンドラ `req.text()` で raw body 取得 → `stripe.webhooks.constructEvent` 署名検証（SEC-005）。
  vercel-build.mjs の Node↔Web adapter が生 Buffer を Web Request に渡すため raw バイト保持 = 正。`shouldAddHelpers` 不使用（custom launcher）= body 事前パース問題なし
- recordTip は**意図的 no-op**（MVP: Stripe Dashboard を正本、tips テーブルは将来）→ post-deploy 検証は「webhook 200 + Stripe Dashboard に課金計上」（DB 行チェックは非該当）
- live endpoint probe: POST /api/tip/webhook（無署名）→ 400 invalid_signature = 関数 live + 署名検証稼働 ✅

## live 健全性 probe
- / 200 / index CSS 8.5kB(styled) / api/health 200 / api/auth/guest 200(ticket) / api/tip/webhook 400(無署名=正)

## 残（人間手番、Class B-4）
- 実機ブラウザで正常系 1 周（ログイン/主要 happy path/レイアウト）
- Stripe Dashboard「テストイベント送信」で /api/tip/webhook 200
- 実 100 円 live tip（B-4、まとめ確認）→ Checkout 完了 + Stripe Dashboard 計上
