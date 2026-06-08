# 実装レポート: execution

## 実装日時
2026-06-08 19:12 (JST)

## モード
feature

## 関連ドキュメント
- 001-004 + 905 + [AI_LOG](../AI_LOG/D20260608_024_tdd_execution.md)

## 変更一覧
- `model/elapsed.ts`: タイムスタンプ差分の経過算出 + 負値クランプ（生タイマー不使用）。
- `model/executionMachine.ts`: 純関数状態機械（start/endCurrentItem/pause/resumeSame/nextItem/endSession/setNote + doneItemCount）。
- `model/executionRepo.ts`: local-sync 永続（決定的 id で冪等）+ daily_achievement upsert（穴あき許容）+ findInProgress 復元。
- `hooks/useExecution.ts`: 状態保持 + 遷移ごと永続（now 注入で決定的）。
- `ExecutionPage.tsx`: 実行 UI（開始/終了/次へ/一時停止/再開/セット終了 + 今日メモ + 経過表示）。

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 追加 | なし |
| 後続 | 進行中 session の自動復元 UI 配線（findInProgress は実装済、app-shell ルーティング時）。経過の live ticking（setInterval）は ExecutionPage で状態由来表示、必要なら仕上げ |
| 問題と対処 | now 注入でタイマー非依存テストを決定化。バックグラウンド/リロード正確性はタイムスタンプ方式で担保 |

## PR Description
### タイトル
execution: 時間ベース実行（状態機械/タイムスタンプ経過/穴あき達成）
### 概要
セットを時間ベースで実行。経過はタイムスタンプ差分（バックグラウンド/スリープでも正確）。1 アイテム実行で達成（穴あき許容）。
### テスト
15 テスト（machine 9 / repo 4 / page 2）。累計 87/87 green、typecheck green。
