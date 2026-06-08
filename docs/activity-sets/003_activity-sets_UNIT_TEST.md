# activity-sets 単体テスト計画

> **入力**: `./001_activity-sets_SPEC.md`, `./002_activity-sets_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧
### 1.1 正常系
| ID | 対象 | 期待 |
|---|---|---|
| N1 | setsRepo.createSet | local-sync.put 呼び出し、client_local_id 付与 |
| N2 | setsRepo.updateSet | updated_at 更新 |
| N3 | setsRepo.deleteSet | softDelete + 配下アイテム softDelete |
| N4 | reorder | sort_order 連番振り直し |
| N5 | useSets | owner のセットを time_of_day でグループ化 |
| N6 | item CRUD | create/update/delete(soft) |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | createSet | name 空 | Zod エラー（SEC-002） |
| E2 | createSet | name 61 文字 | Zod エラー |
| E3 | time_of_day | 不正値 | Zod エラー |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | name | 1 文字 / 60 文字 | OK |
| B2 | reorder | 1 件のみ | エラーなし |
| B3 | オフライン | online=false | ローカル成功 |

## 2. Mock 方針
| 対象 | 方針 |
|---|---|
| local-sync | mock（put/softDelete 検証） |
| auth(useOwner) | mock owner |
| TanStack Query | テスト用 QueryClient |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 80% |
| 分岐 | 70% |

## 4. 既存ユーティリティ依存
- _shared/local-sync, _shared/auth, _shared/types。

## 5. テスト実行環境
- Vitest + Testing Library + fake-indexeddb（local-sync 経由）。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
