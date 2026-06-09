# リグレッションテスト計画: 計時中の経過時間ライブ表示 + 開始/現在時刻

> **入力**: `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`
> **最終更新**: 2026-06-10
> **テスト基盤**: vitest + @testing-library/react + happy-dom（既存 `ExecutionPage.test.tsx` に倣う）

---

## 1. 再発防止テストケース

### 1.1 直接原因を捉えるテスト（修正前は失敗 / 修正後は成功）
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| R1 | 計時中の経過ライブ更新 | `now` を注入し開始 → 時刻を +65 秒進めて tick 発火 | `elapsed` 表示が `00:00` → `01:05` に増える（**修正前: 00:00 のまま=失敗**） |
| R2 | 経過の初期表示 | 開始直後 | `elapsed` が開始時点の経過（`00:00`）で、以後増加する |

### 1.2 修正後に必ず通るテスト
| ID | 対象 | 期待 |
|---|---|---|
| R3 | 開始時刻表示 | `started-at` に `currentRec.startedAt` の HH:MM:SS が表示される |
| R4 | 現在時刻表示 | `current-time` に現在時刻 HH:MM:SS が表示され、tick で更新される |
| R5 | 一時停止で凍結 | 一時停止後に時刻を進めても `elapsed` が増えない（pause 時点で凍結） |
| R6 | 再開で継続 | 再開後は経過が続きから増える（pausedTotalSec 加算が反映） |

## 2. 類似境界条件テスト
| ID | 境界条件 | 期待振る舞い |
|---|---|---|
| B1 | 端末時計が戻る（now が startedAt より前） | `elapsed` が負値にならず `00:00`（elapsed.ts の 0 クランプ） |
| B2 | done 状態 | tick が停止（interval が clearInterval される）、`elapsed` は確定値表示 |
| B3 | アンマウント | interval リークなし（cleanup で clearInterval） |
| B4 | 60 分超の経過 | `mmss` が `MM:SS` 表記で分が 60 を超えても破綻しない（例 `90:00`） |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| E1 | `ExecutionPage.test.tsx`「開始→次へ→終了で完了+達成記録」 | 記録ロジック不変、表示追加のみ。`current-item` 等の既存 testid は維持 |
| E2 | `ExecutionPage.test.tsx`「開始後にメモ入力できる」 | textarea 不変 |
| E3 | `executionMachine.test.ts` / `executionRepo.test.ts` | machine/repo を一切変更しないため不変 |

## 4. E2E シナリオ追加（該当時）
| シナリオ ID | 内容 |
|---|---|
| (任意) X1 | 実行画面で開始 → 数秒後に経過表示が増えていること + 開始/現在時刻が見えることを視覚確認（既存 004_execution_E2E_TEST.md の実行フローに observation を追加。優先度低、unit で十分カバー） |

## 5. Mock 方針
| 対象 | 固定値 | 理由 |
|---|---|---|
| 時刻 now | `now` prop に可変クロックを注入（mutable ref を返す関数） | 計時中の経時変化を決定的に検証 |
| タイマー | `vi.useFakeTimers()` + `vi.advanceTimersByTime(1000*n)` | setInterval の tick を決定的に進める。`now` クロックも同期して進める |

> 注: 表示は `now()` を読むため、fake timers を進めるだけでなく注入 `now` の返り値も合わせて進める必要がある（tick で再描画 → `now()` 再評価）。テストヘルパで `clock` 変数を `advanceTimersByTime` と同時に更新する。

## 6. カバレッジ目標
- 修正コード行（ExecutionPage の liveElapsedSec / tick useEffect / hhmmss / 時刻表示 JSX）: 100%
- 関連境界条件（pause 凍結 / done 停止 / 0 クランプ）カバレッジ: 90%+

## 7. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-10 | 初版 | /flow:fix |
