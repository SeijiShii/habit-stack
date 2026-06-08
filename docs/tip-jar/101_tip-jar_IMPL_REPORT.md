# 実装レポート: tip-jar

## 実装日時
2026-06-08 19:24 (JST)

## モード
feature

## 関連ドキュメント
- 001-004 + 905 + [AI_LOG](../AI_LOG/D20260608_027_tdd_tip-jar.md)

## 変更一覧
- `api/tip/webhook.ts`: Stripe webhook（**raw body + 署名検証必須 SEC-005**、injectable verifier）+ checkout.session.completed で投げ銭記録（冪等）。makeStripeVerifier（実 Stripe SDK）。
- `api/tip/checkout.ts`: 投げ銭 Checkout 作成（withOwner、固定 100 円、injectable creator）。匿名は 401。
- `TipJarButton.tsx`: 非ブロッキング応援ボタン（**金額を CTA に明示 O43**、自作 SVG ハート、匿名→Google リンク誘導）。

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 追加 | stripe SDK 導入 |
| 後続 | 実 Stripe Checkout/Webhook の実キー疎通（/flow:release、実課金=Class B-4）。tips テーブル記録（任意、累計参考）。レート制限は app-shell 配線 |
| 問題と対処 | injectable verifier/creator で実課金なしに署名検証・401 を単体検証（O35） |

## PR Description
### タイトル
tip-jar: Stripe 単発投げ銭（webhook 署名 SEC-005 / O43 価格透明性）
### 概要
満足ピークの非ブロッキング 100 円応援。webhook raw body 署名検証、匿名→Google リンク、金額 CTA 前明示。
### テスト
7 テスト（webhook 3 / checkout 2 / button 2）。累計 110/110 green、typecheck green。
