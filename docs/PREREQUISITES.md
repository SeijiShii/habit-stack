# 実装前準備チェックリスト

**最終更新**: 2026-06-08 16:10
**集約元**: §4.3 リソース選定 / §6 外部連携 / §9 法務 / §4.5 ローカル開発 / §4.4 コスト / charter / perspectives O12 / O22 / O25 / O27
**生成元**: /flow:concept

> 開発運用者向け実装前準備チェックリスト。状態列は `<!-- user-edit -->` 区間で手動更新可。

<!-- auto-generated-start -->

## 1. 外部 API キー (環境変数 `.env.local`)

| サービス | 環境変数名 | 用途 | 取得 URL | プラン / 無料枠 |
|---|---|---|---|---|
| Clerk | `VITE_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | 認証（匿名ゲスト + Google リンク） | clerk.com | Free 10k MAU |
| Neon | `DATABASE_URL` | Postgres | neon.tech | Free 0.5GB |
| Stripe | `STRIPE_SECRET_KEY` / `VITE_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | 投げ銭（単発） | dashboard.stripe.com | 従量手数料のみ |
| Sentry | `SENTRY_DSN`（server）/ `VITE_SENTRY_DSN`（client） | エラー監視 | sentry.io | Free 5k events/月 |
| feedback-hub | `HUB_FEEDBACK_ENDPOINT` / `HUB_SERVICE_INFO_SECRET` | フィードバック集約（O40） | service-hub 中央発番 | [論点-003] |

## 2. BaaS / インフラアカウント (§4.3、charter §0 = Neon スタック)

| サービス | 用途 | 取得 URL | プラン | 制限 |
|---|---|---|---|---|
| Neon | DB（本サービス専用 DB） | neon.tech | Free | 0.5 GB × 10 DB |
| Vercel | ホスティング + Functions | vercel.com | Hobby | 100 GB 帯域 |
| Clerk | Auth | clerk.com | Free | 10,000 MAU |

> Cloudflare R2（Storage）は本 PJ では不要（画像/ファイル保存なし）。

## 3. ドメイン (公開 PJ、§4.7、O29)

### 3.1 既存ドメインの活用 (推奨)
| 項目 | 内容 |
|---|---|
| 既存ドメイン | 保有ドメイン（例: `givers.work`）を想定 [論点-002] |
| 本サービスの URL | `habit-stack.<domain>`（サブドメ、撤退時 DNS 1 行削除）|
| 検証段階 | `<project>.vercel.app` で開始 |

## 4. 認証プロバイダ設定 (O05 / O22)

| 項目 | 取得方法 | 必要性 | 備考 |
|---|---|---|---|
| Clerk App 作成 | clerk.com → New Application | charter §0 Auth | Publishable / Secret Key を .env.local に |
| ゲスト認証 (O22) | Clerk: Anonymous sign-in 有効化 | 気軽な PWA で必須 | 初回 0 タップ実行 |
| Google OAuth | console.cloud.google.com → Credentials | デバイス間連携 / 課金時 | Clerk Social Provider に登録 |
| パスキー (v2 検討) | Clerk: Passkeys | MVP 外 | v2 で追加 |

## 5. 決済プロバイダ設定 (tip-jar)

| 項目 | 取得方法 | 必要性 | 備考 |
|---|---|---|---|
| Stripe アカウント本人確認 | dashboard.stripe.com → 設定 | tip-jar 公開時必須 | 個人事業主登記 |
| Stripe API キー (test / live) | dashboard.stripe.com/apikeys | 同上 | live は公開後 |
| Webhook エンドポイント登録 | dashboard.stripe.com/webhooks | 投げ銭完了検知 | 署名検証鍵を `.env.local` |

## 6. 法務書類準備 (§9)

| 書類 | 必要性 | 配置 URL | 作成方法 |
|---|---|---|---|
| プライバシーポリシー | 必須（個人情報扱い） | `/legal/privacy` | 自前ドラフト + 確認。ゲストはセルフサービス削除を明記（O12×O22） |
| 利用規約 | 必須 | `/legal/terms` | 同上 |
| 特定商取引法表記 | 必須（tip-jar = 国内有償） | `/legal/specified-commercial-transactions` | 投げ銭の性質明示 |
| Cookie 同意 | 不要 | — | Vercel Web Analytics は cookieless |

## 7. 監視・アナリティクス (O01 / O02)

| サービス | 用途 | 取得 URL | プラン |
|---|---|---|---|
| Sentry | エラー監視 | sentry.io | Free |
| Vercel Web Analytics | アナリティクス（cookieless） | vercel.com → Analytics | Hobby Free |

## 8. ローカル開発環境準備 (§4.5)

| 項目 | コマンド / 手順 |
|---|---|
| Node.js | nvm 等で LTS |
| Vercel CLI | `npm i -g vercel`（`vercel dev`） |
| Drizzle | `npm i drizzle-orm drizzle-kit` |
| `.env.example` 作成 | §1, §4, §5, §7 のキー名をダミー値で列挙 |
| `.env.local` 作成 | 実値入力、`.gitignore` 確認 |
| pre-commit hook | gitleaks / husky で秘密情報コミット防止 (O25) |

## 9. ボット対策 (O27、tip-jar / feedback フォームある時)

| サービス | 用途 | プラン |
|---|---|---|
| Cloudflare Turnstile | feedback / tip-jar の不正送信抑止 | Free 1M req/月（必要時） |

## 10. コスト試算 (§4.4)

- **初期コスト**: $0
- **月額目安**: $0（全無料枠 + Stripe 従量手数料のみ）
- **無料枠超過アラート**: §4.6.2 自前コストログ + 80/100/120% アラート

## 11. 実装着手前 最終チェックリスト

- [ ] §1-§7 の必須キー取得済み
- [ ] `.env.example` 作成、必須キー定義
- [ ] `.gitignore` に `.env*.local` / `.env` 追加 (O25)
- [ ] 法務書類ドラフト作成（公開前確認用、ゲスト削除セルフサービス明記）
- [ ] `~/.claude/flow-data/preferences.md` にベンダー記録
- [ ] `/flow:secure --phase=design` 実施（Critical/High なし）
- [ ] CI に `npm audit` / Dependabot 組み込み

<!-- auto-generated-end -->

<!-- user-edit-start -->

## ユーザー手動メモ（取得状況）

| 項目 | 状態 | 取得日 / 備考 |
|---|---|---|
| Clerk App | ❌ | |
| Neon プロジェクト | ❌ | |
| Stripe アカウント | ❌ | |
| Sentry プロジェクト | ❌ | |
| ドメイン確定 [論点-002] | ❌ | |

<!-- user-edit-end -->
