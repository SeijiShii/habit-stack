# _shared/types 単体テスト計画

> **入力**: `./001__shared_types_SPEC.md`, `./002__shared_types_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧

### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| N1 | TimeOfDay const | — | ['morning','noon','evening','night'] を持つ |
| N2 | SessionStatus const | — | ['running','paused','done'] |
| N3 | 型テスト | ActivitySet | db schema $inferSelect と一致 |
| N4 | 型テスト | SyncEnvelope<ActivitySet> | entity/op/payload/client_local_id/updated_at を持つ |
| N5 | ContinuationRate | {achievedDays,totalDays,rate} | rate は number |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | 型テスト | OwnerId に素 string 代入 | branded のためキャストなしは型エラー（型テストで担保） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | SyncEnvelope op | 'upsert'/'delete' のみ | それ以外は型エラー |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| なし | — | 純粋型、ランタイム依存なし |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 該当なし（型中心）。const 値の検証 100% |
| 型テスト | 主要型を expectTypeOf でカバー |

## 4. 既存ユーティリティ依存
- _shared/db の型 export。

## 5. テスト実行環境
- Vitest + expectTypeOf（型テスト）。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
