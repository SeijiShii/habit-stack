# 単体テストレポート: execution R20260614-002

## 実施日時
2026-06-14 18:53 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md] - 単体テスト計画
- [001_REVISE_SPEC.md] / [002_REVISE_PLAN.md] / [005_REVISE_MIGRATION.md]

## テスト実行環境
- Vitest 2.1.9（happy-dom）+ React Testing Library + fake timers

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| N3 | pause→resumeSame→end → periods=[{8:00,8:01},{8:03,8:04}]、elapsedSec=120、startedAt=8:00 | model/executionMachine.test.ts | ✅ | 中断 08:01-08:03 を除外、表示開始=最初の period |
| N3b | pause したまま再開せず次活動へ → i1 elapsedSec=60（中断 240s 除外） | model/executionMachine.test.ts | ✅ | **バグ修正の核心**（claim C20260614-001） |
| N3c | 複数回中断（1:N、3 periods）→ elapsedSec=180 | model/executionMachine.test.ts | ✅ | 中断 2 回ぶんを除外 |
| P1 | confirmedPeriodsSec: 閉じた period 長の合計（開いた period は除外） | model/elapsed.test.ts | ✅ | 中断隙間を除外、開いた period=null は不算入 |
| P2 | confirmedPeriodsSec: 4H クランプ | model/elapsed.test.ts | ✅ | 5H → 14400 |
| P3 | periodsElapsedSec: 開いた period を openEnd で閉じて算入（live） | model/elapsed.test.ts | ✅ | 120 + 60 |
| P4 | periodsElapsedSec: 中断中（開いた period 無し）は閉じた合計＝凍結 | model/elapsed.test.ts | ✅ | openEnd 進んでも 120 |
| S1-S5 | sessionElapsedSec（合計/live/paused 凍結/巻き戻し 0/4H クランプ/0 本） | model/elapsed.test.ts | ✅ | 既存（legacy フォールバック経路）全 pass |
| 既存 | ExecutionPage / executionRepo / recovery / heartbeat | 各 test | ✅ | 回帰なし |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| N3 | executionMachine | pause→resume→end の periods 断定に更新 | pausedTotalSec 断定を periods 断定へ（モデル変更） |
| N3b | executionMachine | pause したまま次活動へ → 中断除外 | claim C20260614-001 のバグ修正を回帰固定（最重要） |
| N3c | executionMachine | 複数回中断 1:N（3 periods、180s） | 多重中断を構造で表現することの検証 |
| P1-P4 | confirmedPeriodsSec / periodsElapsedSec | 閉じた合計・中断除外・4H クランプ・live openEnd・凍結 | 新規純関数のカバー |

## カバレッジ・残課題

- **E2E（103）は未実施**。`/flow:e2e`（P4.5 gate）で別途実施予定（pause→次活動で中断時間が経過に入らないことを headless で確認）。実機目視（複数中断・4H cap）は `/flow:release` 時。
- backend periods 列（任意・additive）は未追加のため backend round-trip テストは対象外（IndexedDB 構造正本で運用、詳細は 005_REVISE_MIGRATION.md）。

## サマリー

| 項目 | 値 |
|------|-----|
| 追加テスト数 | 7（executionMachine N3 更新 + N3b/N3c 追加、elapsed P1-P4 追加） |
| 合計（全スイート） | 226 |
| 成功 | 226 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | clean |
