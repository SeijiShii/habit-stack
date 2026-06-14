# 実装レポート: execution F20260615-001 (stale-in-progress-badge)

## 実装日時
2026-06-15 08:50 (JST)

## モード
fix

## 関連ドキュメント
- [000_調査レポート.md] / [001_ROOT_CAUSE.md] / [002_FIX_PLAN.md] / [003_REGRESSION_TEST.md]
- [AI_LOG セッション](../../AI_LOG/D20260615_007_tdd_execution_fix_F20260615-001.md)

## 変更一覧

### Phase 1: done→invalidate 配線 + undefined→null 正規化（軽・メイン直接）
- `src/features/execution/ExecutionPage.tsx`:
  - props に `onSessionEnd?: () => void` を追加。done 検知 useEffect で `endedNotifiedRef` ガード付きに 1 度だけ発火（手動終了 `exec.end` / 自動終了 recovery autoEnd の両経路をカバー）。ExecutionPage は react-query 非依存のまま。
- `src/App.tsx`:
  - RunInner に `useQueryClient` を追加し、ExecutionPage に `onSessionEnd={() => invalidateQueries(["in-progress-session"])}` を配線（停止後にバッジ/復帰導線が stale で残らない）。
  - **`["in-progress-session"]` query（SetsRoute + RunInner）の queryFn を `findInProgress().then(r => r ?? null)` に変更**（undefined→null 正規化）。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | **undefined→null 正規化**（002 計画には無かった）。実装中の E2E 回帰で発覚した二次バグへの対処（下記） |
| 計画から省略した変更 | 計画の「ExecutionPage done 検知 effect に invalidate を同梱」は、ExecutionPage を react-query に結合させないため `onSessionEnd` コールバック経由（App 層で invalidate）に変更 |
| 想定外の問題と対処 | **回帰**: onSessionEnd の invalidate で `["in-progress-session"]` を refetch すると、queryFn が `undefined` を返す（他セッション無し）ため react-query が pending 扱いし、`inProgress.isLoading` が一時 true へ戻り、RunInner の `if (inProgress.isLoading) return <Loading/>` が **ExecutionPage を再マウント**→復元レースで done 表示が running に巻き戻った（セッション終了系 E2E 5 件が red）。**CLAUDE.md の UI タイミング debug 方針で console.log を実機（headless）に仕込んで挙動を確認 → 原因特定 → undefined→null 正規化で解消 → ログ全削除**。 |

## PR Description

### タイトル
execution F20260615-001: 計時停止後の「進行中」表示残存を解消

### 概要
計時を終了したのに一覧の「進行中」バッジ／`/run` の「計時中です」復帰導線が残る不具合を、セッション done 時の `["in-progress-session"]` query 無効化で解消。あわせて query の undefined→null 正規化で invalidate 時の不要な再マウントを防止。

### 変更内容
- セッション done で onSessionEnd 発火 → App 層で in-progress query を invalidate
- findInProgress query を null 正規化（pending 誤判定による ExecutionPage 再マウント回帰を防止）

### テスト
- 単体: 246 passed（RG-01 追加: done で onSessionEnd 1 度発火 / running では非発火）
- E2E: 25 passed（RG-02 追加: 終了→一覧でバッジ消滅。セッション終了系 5 件の回帰も green 復帰）
- tsc --noEmit クリーン
