# クレーム判定レポート

**claim id**: C20260614-001
**判定日**: 2026-06-14
**判定者**: Claude (opus-4-8) + seiji
**判定**: 仕様変更 (revise)

## 1. 三項照合

### 1.1 期待 (Expected)
- (A) 活動の一時停止中（中断）の時間は、その活動の経過時間から差し引かれる。
- (B) 「pause したまま次の活動へ移行 / セット終了」でも中断区間が経過から除外される。
- (C) 1 活動が複数の計時区間（period）を 1:N・無制限に持てる（何度でも中断可）。
- (D) 活動画面の開始時刻表示は最初の開始時刻のみ。

### 1.2 既存仕様 (Spec)
- `docs/execution/001_execution_SPEC.md` の経過モデル: 経過 = タイムスタンプ差分 − 一時停止累計。
- `executionMachine.test.ts` N6「経過 = 差分 − pause」: pause 分を経過から除外するのは**仕様意図**。
- すなわち「中断は計時しない」は既存仕様が既に企図している。問題はその仕様を満たす**データモデルが単一 start/end ペア + `pausedTotalSec` 1 個**で、特定経路（pause したまま切替）を表現しきれない点。

### 1.3 現実 (Actual)
`src/features/execution/model/executionMachine.ts`:
- `ItemExec { itemId, startedAt, endedAt, elapsedSec, pausedTotalSec, note }` — 単一 start/end ペア。
- `pause`（71-74）: `status=paused`, `pauseStartedAt=now` にするのみ。
- `resumeSame`（77-89）: `pausedTotalSec += diffSec(pauseStartedAt, now)`。**ここでしか `pausedTotalSec` は増えない**。
- `endCurrentItem`（60-68）: `elapsedSec = cappedElapsedSec(startedAt, now, pausedTotalSec)`。
- `nextItem`（92-105）: `endCurrentItem` してから次 record を起こす。
- 欠陥: A を pause したまま resume せず `nextItem` / `endSession` すると、`pausedTotalSec=0` のまま `endCurrentItem` が `elapsed = now − startedAt` を確定 → pause 開始〜切替時刻の中断区間が経過に混入する。

### 1.4 照合結果
- 中核事象（中断時間の混入）は **Expected = Spec（中断は除外）≠ Actual** であり、由来としては bug パターンに見える。
- しかし**ユーザー指定の remedy** は「単一ペア → 1:N period」という**データモデル変更**（複数回中断を無制限に扱う設計変更）であり、新たな仕様判断（period の SoT 化、派生フィールドの維持、表示開始時刻の妥協、後方互換の合成方針）を要する。
- 単なるバグ修正（既存モデルの 1 箇所修正）に収まらず、経過モデルの構造を作り直すため、**仕様変更 (/flow:revise)** に分岐するのが適切。

## 2. 判定根拠

1. 「中断は計時しない」という意図自体は既存仕様内（N6）だが、ユーザーが要求する remedy は単一ペアモデルの放棄と 1:N period モデルの新規導入であり、データモデルと経過計算の仕様を作り直す**設計変更**である。
2. 「何度でも中断・無制限の period・最初の開始時刻のみ表示」は新たな仕様判断を含み、SPEC への反映（変更前 vs 変更後 / データモデル変更 / 後方互換）が必要 → fix ではなく revise。
3. 既存完了レコードは保存済み `elapsedSec` を信頼し遡及補正しない、periods は additive、legacy 復元時は `[{startedAt, endedAt}]` を合成、という後方互換の仕様判断を伴うため、revise の枠組みで扱うべき。

## 3. 推奨分岐先

- **コマンド**: `/flow:revise`
- **issue**: R20260614-002 / activity-periods
- **分岐先サブフォルダ**: `../revise_R20260614-002_20260614_activity-periods/`
- **scope**: medium。データ破損なし・既存履歴は不変だが、計時の正確性（中断除外）が特定経路で崩れ全ユーザー影響。
- **改修方針（要約）**: `ItemExec` に `periods: { startedAt; endedAt|null }[]`（1:N・無制限・SoT）を追加。pause は末尾の開いた period を閉じ、resume は新 period を push、終了時は開いた period のみ閉じる → pause したまま切替でも中断区間が自然に除外される。`startedAt`/`endedAt` は派生フィールドとして維持（persist/restore・集計形状の互換）。表示開始時刻は `periods[0].startedAt`。

## 4. 却下時の対応
該当なし（仕様変更判定）。

## 5. 判定保留時の論点
該当なし（2026-06-14 時点で論点なし）。backend periods 列の追加は任意（IndexedDB が構造正本のため実害なし）。

## 6. 関連

- クレーム原文: `./000_CLAIM_REPORT.md`
- 過去類似 claim: `../claim_C20260610-001_20260610_timer-frozen-display/`（同 execution 計時表示まわり）
- 分岐先サブフォルダ: `../revise_R20260614-002_20260614_activity-periods/`
- 基準 SPEC: `../001_execution_SPEC.md`
