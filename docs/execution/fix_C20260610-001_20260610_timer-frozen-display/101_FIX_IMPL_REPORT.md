# 実装レポート: execution C20260610-001 (timer-frozen-display)

## 実装日時
2026-06-10 (JST)

## モード
fix

## 関連ドキュメント
- [000_調査レポート.md] / [001_ROOT_CAUSE.md] / [002_FIX_PLAN.md] / [003_REGRESSION_TEST.md]
- [AI_LOG セッション](../../AI_LOG/D20260610_004_tdd_execution_fix_C20260610-001.md)
- 起点クレーム: [../claim_C20260610-001_20260610_timer-frozen-display/001_TRIAGE.md]

## 注意事項
本レポートのファイルパス・行番号は実装日時時点のもの。

## 変更一覧

### Phase 1 (単一・軽): 計時中の経過ライブ表示 + 開始/現在時刻
**対象**: `src/features/execution/ExecutionPage.tsx`（表示層のみ。machine/repo/elapsed の記録ロジックは不変）

- import 追加: `useEffect`, `useState`（react）/ `elapsedSec`（model/elapsed）/ 型 `ItemExec`, `ExecStatus`（model/executionMachine）。
- `hhmmss(iso)` ヘルパ追加: ISO 時刻をローカル `HH:MM:SS` 表記化（開始/現在時刻表示用）。
- `nowIso` を component 内で確定（`now` prop 注入対応、テスト可能）。
- **表示専用 tick**: `useState` の `setTick` + `useEffect` で `status==="running"` の間だけ `setInterval(1000)` を張り、毎秒再描画。`isRunning` 変化で cleanup（`clearInterval`）。記録には一切影響しない描画専用タイマー（「生タイマー不使用」の記録方式は維持）。
- **ライブ経過算出** `liveElapsed(rec, status)`:
  - `rec.endedAt` あり → 確定値 `rec.elapsedSec`。
  - `paused` → `elapsedSec(startedAt, pauseStartedAt ?? now, pausedTotalSec)`（pause 時点で凍結）。
  - `running` → `elapsedSec(startedAt, now, pausedTotalSec)`（ライブ）。
- 表示更新: `elapsed` を `mmss(liveElapsed(...))` に変更。`started-at`（開始 HH:MM:SS）/ `current-time`（現在 HH:MM:SS）の 2 行を計時中セクションに追加。
- フックを早期 return より前に配置（hooks ルール順守）。

**テスト**: `src/features/execution/ExecutionPage.test.tsx` に describe「計時中表示 (fix C20260610-001)」を追加（fireEvent + fake timers）。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | テスト駆動方式を userEvent+fake timers → fireEvent+act に変更（userEvent と fake timers の併用がハングするため。挙動検証内容は計画どおり） |
| 計画から省略した変更 | E2E シナリオ追加（003 §4、優先度低）は未実施。unit で R1/R5/R3-R4 をカバー |
| 想定外の問題と対処 | 初版テストが userEvent+fakeTimers でタイムアウト → fireEvent+act 駆動に置換して解消 |

## PR Description

### タイトル
execution: 計時中の経過時間ライブ表示 + 開始/現在時刻の併記 (バグ修正 C20260610-001)

### 概要
活動の計時中に「経過時間」が 00:00 のまま固まる不具合を修正。表示が保存済みの確定値（計時中は 0）を読んでいたのが原因で、now との差分でライブ算出し、running 中は毎秒の表示専用 tick で再描画するようにした。記録のタイムスタンプ差分方式は変更していない。併せて計時中に開始時刻・現在時刻を表示する。

### 変更内容
- `ExecutionPage.tsx`: 表示専用 tick（running 中のみ setInterval）、`liveElapsed` でのライブ経過算出、開始/現在時刻表示、`hhmmss` ヘルパ。
- `ExecutionPage.test.tsx`: 回帰テスト 3 件（ライブ更新 / 一時停止凍結 / 開始・現在時刻表示）。

### テスト
- execution 単体: 5/5 パス（既存 2 + 新規 3）。
- 全体スイート: 132/132 パス。typecheck クリーン。
