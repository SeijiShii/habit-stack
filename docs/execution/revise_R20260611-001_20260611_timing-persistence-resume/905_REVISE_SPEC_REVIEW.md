<!-- auto-generated-start -->
# 設計レビューレポート — execution R20260611-001（計時状態の永続化・復帰）

**レビュー日**: 2026-06-11
**レビュー実施者**: Claude (opus-4-8[1m]) + seiji
**対象**: execution 改修 R20260611-001（revise_R20260611-001_20260611_timing-persistence-resume）
**入力**: 当該サブフォルダ 001_REVISE_SPEC〜005_REVISE_MIGRATION + 実コード（src/features/execution/*, src/services/sync/*, src/hooks/useSync.ts, db/schema.ts, src/App.tsx, src/services/auth/ownerContext）
**観点ソース**: 組み込みチェックリスト + ~/.claude/flow-data/review-perspectives.md（P1,P5,P8,P11,P16,P19,P83 ほか適用）
**モード**: auto-pick
**severity-threshold**: low

## 1. レビューサマリー

| 観点 | 評価 | 備考 |
|------|------|------|
| 仕様の明確性 | 要確認→是正済 | 復元 id / 達成記録 / 正本ソースを明確化 |
| 既存パターンとの一貫性 | OK | local-first + clientLocalId 冪等 + タイムスタンプ算出を踏襲 |
| 影響範囲・副作用 | 要確認→是正済 | 15秒 flush 用 SyncQueue 経路が未配線（R2） |
| API 流用・責務逸脱 | OK | ハートビートを状態機械の外に分離、ExecState 純粋性維持 |
| 既存実装の再利用 | OK | `findInProgress()`（実装済・未使用）を再利用（P19） |
| データ移行・互換性 | OK | additive nullable 列、旧リーダー NULL 互換（P8） |
| 権限・認可 | OK | 全永続キー owner scope、owner 不一致復元を拒否 |
| テストカバレッジ | 要確認→是正済 | R6/R3/R1 のケースを 003 に追加 |
| 学習済み観点 (P 系) | 適用 | P83（StrictMode×storage）/ P1,P16（計算 vs 保存）/ P5（read/write source） |

総合: **実装着手可（auto-pick で 6 指摘を是正反映済み）**。Class C の残論点は SPEC [論点-001] のみ（非ブロッキング、推奨 A）。

## 2. 指摘事項 (severity 降順)

### [R6] 復元時の sessionLocalId が日付スタンプで日跨ぎ重複を生む (severity=High)
- **対象**: 001 §7.1 UC-EX-RESUME / 002 App.tsx 行 / useExecution
- **現状**: `App.tsx:110` が `sessionLocalId = sess-<setId>-<YYYY-MM-DD>` を毎レンダー採番。`findInProgress()` は owner 単位で非 done を返し **id を無視**。
- **問題**: 23:30 開始→翌 00:30 復帰で id が変化し、再計算 id で hydrate→persist すると **別 id の重複 session** が生成（孤児レコード + 達成二重）。
- **推奨/採用**: 復元後の永続 id は **found レコード自身の `clientLocalId`** を採用。App 採番は新規開始時の初期値に限定。
- **種別**: 指摘事項（自動反映）
- **反映先**: 001 §7.1 手順2、002 App.tsx 行 + Phase3、003 U-REC-05

### [R2] 15秒バックエンド flush の SyncQueue 経路が未配線 (severity=High)
- **対象**: 002 §1 ExecutionPage/useSync 行 / 実コード `App.tsx`（ExecutionPage に `repo` のみ供給）
- **現状**: `useSync` は mount/online のみで push、定期 interval なし。ExecutionPage は SyncQueue への参照を持たない。
- **問題**: 「15秒ごとに backend へ」を満たすには、ExecutionPage の interval から `flushSession()`（IndexedDB 再 put + outbox）→ `SyncQueue.push()` を呼ぶ経路が要る。現状その配線がない。
- **推奨/採用**: App→ExecutionPage に SyncQueue を注入し、15秒 interval で flush+push（非ブロッキング、失敗は outbox 保持で再送）。
- **種別**: 指摘事項（影響範囲、自動反映）
- **反映先**: 002 §1 App/useSync 行、Phase3

### [R1] React StrictMode 二重マウント × マウント時 finalize/毎秒書込の整合 (severity=High, P83)
- **対象**: 001 §7.1 UC-EX-IDLE / §7.5
- **現状**: 復元・自動終了をマウント副作用で実行。dev StrictMode は effect を二重実行。
- **問題**: finalize（persist/push）やハートビート interval が二重起動し得る。
- **推奨/採用**: `decideRecovery` は純関数。finalize は clientLocalId 由来 id の put 上書きで**冪等**。interval は unmount で解除、副作用は init 1 回に限定。
- **種別**: 指摘事項（自動反映）
- **反映先**: 001 §7.1 冪等性節、003 U-REC-08

### [R3] 開始直後放置の自動終了が 0 秒達成を継続に算入し得る (severity=Medium)
- **対象**: 001 §7.1 UC-EX-IDLE 達成記録
- **現状**: `endCurrentItem` で current item に `endedAt` が入ると `doneItemCount>=1`→`recordAchievement`。
- **問題**: 「開始直後に放置」→ `lastSavedAt≈startedAt`、実経過 ~0。これを streak に算入すると罪悪感回避の設計意図（concept 継続=穴あき許容だが「実際にやった」前提）に反する。
- **推奨/採用**: 自動終了経路では **クランプ後の有効経過 >0 秒の item のみ** done と数える。手動終了の既存挙動は不変。
- **種別**: 設計判断項目（auto-pick）
- **反映先**: 001 §7.1、003 U-REC-06/07

### [R4] localStorage と IndexedDB の正本/マージ規則が曖昧 (severity=Medium, P5)
- **対象**: 001 §2.4 / §7.1
- **現状**: 「食い違いは新しい方」とのみ記載。localStorage は毎秒・IndexedDB は遷移/15秒のため timestamp 上はほぼ常に localStorage が新しく、フィールド単位マージは不整合の温床。
- **推奨/採用**: **ExecState 構造正本は IndexedDB**（full records）。localStorage は `lastSavedAt` ＋ IndexedDB miss 時のフォールバックのみ。フィールド単位マージはしない。
- **種別**: 設計判断項目（auto-pick）
- **反映先**: 001 §2.4 / §7.1 手順3

### [R7] 4H キャップは表示だけでなく確定保存値にも適用 (severity=Medium, P1/P16)
- **対象**: 001 §7.4 / 002 Phase1
- **現状**: cap 導入は明記。ただし「確定 `elapsedSec`（記録値）」への適用は読み手依存になりやすい。
- **推奨/採用**: 表示 `liveElapsed` と **`endCurrentItem` 確定時の `elapsedSec` 双方**を `cappedElapsedSec` 化（計算値・保存値の二重で 4H 上限を保証）。
- **種別**: 指摘事項（自動反映）
- **反映先**: 001 §7.4（既記載を補強）、003 U-R1-01〜03

## 3. コードベース調査結果

### 3.1 既存パターン
- local-first: `LocalStore.put` が即ローカル保存 + outbox 積み。`SyncQueue.run/push` で送信、`DrizzleSyncRepo.upsert` は `{...payload, ownerId}` を全列 onConflictDoUpdate（clientLocalId 冪等）。→ **`last_saved_at` はスキーマ列 + LocalRecord 追加で push/pull に自動伝播**（サーバ手当ほぼ不要、P8 互換）。
- 経過算出: `elapsedSec(startedAt, endedAt|now, pausedSec)` のタイムスタンプ差分（生タイマー不使用）。0 クランプのみ、上限なし。
- 復元: `ExecutionRepo.findInProgress()` 実装済みだが **UI 未配線**（P19 再利用機会）。

### 3.2 影響範囲分析
| 変更対象 | 既存呼び出し箇所 | 呼び出し元の前提（契約） | 破壊リスク |
|---|---|---|---|
| `elapsedSec`（cap 化はラッパで） | `ExecutionPage.liveElapsed`, `executionMachine.endCurrentItem` | 4H 未満は不変 | なし（4H 超のみ変化） |
| `ExecutionPage` props | `App.tsx`（`repo` のみ供給） | SyncQueue 未供給 | 中（R2: 配線追加要） |
| `sessionLocalId` | `App.tsx:110` → `useExecution`/`ExecutionRepo.persist` | 日付スタンプ id | 中（R6: 復元時に found id 採用） |
| `executionSessions` schema | `syncRepo`（全列 upsert）, pull | 列追加に透過 | なし（additive） |
| `useExecution` 初期化 | `ExecutionPage` | 初期 `state=null` | 低（hydrate 追加） |

### 3.3 API 責務の評価
- ハートビート（lastSavedAt）を **ExecState 状態機械の外**に置く設計は妥当（遷移でないものを遷移に混ぜない、純粋性維持）。
- `findInProgress()` の責務（進行中検出）を復元に流用するのは本来用途（SPEC E3）と一致、逸脱なし。

## 4. 設計判断ログ

| # | 判断項目 | 結論 | chosen_type | 反映先 |
|---|---|---|---|---|
| D1 (R6) | 復元時の永続 id | found レコードの clientLocalId 採用 | auto-recommended | 001§7.1, 002, 003 |
| D2 (R2) | 15秒 flush 経路 | App→ExecutionPage に SyncQueue 注入 | auto-recommended | 002§1, Phase3 |
| D3 (R1) | StrictMode 冪等 | 純関数 decideRecovery + put 冪等 finalize + interval 解除 | auto-recommended | 001§7.1, 003 |
| D4 (R3) | 0秒放置の達成算入 | 有効経過>0 の item のみ done | auto-recommended | 001§7.1, 003 |
| D5 (R4) | 正本/マージ規則 | IndexedDB=構造正本、localStorage=heartbeat+fallback | auto-recommended | 001§2.4/§7.1 |
| D6 (R7) | 4H cap 適用範囲 | 表示 + 確定保存値の双方 | auto-recommended | 001§7.4, 003 |

## 5. 次のステップ
- 反映済み 001-003 を確認（`<!-- spec-review R{N} -->` 付与箇所）
- 残 Class C: SPEC [論点-001]（計時中 guest→Clerk リンク、推奨 A=移送せず guest で完了）— 実装着手前に最終確認可（未回答なら A）
- 準備ができたら `/flow:tdd execution R20260611-001` で実装着手（Phase1 4Hキャップ→Phase2 ハートビート/migration→Phase3 復元/自動終了）
<!-- auto-generated-end -->
