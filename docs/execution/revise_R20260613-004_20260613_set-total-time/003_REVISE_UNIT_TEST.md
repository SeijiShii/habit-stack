# execution 単体テスト計画（セット全体の経過時間を計時画面に表示）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, `model/elapsed.test.ts`, `ExecutionPage.test.tsx`
> **最終更新**: 2026-06-13

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U1 | `sessionElapsedSec` | 終了済み record 2 本（120s, 180s）+ 進行中なし | 300 |
| U2 | `sessionElapsedSec` | 終了済み 1 本（120s）+ 進行中（running, 開始から 30s）| 150（確定 + live） |
| U3 | `sessionElapsedSec` | 進行中が paused | 進行中分は pause 時点で凍結された値で合算 |
| U4 | `ExecutionPage` | running 状態で描画 | `set-elapsed` 要素が存在し、合計時間が表示される |
| U5 | `ExecutionPage` | tick 進行（now を進める） | `set-elapsed` がライブ更新される |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U6 | `sessionElapsedSec` | 端末時計巻き戻し（now < startedAt） | 該当 record は 0 クランプ、合計が負にならない |
| U7 | `sessionElapsedSec` | 1 record が 4H 超 | 当該 record は 4H で上限クランプして合算（`cappedElapsedSec` 流用） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U8 | `sessionElapsedSec` | record 0 本 / 開始直後 0s | 0 を返す |
| U9 | `ExecutionPage` | `done` 状態 | `set-elapsed` を表示しない（計時中セクション非表示） |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| （なし） | — | — | — | 既存表示は不変、追加のみ |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| （なし） | — | — |

## 4. リグレッション強化
- 進行中アイテムの `elapsed`（mm:ss）表示・開始/現在時刻表示は不変であることを確認。
- executionMachine の遷移（start/next/pause/resume/end）と確定 `elapsedSec` 保存は不変。
- ハートビート保存・15 秒 backend flush（R20260611-001）に影響しないことを確認。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| `now` 注入 | 既存（テスト用 now） | 流用（合計の live 算出を決定的にするため固定 now を注入） | 既存パターン踏襲 |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承（クランプ分岐を含む） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-13 | 初版作成 | /flow:revise |
