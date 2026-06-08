# feedback 単体テスト計画

> **入力**: `./001_feedback_SPEC.md`, `./002_feedback_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧
### 1.1 正常系
| ID | 対象 | 期待 |
|---|---|---|
| N1 | piiScrub | メール → マスク |
| N2 | piiScrub | 位置/電話 → 除去 |
| N3 | feedbackClient | context 付与 → scrub → 送信 |
| N4 | api/feedback | hub endpoint へ中継 + 通知 |
| N5 | widget | リアクション選択 + 送信 → 「ありがとう」 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | feedbackClient | hub 送信失敗 | 再送キュー保持 |
| E2 | api/feedback | env 未設定（hub なし） | degrade（運用者通知のみ or ローカル） |
| E3 | api/feedback | スパム連投 | レート制限（O27） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | message | 1001 文字 | 切り詰め |
| B2 | PII | 本文に複数メール | 全てマスク |
| B3 | 匿名送信 | owner なし | 送信可 |

## 2. Mock 方針
| 対象 | 方針 |
|---|---|
| hub fetch | mock |
| auth | mock（owner 任意） |
| 通知チャンネル | mock |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 80% |
| PII scrub | パターン 100%（SEC-004 法令） |

## 4. 既存ユーティリティ依存
- _shared/auth。

## 5. テスト実行環境
- Vitest + Testing Library + fetch mock。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
