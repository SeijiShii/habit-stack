# execution 単体テスト計画

> **入力**: `./001_execution_SPEC.md`, `./002_execution_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧
### 1.1 正常系
| ID | 対象 | 期待 |
|---|---|---|
| N1 | machine.start | running + 先頭 record |
| N2 | machine.endItem→next | 現 record 終了(elapsed 算出) + 次 record 開始 |
| N3 | machine.pause→resumeSame | paused_total_sec 加算、経過から pause 分を除外 |
| N4 | machine.nextItem(from paused) | 次 record 開始でセット再開 |
| N5 | machine.endSession | done + ended_at |
| N6 | elapsed | (end-start)-paused を秒で算出 |
| N7 | executionRepo 達成 upsert | 1 アイテム実行で daily_achievement(achieved=true) |
| N8 | useExecution 復元 | 進行中 session を IndexedDB から復元、経過 now 差分再計算 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | elapsed | 端末時計戻り（end<start） | 0 にクランプ |
| E2 | start | 既に進行中 session | 復元 or 終了確認 |
| E3 | note | 281 文字 | 切り詰め/エラー |
| E4 | オフライン | online=false | ローカル記録成功 |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | 1 アイテムのみのセット | start→end | done + 達成 |
| B2 | 全アイテム実行（穴なし） | — | item_done_count=全件、achieved=true |
| B3 | 1 アイテムだけ実行（穴あき） | — | achieved=true（穴あき許容、D20260608-003） |
| B4 | pause を跨ぐ長時間（スリープ相当） | now 差分大 | 経過正確、表示も復元 |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| now（時刻） | 注入（純関数に引数） | 決定的、生タイマー不使用の担保 |
| local-sync | mock | 永続検証 |
| IndexedDB | fake-indexeddb | 復元検証 |
| auth | mock owner | — |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 85%（中核ロジック） |
| 分岐 | 80%（全遷移網羅） |

## 4. 既存ユーティリティ依存
- activity-sets(対象), _shared/local-sync, _shared/types。

## 5. テスト実行環境
- Vitest + fake-indexeddb + 時刻注入。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
