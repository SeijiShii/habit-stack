# _shared/legal 単体テスト計画

> **入力**: `./001__shared_legal_SPEC.md`, `./002__shared_legal_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧

### 1.1 正常系
| ID | 対象 | 期待 |
|---|---|---|
| N1 | PrivacyPage | 取得項目/利用目的/第三者提供(Clerk/Stripe/Sentry/Vercel)/保管期間を含む |
| N2 | PrivacyPage | **O54 ゲスト削除文言**（運営側で特定不能/アプリ内セルフサービス削除）を含む |
| N3 | TermsPage | 免責/知財/解約/準拠法(日本)/管轄 を含む |
| N4 | SctPage | 投げ銭=返金なしの応援の旨/連絡先/「請求あれば開示」を含む |
| N5 | LegalFooter | /legal/privacy, /legal/terms, /legal/specified-commercial-transactions の 3 リンク |
| N6 | consent | 同意でタイムスタンプ保存 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | 課金導線 | 規約未同意 | ブロック |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | O55 到達性 | 各 legal route | フッタ inbound link あり |

## 2. Mock 方針
| 対象 | 方針 |
|---|---|
| auth(consent) | mock |
| 時刻 | 固定値 |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 80% |
| text assert | 必須法務項目 100% |

## 4. 既存ユーティリティ依存
- _shared/auth（consent）。

## 5. テスト実行環境
- Vitest + Testing Library（text assert）。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
