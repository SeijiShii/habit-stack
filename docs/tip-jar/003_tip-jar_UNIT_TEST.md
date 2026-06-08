# tip-jar 単体テスト計画

> **入力**: `./001_tip-jar_SPEC.md`, `./002_tip-jar_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧
### 1.1 正常系
| ID | 対象 | 期待 |
|---|---|---|
| N1 | stripe-webhook | 有効署名で 200 + tip 記録 |
| N2 | tip/checkout | 認証済みで Checkout URL 返す |
| N3 | TipJarButton | 金額「100円」を CTA に明示（O43） |
| N4 | TipFlow | 匿名 → Google リンク誘導 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | stripe-webhook | 署名不正/欠如 | 400（SEC-005） |
| E2 | stripe-webhook | 重複 session_id | 冪等（二重記録なし） |
| E3 | tip/checkout | 未認証 | 401 → Google リンク誘導 |
| E4 | webhook | raw body 改変 | 署名不一致で 400 |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | 金額 | 固定 100 円 | 変更不可 |
| B2 | キャンセル | Checkout 離脱 | 副作用なし |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| Stripe SDK | injectable mock | 実課金なし（O35） |
| webhook 署名 | テスト用 secret で署名生成 | 検証分岐 |
| auth | mock owner | — |
| db | mock | 冪等記録 |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 85%（決済は慎重に） |
| 分岐 | 80%（署名/冪等/未認証） |

## 4. 既存ユーティリティ依存
- _shared/auth, _shared/db, _shared/legal。

## 5. テスト実行環境
- Vitest + Stripe mock + 署名生成ヘルパ。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
