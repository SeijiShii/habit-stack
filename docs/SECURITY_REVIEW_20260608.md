<!-- auto-generated-start -->
# 設計レベル脆弱性レビュー — habit-stack (プロダクト全体)

**レビュー日**: 2026-06-08
**レビュー実施者**: Claude (Opus 4.8) + seiji
**対象**: プロダクト全体（concept 設計）
**入力**: docs/concept.md (§1.1 / §1.3 / §3 / §4.3 / §5 / §6 / §9)
**観点ソース**: ~/.claude/flow-data/perspectives.md (O23-O28, O54)
**severity-threshold**: medium

## 1. PJ 性質判定
- 複数ユーザー（各自データ、行レベル分離）
- 公開
- 有償要素あり（tip-jar / Stripe 単発）
- 個人情報扱いあり（Clerk アカウント / Google 連携 / Stripe 決済）
- 外部 AI 利用なし
- 国内中心（越境は将来）

## 2. 脆弱性パターン照合結果

### 2.1 サマリ
- Critical: 0 件
- High: 5 件（§8 論点登録 + §3 NFR 要件化）
- Medium: 0 件
- Low: 0 件
- 法令必須: 1 件（O26、High 扱い・対応方針記載済み）
- O28 依存スキャン: skip（lockfile 未生成、コード未実装）
- O54 DSR 履行可能性: **対応済み**（§9.2 でゲスト時セルフサービス削除を必須化済み）

### 2.2 詳細（severity 降順）

#### [SEC-001] 認可漏れ / 行レベル owner-check (O23_authorization_check, severity=High)
- **照合結果**: 部分対応（concept §3 NFR に「行レベル owner-check（自分のデータのみ）」と記載、ただし全 API × リソースの認可マトリクスは feature 設計で詳細化予定）
- **PJ 性質との関連**: require=複数ユーザー（各ユーザーが自分の活動セット/実行記録のみ参照可）
- **推奨対策**: 全 API endpoint で `ownerId = auth.userId()` を強制する owner resolver（`withOwner`/`requireOwner`）を `_shared/auth` に実装。Drizzle クエリは必ず user_id で絞る。匿名ゲストの local_id ↔ 認証後 user_id 統合時の所有権移譲も設計。
- **route**: accepted-as-requirement（§3.X へ要件化、feature 設計で `/flow:secure --scope=feature` 再照合）

#### [SEC-002] 入力検証 (O24_input_validation, severity=High)
- **照合結果**: 部分対応（§3 NFR に「入力検証（Zod）」記載）
- **PJ 性質との関連**: require=公開
- **推奨対策**: 全 API 入力を Zod スキーマで検証。同期ペイロード（execution_record の note 等）は文字長制限 + XSS（note 表示時のエスケープ）。CSV エクスポート（撤退時データ持ち出し）は `=+-@` 始まりをエスケープ。
- **route**: accepted-as-requirement

#### [SEC-003] 秘密情報管理 / クライアント露出 (O25_secrets_management, severity=High)
- **照合結果**: 部分対応（§4.5.3 で秘密情報一覧 + `.gitignore` 設定済み。`.env.example` は未作成、PREREQUISITES §10 で計画済み）
- **PJ 性質との関連**: require=公開
- **推奨対策**: `CLERK_SECRET_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `DATABASE_URL` / server `SENTRY_DSN` は **VITE_ プレフィックスを付けない**（クライアントバンドル露出防止）。publishable key のみ `VITE_*`。ビルド成果物の grep チェックを CI に組み込み。`.env.example` を作成。
- **route**: accepted-as-requirement

#### [SEC-004] 個人情報のログ漏洩 (O26_pii_logging, severity=High, legal_required)
- **照合結果**: 部分対応（§3 NFR「Sentry の PII scrub」+ §6 feedback「PII scrub」記載）
- **PJ 性質との関連**: require=公開 + 個人情報扱い（個人情報保護法）
- **推奨対策**: Sentry `beforeSend` でメール/Google プロフィール/決済情報をマスク。feedback 自動コンテキスト送信前に PII scrub（O40/§3 NFR と整合）。エラーメッセージに DB 内容/トークンを含めない。Vercel Web Analytics は cookieless で匿名 ID のみ。
- **route**: accepted-as-requirement（legal_required のため除外不可）

#### [SEC-005] レート制限 / Stripe webhook 署名検証 (O27_rate_limit_scope, severity=High)
- **照合結果**: 未対応（§3 NFR にレート制限の明示なし。PREREQUISITES §9 で Turnstile を候補列挙のみ）
- **PJ 性質との関連**: require=公開（Stripe webhook `/api/stripe-webhook`・feedback `/api/feedback`・tip 開始が公開/半公開エンドポイント）
- **推奨対策**: (1) **Stripe webhook は署名検証必須**（`STRIPE_WEBHOOK_SECRET` で raw body 検証、time-budget 知見流用）。(2) feedback / tip 開始エンドポイントに IP/ユーザー単位レート制限（Vercel Edge / Upstash Ratelimit）+ Turnstile（不正送信抑止）。(3) 同期エンドポイントは認証必須化でスコープ最小化。
- **route**: accepted-as-requirement

## 3. §8 未決事項に登録した論点

| 論点 ID | severity | title | status |
|---|---|---|---|
| [論点-004] | High | [SEC-001] 認可漏れ/owner-check | accepted-as-requirement |
| [論点-005] | High | [SEC-002] 入力検証(Zod) | accepted-as-requirement |
| [論点-006] | High | [SEC-003] 秘密情報管理(VITE_露出) | accepted-as-requirement |
| [論点-007] | High | [SEC-004] PII ログ漏洩(Sentry beforeSend) | accepted-as-requirement |
| [論点-008] | High | [SEC-005] レート制限/webhook 署名検証 | accepted-as-requirement |

## 4. 次のステップ
- High 論点は §3.X NFR に要件化済み（accepted-as-requirement）。feature 設計時に `/flow:secure --scope=feature_<target>` で再照合し dispatched-to-feature へ遷移
- O54 DSR は §9.2 で対応済み（ゲスト=セルフサービス削除）
- L2 実装前チェックリストは feature 設計後 `/flow:secure --phase=pre-impl`
- L4 依存スキャンは実装着手後 `/flow:secure --phase=deps`（lockfile 生成後）
- 実装後に Anthropic `security-review` スキルで L3 確認
<!-- auto-generated-end -->
