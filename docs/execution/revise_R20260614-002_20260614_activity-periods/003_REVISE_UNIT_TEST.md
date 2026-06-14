# execution 単体テスト計画（活動を 1:N period モデルにして中断時間を経過から除外）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, `model/executionMachine.test.ts`, `model/elapsed.test.ts`, `ExecutionPage.test.tsx`, `model/executionRepo.test.ts`
> **origin**: claim C20260614-001
> **最終更新**: 2026-06-14

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U1 | `executionMachine`（**trailing-pause 除外**） | start(08:00) → pause(08:01) → **再開せず** nextItem(08:03) | i1 の `elapsedSec=60`（中断 08:01→08:03 は除外）。periods=`[{08:00,08:01}]`（開いた period 無し） |
| U2 | `executionMachine`（**trailing-pause + endSession**） | start(08:00) → pause(08:01) → endSession(08:05) | i1 の `elapsedSec=60`、中断分（08:01→08:05）は経過に入らない |
| U3 | `executionMachine`（多重 pause/resume） | start(08:00) → pause(08:01) → resumeSame(08:03) → pause(08:04) → resumeSame(08:06) → endCurrentItem(08:07) | periods 3 本、`elapsedSec`=60+60+60=180（中断 2 回分 240s 除外） |
| U4 | `periodsElapsedSec` | periods=`[{08:00,08:01},{08:03,08:04}]`, openEnd 不要 | 120（60+60） |
| U5 | `periodsElapsedSec`（進行中） | periods=`[{08:00,08:01},{08:03,null}]`, openEnd=08:04 | 120（60 確定 + 60 live） |
| U6 | `sessionElapsedSec`（periods 経路） | 終了済 record(periods 合計 120) + 進行中 record(periods 合計 30, running) | 150 |
| U7 | `ExecutionPage` | periods を持つ running state で描画 | 開始時刻表示 = `periods[0].startedAt`（最初の開始時刻） |
| U8 | `ExecutionPage`（pause→次活動） | pause 後に「次の活動へ」 | 前アイテムの確定経過が中断分を含まない（合計が中断分膨らまない） |
| U9 | `executionRepo`（round-trip） | periods を持つ state を persist → restoreInProgress | periods が損失なく復元される |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U10 | `periodsElapsedSec` | period の endedAt < startedAt（端末時計巻き戻し） | 当該区間 0 クランプ、合計が負にならない |
| U11 | `periodsElapsedSec` | periods 合計が 4H 超 | `MAX_ACTIVITY_SEC`(4H) で上限クランプ |
| U12 | `executionRepo`（legacy 合成） | periods 欠落の legacy record を復元 | `[{startedAt, endedAt}]` を合成し、`elapsedSec` は保存値を信頼（再計算しない） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U13 | `periodsElapsedSec` | periods 0 本 / 開始直後 0s | 0 を返す |
| U14 | `executionMachine` | pause 直後（開いた period 無し）に endCurrentItem を二重呼び | 冪等（区間追加せず no-op） |
| U15 | `executionMachine` | start 直後 periods=`[{now,null}]` | 開いた period がちょうど 1 本 |

## 2. 修正テストケース
| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| N3 | `executionMachine.test.ts`「pause→resumeSame で pause 分を経過から除外」 | `expect(records[0].pausedTotalSec).toBe(120)` + `elapsedSec===120` | `pausedTotalSec` 断定を撤去し、periods=`[{08:00,08:01},{08:03,08:04}]` と `elapsedSec===120` を断定 | 経過の SoT が pausedTotalSec → periods に移行 |
| N6 | `elapsed.test.ts`「経過 = 差分 - pause」 | `elapsedSec(...,30)===90` | 既存 `elapsedSec` は維持（後方互換）。新たに `periodsElapsedSec` で同等ケースを追加 | 旧式は legacy フォールバック用に保持 |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| （なし） | — | 旧 `elapsedSec`/`pausedTotalSec` 経路は legacy 互換のため残す |

## 4. リグレッション強化
- N1（start で running + 先頭 record）/ N2（endItem→next で現 record 終了 + 次 record）が periods 化後も green。
- N5/N4（最終アイテムで nextItem→done）、endSession で done、B2/B3（達成判定 doneItemCount）が不変。
- `sessionElapsedSec`（R20260613-004 セット合計）が periods 経路でも従来経路でも正しく合算。
- 通常計時（pause なし）の経過が改修前と一致。
- 振り返り集計（summaryRepo）は確定 `elapsedSec` を使うため合計が改修前後で不変。
- ハートビート保存・15 秒 backend flush（R20260611-001）に periods を含む state でも影響しない。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| `now` 注入 | 既存（T(h,m,s) ヘルパ） | 流用（period の開閉時刻を決定的にするため固定 now 列を注入） | 既存パターン踏襲 |
| IndexedDB（LocalStore） | 既存 fake | 流用（periods round-trip / legacy 合成の検証に使用） | 既存パターン踏襲 |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承（periods 有無の分岐・クランプ分岐を含む） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版作成（claim C20260614-001 起点） | /flow:revise |
