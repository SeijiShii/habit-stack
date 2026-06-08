# tip-jar 機能仕様書

> **役割**: 満足ピーク（継続サマリ閲覧時・連続更新時）で非ブロッキングに「💛 100円で作者を応援」ワンタップ投げ銭。Stripe 単発決済。射幸心・罪悪感を煽らない「いいね型」。
> **タグ**: auth-required（課金時 Google リンク必須）, analytics
> **最終更新**: 2026-06-08
> **入力**: `../concept.md` §1.1 UC7 / §6 / §9.4、charter §1.7（tip-jar-fallback）、SEC-005（webhook 署名）、O43（価格透明性）
> **収益**: monetization_hint=tip-jar-fallback。完全無料 + 100 円ワンタップ。

---

## 1. 詳細 UC

### UC7: 作者を応援（concept §1.1 #7、charter §1.7）
- トリガー: サマリ画面等の満足ピークに**非ブロッキング**な応援ボタン（常設だが控えめ、押さなくても全機能使える）。
- フロー:
  1. 「100円で作者を応援」（**金額を CTA 前に明示**、O43）。
  2. 未認証/匿名 → **Google リンクを促す**（課金は本人特定が必要、concept §1.1 UC8/§4.6）。
  3. Stripe Checkout（単発 100 円）。
  4. 決済完了 → Stripe webhook（署名検証）で記録 → 「ありがとうございます」控えめ表示。
- **射幸心・罪悪感を煽らない**: ガチャ/限定特典/回数煽りなし（charter §2.2/§4.8.2.5）。お礼は控えめ。広告非表示等の見返りは作らない（純粋な応援）。

## 2. 入出力
### 2.1 API
| メソッド | パス | 入力 | 出力 | 認証 |
|---|---|---|---|---|
| POST | /api/tip/checkout | （なし、固定 100 円） | Stripe Checkout URL | withOwner（認証必須） |
| POST | /api/stripe-webhook | Stripe event（raw body） | 200 | 署名検証（SEC-005） |

### 2.2 副作用
- Stripe Checkout セッション作成、決済、webhook で投げ銭記録（累計参考）。

## 3. データモデル
- 軽量な tip 記録（owner_id, amount, stripe_session_id, created_at）。MVP は最小（収益指標は参考、§4.6.4 商用でないため簡素）。新規テーブル `tips` を _shared/db に追加検討 or Stripe ダッシュボード参照のみ。

## 4. バリデーション + エラーケース
| ID | 条件 | 振る舞い |
|---|---|---|
| E1 | 未認証で checkout | Google リンクを促す（401→誘導） |
| E2 | webhook 署名不正 | 400（SEC-005、raw body + STRIPE_WEBHOOK_SECRET 検証） |
| E3 | 決済キャンセル | 通常画面に戻る、何も起きない |
| E4 | webhook 重複 | stripe_session_id で冪等 |

## 5. 機能固有 NFR + 連携
### 5.1 NFR
| 項目 | 目標 |
|---|---|
| 非ブロッキング | 応援を促しても全機能は無料で使える（charter §1.7） |
| 価格透明性 | 金額 + 対価（応援）を CTA 前に明示（O43） |
### 5.2 連携
| 連携先 | 内容 |
|---|---|
| _shared/auth | linkWithGoogle（課金前必須） |
| _shared/legal | 決済前に規約/特商法表示 |
| streak-summary | 満足ピークに応援導線 |
| Stripe | Checkout + Webhook |
| design-system | TipJarButton（自作 SVG ハート、絵文字でない） |

## 6. タグ別追加項目
### 6.1 認可（auth-required）
- checkout は withOwner（認証必須）。匿名は Google リンクへ誘導。
### 6.6 analytics
- tip_prompt_shown / tip_completed イベント（PII なし）。

## 7. スコープ外
- サブスク/継続課金（charter §1.7、単発のみ）
- 金額選択（固定 100 円、いいね型）
- 見返り/特典（純粋応援、charter §2.2）

## 8. 未決事項
- 特商法の販売者情報（_shared/legal §8 と共通、事業形態確定後）。tip 記録テーブルの要否は実装時（推奨: 軽量 tips テーブルで累計参考、Stripe を正本）。

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
