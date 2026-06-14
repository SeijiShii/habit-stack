# execution 単体テスト計画（計時中セッションの可視化と導線確立）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, `ExecutionPage.test.tsx`, `SetListPage.test.tsx`, `useExecution.test.ts`
> **最終更新**: 2026-06-14

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U1 | `SetListPage` | `inProgressSetId = "set-A"` で `set-A` を含むリストを描画 | `set-A` 行に「進行中」バッジ（`data-testid="in-progress-badge"`）が表示される |
| U2 | `SetListPage` | `inProgressSetId = "set-A"`、`set-A` 行を選択 | `onOpenSet("set-A")` が呼ばれる（呼び出し側で `/run/:id` 分岐） |
| U3 | `SetListPage` | `inProgressSetId = "set-A"`、進行中でない `set-B` 行を選択 | `onOpenSet("set-B")` が呼ばれる（呼び出し側で `/sets/:id` 分岐） |
| U4 | `ExecutionPage` | 進行中なし（restore で found なし）で `/run/set-A` 描画 → settle 完了 | 当該セットが auto-start され、計時中セクション（`current-item` 等）が出る（中間「開始」ボタンは出ない） |
| U5 | `ExecutionPage` | 同セット（set-A）が進行中で `/run/set-A` 描画 → settle | 復元された state で再開（破棄されない・新規 start されない） |
| U6 | `useExecution` | 復元 async 完了（found あり/なし両方） | `settled === true` になり、`inProgressSetId` が found の setId（無ければ null）になる |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U7 | `ExecutionPage` | 別セット（set-B）が進行中の状態で `/run/set-A` を描画 | 二重開始しない。`set-A` の start が呼ばれず、復帰導線（`『set-B』が進行中です` + `/run/set-B` リンク）が表示される |
| U8 | `ExecutionPage` | StrictMode 二重マウント + 進行中なし | auto-start が 1 回だけ（重複 session を作らない。`appliedRef`/冪等 put） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U9 | `ExecutionPage` | settle 前（復元 async 未完了） | auto-start を発火せず、読み込み表示。settle 後に判定 |
| U10 | `SetListPage` | `inProgressSetId === undefined`（進行中なし） | どの行にもバッジを出さず、全行 `/sets/:id` 相当（従来挙動） |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| M1 | `ExecutionPage.test.tsx` 中間ゲート前提 | 「描画直後に『開始』ボタンが出て、押すと計時開始」 | 「settle 後に進行中なしなら auto-start され計時中セクションが出る（『開始』ボタンを介さない）」 | 中間ゲート撤去・auto-start 化 |
| M2 | `ExecutionPage.test.tsx` start 引数検証 | 「開始」ボタン click で `exec.start(setId, itemIds)` | auto-start で `exec.start(setId, itemIds)` が settle 後 1 回 | 起動契機の変更（click→auto） |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| D1 | 中間「開始」ボタンの存在のみを検証するテスト（あれば） | ボタン自体を撤去するため。M1/M2 の auto-start 検証へ統合 |

## 4. リグレッション強化
- 計時中の `current-item` / `elapsed` / `started-at` / `current-time` / `set-elapsed`（R20260613-004）表示は不変であること。
- 状態機械の遷移（start/next/pause/resume/end）と確定 `elapsedSec` 保存は不変。
- 進行中セッション復元（R20260611-001、`restoreInProgress` / `decideRecovery` / autoEnd）は不変。
- ハートビート保存・15 秒 backend flush・`LoginEndGuard`（`/account` で `endInProgressNow`）は不変。
- `findInProgress` の owner スコープ（`getAllByOwner`）が保たれ、他 owner の進行中をバッジ表示しない。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| `ExecutionRepo.restoreInProgress` / `findInProgress` | 既存 mock | found あり/なし/別セット の 3 パターンを注入し auto-start・復帰導線・再開を分岐検証 | 起動分岐の網羅 |
| `now` 注入 | 既存 | 流用（settle/auto-start の決定性確保） | 既存パターン踏襲 |
| `navigate`（react-router） | — | spy 化し `/run/:id` vs `/sets/:id` 分岐を検証 | 遷移先分岐の検証 |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承（settle/進行中有無/同セット・別セット分岐を含む） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版作成 | /flow:revise |
