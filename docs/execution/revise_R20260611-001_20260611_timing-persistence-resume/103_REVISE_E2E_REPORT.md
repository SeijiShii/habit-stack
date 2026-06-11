# execution E2E 実行レポート（計時状態の永続化・復帰 + 4H放置キャップ）

> **入力**: `./004_REVISE_E2E_TEST.md`, `./101_REVISE_IMPL_REPORT.md`, `./905_REVISE_SPEC_REVIEW.md`
> **実行日時**: 2026-06-11（JST）
> **実行者**: /flow:e2e（/flow:auto P4.5 E2E gate 経由）
> **環境**: Playwright 1.60 + Chromium / ローカル headless（実キー不要 = ローカルゲスト owner、local-first）= Class A
> **対象 spec**: `e2e/timing-persistence.spec.ts`（新規 3 本）+ `e2e/core-journey.spec.ts`（既存リグレッション）

---

## 1. 実行結果サマリ

| spec | 結果 |
|---|---|
| `e2e/timing-persistence.spec.ts`（3 本） | ✅ 3 passed |
| `e2e/core-journey.spec.ts`（3 本） | ✅ 3 passed |
| **合計** | **✅ 6 passed (7.2s)** |
| unit（回帰確認） | ✅ 167 passed |
| typecheck（`tsc --noEmit`） | ✅ clean |

---

## 2. 実装したシナリオと 004 計画の対応

ローカル headless（実ブラウザ）で堅牢に検証できるユーザージャーニーを実装。時刻依存（now 注入が必須）の
4H 放置自動終了 / 4H キャップ / 15秒 push は **unit（now 注入）で網羅済み**のため E2E からは意図的に除外（004 §4 環境要件差分に整合）。

| E2E test | 004 シナリオ ID | 検証内容 | 結果 |
|---|---|---|---|
| E-RESUME | E-RESUME-01/02 | 2活動目を計時中にリロード → 「開始」に戻らず `current-item=英単語` で計時継続復元 | ✅ |
| E-LOGIN | E-LOGIN-01 | 計時中に `/account`（ログイン画面）へ遷移 → セッション終了。`/run` 復帰で resume せず「開始」状態 | ✅ |
| E-SUMMARY | E-LOGIN-02 | 計時中に `/summary/:setId`（ふりかえり）へ遷移 → **終了しない**。`/run` 復帰で計時継続 | ✅ |
| E-REG-01 | core-journey | 開始→次の活動へ→セット終了 の既存フロー不変 | ✅ |

### unit へ委譲したシナリオ（E2E 非実装の理由明示）
| 004 シナリオ | 委譲先 | 理由 |
|---|---|---|
| E-IDLE-01/02（4H 放置自動終了 / 境界 3H59m） | `recovery.test.ts` / `ExecutionPage.test.tsx`（now 注入） | gap 4H 境界は決定的時刻注入が必須。実ブラウザの実時間では検証不能 |
| E-CAP-01（4H 表示キャップ） | `elapsed.test.ts`（`cappedElapsedSec`） | 5H seed の決定的検証は純関数 unit が確実 |
| E-PERSIST-01（15秒 backend push） | `ExecutionPage.test.tsx`（tick 注入） | 実 push driver は SyncQueue の App マウント（既存ギャップ、D20260611-022）依存。outbox 投入までを unit で確認 |

---

## 3. E2E ゲートが検出した本番バグ（重要）

E2E 実行により、**unit では緑だが本番（StrictMode 下の実ブラウザ）では復元が一切効かない**致命バグを検出・修正した。

### 症状
E-RESUME / E-SUMMARY が赤。リロード後に計時画面が「開始」ボタンに戻り、進行中セッションが復元されない
（IndexedDB には `status=running` のセッションが正しく永続されているのに画面へ反映されない）。

### 根本原因（D20260611-025）
`useExecution` のマウント復元 effect が **React StrictMode の二重マウントと競合**:

1. 旧実装は `restoredRef` を effect 冒頭で**同期的に** `true` にして「start を gate」していた。
2. StrictMode 一度目マウント: `restoredRef=true` にして async 開始 → cleanup が `cancelled=true`。
3. StrictMode 二度目（実）マウント: `restoredRef` が既に `true` のため **effect が早期 return** → 復元 async が起動しない。
4. 結果: 一度目の async は `cancelled` で中断、二度目は起動せず → `setState(found.state)` が**永遠に呼ばれない**。

unit テストは StrictMode 無しで `render()` するため effect が 1 回だけ走り復元が適用される → **緑のまま本番バグを隠蔽**していた
（P83「StrictMode × storage」の実発現）。

### 修正
`restoredRef`（同期 gate）を廃止し、`appliedRef` を **async 内（`cancelled` 判定の後）**で立てる方式へ変更:
- 一度目マウントの async は cleanup の `cancelled` で中断（`appliedRef` 不変）。
- 二度目マウントの async が `appliedRef` を立てて 1 度だけ適用。
- `decideRecovery` は純関数、finalize は冪等 put のため二重実行に安全。

`src/features/execution/hooks/useExecution.ts`。修正後 E2E 6/6 緑、unit 167 緑、typecheck clean。

---

## 4. 副次的に解消したドリフト

| 事象 | 対応 |
|---|---|
| `core-journey.spec.ts` の完了文言アサートが旧 `やれました` のまま（wording 校正 commit 24527d5 で `おつかれさまでした。今日もひとつ、できました。` へ軟化済み、テスト未追従） | アサートを `できました` の部分一致へ更新（本改修と無関係の既存ドリフト） |

---

## 5. 残課題・既知の制約

- **15秒 backend push の実 push cadence** は SyncQueue の App マウント（既存ギャップ、D20260611-022）に依存。本改修は outbox 投入まで。E2E は実 push を観測しない（unit で outbox 投入を確認）。
- 4H 放置 / キャップ / 15秒 push は時刻依存のため E2E 非対象（unit 網羅）。実時間での網羅は将来 `clock` API 注入の E2E を検討可。

---

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-11 | 初版作成（6/6 E2E green、StrictMode 復元バグ検出・修正 D20260611-025） | /flow:e2e |
