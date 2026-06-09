# クレーム判定レポート

**claim id**: C20260610-001
**判定日**: 2026-06-10
**判定者**: Claude (opus-4-8) + seiji
**判定**: バグ (fix)

## 1. 三項照合

### 1.1 期待 (Expected)
- (A) 活動開始後、画面の「経過時間」がリアルタイムにカウントアップする。
- (B) 計時中（running）は経過時間に加え **開始時刻** と **現在時刻** も表示する。

### 1.2 既存仕様 (Spec)
- `concept.md` §1.1 UC4「時間ベースで実行・記録」。execution は時間ベース実行画面で、経過の提示が中核。
- `001_execution_SPEC.md` §1 UC4 line 22:「**経過時間 = 壁時計タイムスタンプ差分**。生タイマーを回さないため、バックグラウンド/スリープ/タブ閉じでも正確（**再開時に now との差分で復元**）」。
  → SPEC の経過時間モデルは「now との差分」。計時中の経過は常に `now() - startedAt - pausedTotalSec` で導出可能（=正の値）であることが前提。
- §5.1 NFR「経過時間精度: バックグラウンド/スリープでも正確（タイムスタンプ差分）」。
- 注: SPEC は計時中ライブ表示の tick 更新を**明文化していない**が、経過モデルが「now 差分」である以上、計時中に 0 を出すのは SPEC のモデルと矛盾する。
- (B) 開始時刻・現在時刻の表示は SPEC に明記なし（追加表示要望）。

### 1.3 現実 (Actual)
- `src/features/execution/ExecutionPage.tsx:66`:
  `<p data-testid="elapsed">{mmss(currentRec.elapsedSec)}</p>` — 表示は **保存済み `elapsedSec`** を読む。
- `src/features/execution/model/executionMachine.ts:25-32` `newRec()`: `elapsedSec: 0` で初期化。
- 同 `endCurrentItem` (line 56-64) でのみ `elapsedSec = elapsedSec(startedAt, now, pausedTotalSec)` を算出保存。
- `src/features/execution/hooks/useExecution.ts`: state は遷移操作（start/endItem/pause/...）でのみ更新。計時中に再描画する **interval / tick が存在しない**。
- 結果: running 中は表示が保存値 `0` のまま固定 → `00:00`。終了時に初めて算出されるため「記録された時間は進んでいる」。
- 開始時刻・現在時刻は表示要素自体が存在しない。

### 1.4 照合結果
- (A) **期待 = SPEC（now 差分で導出される正の経過）≠ 現実（保存済み 0 を表示・tick なし）** → 典型的なバグパターン。SPEC の経過モデルに反して計時中の表示が更新されない実装欠陥。
- (B) 追加表示（開始/現在時刻）は SPEC 未記載の表示拡張だが、(A) の remediation として同一画面・小規模であり、ユーザーが同一 remediation として要望（「経過時間だけでは分かりづらい」）。主因 (A) のバグ修正にまとめて取り込む（seiji 確定: 単一 fix）。

## 2. 判定根拠

1. 中核の事象「経過時間が 00:00 のまま進まない」は、SPEC が定める経過モデル（now との差分で常に導出可能）に反して、実装が保存済みの 0 を表示し計時中の再描画を行わない欠陥であり、Expected = SPEC ≠ Actual のバグパターンに合致する。
2. 記録値（タイムスタンプ差分）は正しく算出されており、データ仕様は満たしている。問題は **計時中のライブ表示のみ** に限局し、新たな仕様判断（SPEC の作り直し）を要しない → revise ではなく fix が適切。
3. 「生タイマー不使用」の設計根拠（D20260608-004）は **記録方式**の制約であり、表示の更新は `now() - startedAt - paused` を render ごとに算出すれば設計と整合する。ライブ表示の追加は設計違反ではなく、設計どおりの導出を表示にも適用する修正。
4. 付随する開始/現在時刻の表示追加は SPEC 未記載だが、同一画面・小規模・同一 remediation でありユーザーが fix の一部として要望。分割は管理オーバーヘッドのみ増やすため単一 fix に同梱（seiji 確定）。

## 3. 推奨分岐先

- **コマンド**: `/flow:fix`
- **引数**: `execution C20260610-001 --severity=medium --from-claim=C20260610-001`
- **severity / scope**: medium。データ破損なし・記録は正確だが、実行中 UX の中核（経過の可視化）が機能しておらず全ユーザー影響。
  - 修正スコープ: ① 計時中（running/paused）の経過時間をライブ算出・tick 更新で表示（`elapsedSec` の保存値ではなく `now()-startedAt-pausedTotal` を導出）。② 計時中は開始時刻・現在時刻も併記表示。
  - 留意: SPEC「生タイマー不使用（記録方式）」は維持。表示用の tick（setInterval 等）は記録に影響しない描画専用とする。i18n / design-system のボイス&コピー準拠で時刻ラベルを用意。
- **優先度**: medium（§000 緊急度推定を継承）。

## 4. 却下時の対応
該当なし（バグ判定）。

## 5. 判定保留時の論点
該当なし。

## 6. 関連

- クレーム原文: `./000_CLAIM_REPORT.md`
- 過去類似 claim: なし
- 分岐先サブフォルダ: `../fix_C20260610-001_20260610_timer-frozen-display/`（Step 6 で作成）
