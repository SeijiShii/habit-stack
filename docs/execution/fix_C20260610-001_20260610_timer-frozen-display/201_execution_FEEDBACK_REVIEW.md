# バグフィードバックレビュー: 計時中の経過時間ライブ表示 (C20260610-001)

## レビュー日時
2026-06-10 (JST)

## ラウンド
1

## レビュー対象
| ファイル | 操作 | 行数 |
|---|---|---|
| `src/features/execution/ExecutionPage.tsx` | 変更 | +約30 |
| `src/features/execution/ExecutionPage.test.tsx` | 変更（テスト追加） | +約90 |

## レビューサマリー
| 観点 | 指摘数 | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| 型安全性 | 0 | 0 | 0 | 0 | 0 |
| インターフェース境界 | 0 | 0 | 0 | 0 | 0 |
| ロジックバグ | 0 | 0 | 0 | 0 | 0 |
| React フックライフサイクル | 1 | 0 | 0 | 1 | 0 |
| セキュリティ・権限 | 0 | 0 | 0 | 0 | 0 |
| エラーハンドリング | 0 | 0 | 0 | 0 | 0 |
| パフォーマンス | 0 | 0 | 0 | 0 | 0 |
| 仕様適合性 | 0 | 0 | 0 | 0 | 0 |
| 整合性パターン | 0 | 0 | 0 | 0 | 0 |
| 学習済み観点 | 0 | 0 | 0 | 0 | 0 |
| **合計** | **1** | **0** | **0** | **1** | **0** |

## 指摘事項

### [FB1] 一時停止中に「現在時刻」表示が凍結する → 修正済み
- **重要度**: MEDIUM
- **観点**: React フックライフサイクル / 仕様適合性
- **ファイル**: `src/features/execution/ExecutionPage.tsx`（表示専用 tick）
- **現状コード（修正前）**:
  ```tsx
  const isRunning = s?.status === "running";
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);
  ```
- **問題**: 再描画 tick を `running` のときだけ張っていたため、`paused` 中は `current-time`（現在時刻）の表示が一時停止した瞬間で凍結し、実時間が進んでも更新されない。クレームの要望「計時中は現在時刻を表示する」は paused も含む計時状態を想定しており、停止して見える時計は要望を部分的に損なう。経過時間は `liveElapsed` の paused 分岐で正しく凍結されるため、tick を paused でも回しても経過は進まない。
- **修正方針**: tick の発火条件を `running || paused`（= 計時中）に広げ、現在時刻を paused 中もライブ更新する。経過時間の凍結は `liveElapsed` 側で担保済みのため副作用なし。
- **自動修正**: 可能（実施済み）

## 修正必要項目
| # | 重要度 | 指摘 | 自動修正 | ステータス |
|---|---|---|---|---|
| FB1 | MEDIUM | 一時停止中の現在時刻凍結 | 可能 | 修正済み |

## 修正結果

### [FB1] → 修正済み
- **修正ファイル**: `src/features/execution/ExecutionPage.tsx`
- **修正内容**: tick の guard を `isRunning` → `isTiming (running || paused)` に変更。現在時刻が paused 中もライブ更新されるようにした。
- **追加テスト**: `ExecutionPage.test.tsx` - 「R7: 一時停止中も現在時刻はライブ更新される (経過は凍結のまま)」
- **テスト結果**: PASS（RED 確認 → GREEN）
- **VERIFY 結果**: 5.4.a 学習観点（L-32 functional setter 一貫 / L-36 非該当）✅ / 5.4.b 呼び出し元（App.tsx のみ、シグネチャ不変）✅ / 5.4.c 副作用分離（表示専用 interval、cleanup 正常、外部副作用なし）✅ / 5.4.d 過去指摘照合（R5 で経過凍結を維持アサート、元バグ非再導入）✅

## 修正サマリー
| 項目 | 値 |
|---|---|
| 修正済み | 1 件 |
| スキップ | 0 件 |
| 要対応 | 0 件 |
| 追加テスト | 1 件（R7） |
| 全テスト | 133/133 パス |

## 問題なしの確認事項
- interval の cleanup（running→paused→done 遷移で clearInterval、リーク無し）
- stale closure（`setTick` は functional updater、`nowIso()` は render ごとに fresh 評価）
- `liveElapsed` の分岐（ended=確定値 / paused=pause 時点凍結 / running=ライブ）
- `elapsedSec` の 0 クランプ（時計巻き戻し耐性）
- `hhmmss` のローカル時刻表記（started-at / current-time とも同一変換、TZ バグなし）
- 記録ロジック（machine/repo/elapsed）不変、既存テスト維持

## 手動動作確認の提案
### 判定: 推奨
### 理由
FE 描画（計時中の経過・時刻表示）の挙動変更のため、実機で「経過が秒単位で増える」「一時停止で経過が止まり現在時刻は進む」を目視確認すると確実。unit（R1/R5/R7/R3-R4）で主要挙動はカバー済み。
### 確認手順
1. 実行画面でセットを開始 → 経過時間が秒ごとに増えること、開始/現在時刻が表示されることを確認。
2. 一時停止 → 経過が止まり、現在時刻は進み続けることを確認。再開で経過が続きから増える。

## 関連 AI_LOG タイムライン
- 判定: D20260610_001_claim_execution_C20260610-001（bug 判定）
- 設計: D20260610_002_fix_execution_C20260610-001
- 実装: D20260610_004_tdd_execution_fix_C20260610-001
- レビュー: 本セッション D20260610_005_feedback_execution
