# 根本原因分析: 計時中の経過時間が 00:00 のまま進まない

> **入力**: `./000_調査レポート.md`, `src/features/execution/{ExecutionPage.tsx, hooks/useExecution.ts, model/executionMachine.ts, model/elapsed.ts}`
> **最終更新**: 2026-06-10

---

## 1. 5 Whys

| # | 問い | 答え |
|---|---|---|
| Why 1 | なぜ計時中に経過時間が 00:00 のままなのか? | 表示が `currentRec.elapsedSec`（保存済みの値）を読んでおり、計時中はその値が初期値 `0` のままだから（`ExecutionPage.tsx:66`）。 |
| Why 2 | なぜ `elapsedSec` が計時中 0 のままなのか? | `elapsedSec` は `newRec()` で `0` 初期化され（`executionMachine.ts:25-32`）、`endCurrentItem`（line 56-64）で「終了」したときにのみ `elapsedSec(startedAt, now, pausedTotalSec)` を算出保存するから。計時中は更新されない。 |
| Why 3 | なぜ計時中に値が再計算・再描画されないのか? | `useExecution` の state は遷移操作（start / endItem / pause / …）でしか更新されず、計時中に定期再描画する **tick（setInterval 等）が存在しない**（`useExecution.ts` に interval なし、features 全体に setInterval/useEffect なし）。 |
| Why 4 | なぜ表示が「保存値」を読む実装になったのか? | 記録方式が「タイムスタンプ差分・生タイマー不使用」（設計根拠 D20260608-004）であり、**記録の正確性**（バックグラウンド/スリープでも正確）を満たす実装に集中した結果、表示も保存済み確定値をそのまま流用してしまった。計時中の**表示**を `now() - startedAt` で導出する観点が実装・テストから漏れた。 |
| Why 5 | なぜその漏れがレビュー・テストで防げなかったのか? | **根本原因**: SPEC が経過モデルを「now との差分」と定義しつつ、**計時中のライブ表示挙動を明文化しておらず**（§2.2 画面入力は note のみ）、単体テストも遷移結果（終了後の記録値・達成記録）の検証に留まり、計時中の経過表示の経時変化を検証するケースが無かった。仕様・テスト両面で「計時中の表示」が観点として欠落していた。 |

→ 最終 Why をもって**根本原因確定**: 「記録方式（タイムスタンプ差分・生タイマー不使用）」を表示層にもそのまま適用し、計時中の経過を `now() - startedAt` で導出・定期再描画する観点が SPEC・実装・テストいずれにも無かったこと。

## 2. 直接原因

| ファイル | 行 | 問題箇所 |
|---|---|---|
| `src/features/execution/ExecutionPage.tsx` | 66 | `<p data-testid="elapsed">{mmss(currentRec.elapsedSec)}</p>` — 計時中も保存済み `elapsedSec`（=0）を表示。`now() - startedAt` を導出していない。 |
| `src/features/execution/hooks/useExecution.ts` | 全体 | state は遷移操作でのみ更新。計時中に再描画する tick が無い。 |
| `src/features/execution/model/executionMachine.ts` | 25-32, 56-64 | `elapsedSec` は終了時のみ算出（記録としては正しい）。表示用の導出責務はここに無く、表示層が補う必要がある。 |

## 3. 根本原因
記録方式（タイムスタンプ差分・生タイマー不使用、D20260608-004）は**記録の正確性**を担保する正しい設計だが、その方式を**表示層にもそのまま流用**し、計時中の経過を `now() - startedAt - pausedTotal` で導出して定期再描画する観点が SPEC・実装・テストいずれにも存在しなかった。結果、計時中の「経過時間」表示が確定前の初期値 0 に固定された。

## 4. 寄与要因
| 種別 | 内容 |
|---|---|
| ドキュメント不足 | SPEC が経過モデルを「now 差分」と定義する一方、計時中のライブ表示挙動を明文化していない（§2.2 は note のみ）。「経過時間だけでは分かりづらい」という UX 観点（開始/現在時刻の併記）も未記載。 |
| テスト不足 | 単体テストが遷移結果（終了後の記録値・達成）中心で、計時中の経過表示の経時変化を検証するケースが無い。 |
| レビュー漏れ | 「計時中に経過表示が動くか」という当然の確認が実装レビューで見落とされた。 |

## 5. 仮説と検証
| 仮説 | 検証方法 | 結果 |
|---|---|---|
| 表示が保存値 0 を読んでいる | `ExecutionPage.tsx:66` を確認 | ✅ 確定（`currentRec.elapsedSec` 直読み） |
| 計時中に再描画 tick が無い | `useExecution.ts` / features の setInterval/useEffect 検索 | ✅ 確定（該当なし） |
| 記録値自体は正しい | `endCurrentItem` の算出 + 既存テスト（達成記録）を確認 | ✅ 正しい（タイムスタンプ差分で算出） |

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-10 | 初版 | /flow:fix |
