# tip-jar 実装計画書

> **入力**: `./001_tip-jar_SPEC.md`, charter §1.7、SEC-005
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧（src/features/tip-jar/）

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `TipJarButton.tsx` | 非ブロッキング応援ボタン（金額明示 O43、自作 SVG ハート） | design, auth | 80 |
| `TipFlow.tsx` | Google リンク誘導 → Checkout 起動 → お礼 | auth, design | 90 |
| `api/tip/checkout.ts` | Stripe Checkout 作成（withOwner、固定 100 円） | stripe, auth | 70 |
| `api/stripe-webhook.ts` | 署名検証 + 投げ銭記録（冪等） | stripe, db | 90 |
| `model/tipsRepo.ts` | tip 記録（任意、累計参考） | db | 40 |

## 2. 実装 Phase 分割（injectable Stripe、O35）

### Phase 1: api/stripe-webhook（署名検証、SEC-005）
- **raw body + STRIPE_WEBHOOK_SECRET で署名検証**（time-budget 知見流用）。冪等（session_id）。
- テスト: 署名正/不正、重複イベント冪等。**raw body 検証の単体テスト**（vercel-fn-config の bodyParser 無効化含む）。
### Phase 2: api/tip/checkout（withOwner）
- 認証必須、固定 100 円 Checkout 作成。テスト: 未認証 401、認証で URL。
### Phase 3: TipJarButton + TipFlow（UI）
- 金額を CTA 前に明示（O43）、非ブロッキング。匿名は Google リンク誘導。自作 SVG ハート（絵文字でない）。
### Phase 3.5: app bootstrap
- `stripe` SDK install、`.env.example` に Stripe キー追記（VITE_ は publishable のみ、SEC-003）。

## 3. 依存関係順序
```
stripe-webhook(署名) → tip/checkout(withOwner) → tipsRepo → TipJarButton/TipFlow
依存: _shared/auth(linkWithGoogle), _shared/legal(規約表示), _shared/db, Stripe, design-system
```

## 4. 既存ファイルへの影響
- streak-summary が満足ピークに TipJarButton 配置。
- vercel-fn-config: webhook の bodyParser 無効化（raw body）。

## 5. 横断フォルダへの追加・変更
- _shared/db: 任意 tips テーブル（累計参考）。

## 6. リスク・注意点
- **SEC-005 webhook 署名検証必須**（raw body）。Vercel Functions の body パース設定に注意。
- Stripe secret は server side のみ（SEC-003、VITE_ 禁止）。
- 実課金は Class B-4（/flow:release で本人確認、test→live）。
- O43: 金額を後出しにしない（CTA 前明示）。

## 7. 完了の定義
- [ ] webhook 署名検証 + 冪等 green（SEC-005）
- [ ] checkout withOwner（未認証誘導）
- [ ] UI 非ブロッキング + 金額 CTA 前明示（O43 視覚レビュー）
- [ ] 実 Stripe 統合（Phase 3.5、live は /flow:release）
- [ ] E2E（004）：応援ボタン→（mock）→お礼

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
