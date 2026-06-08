# _shared/db 単体テスト計画

> **入力**: `./001__shared_db_SPEC.md`, `./002__shared_db_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧

### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| N1 | schema enum | time_of_day | 4 値（morning/noon/evening/night）を持つ |
| N2 | schema enum | session_status | 3 値（running/paused/done） |
| N3 | 型推論 | activity_sets `$inferInsert` | owner_id/name/time_of_day が必須、id/sort_order/timestamps は任意 |
| N4 | 型推論 | execution_records `$inferSelect` | elapsed_sec/paused_total_sec が number、note が string|null |
| N5 | client 初期化 | DATABASE_URL（モック文字列） | drizzle インスタンスを返す（例外なし） |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | client 初期化 | DATABASE_URL 未設定 | 明示エラー（「DATABASE_URL が必要」） |
| E2 | schema | 不正 enum 値 | 型レベルで弾く（コンパイルエラー、テストは型テストで担保） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | unique 制約定義 | (owner_id, client_local_id) | execution_sessions / execution_records に定義あり |
| B2 | index 定義 | (owner_id, set_id, date) | daily_achievements に unique 定義あり |
| B3 | index 定義 | owner_id | 全テーブルに owner_id index あり（SEC-001 性能） |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| Neon 接続 | モック（実接続しない） | 単体は実 DB 不要、結合/ローカルで実 Neon dev ブランチ |
| DATABASE_URL | テスト用ダミー文字列注入 | 再現性 |
| 時刻 | 固定値注入（vi.useFakeTimers） | timestamp 検証の再現性 |

## 3. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | concept 継承 |
| 分岐 | 70% | concept 継承 |

> スキーマ定義中心のため、実質は「型テスト + 制約/index 定義の存在 assert + client 初期化分岐」。

## 4. 既存ユーティリティ依存
- なし（基盤）。

## 5. テスト実行環境
- フレームワーク: Vitest（concept §4.3 系、テストツール未確定だが Vite と親和の Vitest を想定）
- 型テスト: `vitest` + `expectTypeOf` or `tsd`
- 実行コマンド（例示）: テストツールを実行する

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
