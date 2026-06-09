# 修正計画: 計時中の経過時間が 00:00 のまま進まない + 開始/現在時刻表示

> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, `src/features/execution/ExecutionPage.tsx` ほか
> **最終更新**: 2026-06-10

---

## 1. 修正対象ファイル

| ファイル | 修正内容 | before 抜粋 | after 抜粋（方針） |
|---|---|---|---|
| `src/features/execution/ExecutionPage.tsx` | 計時中の経過をライブ導出 + 1 秒ごとの表示専用 tick + 開始/現在時刻の併記表示 | `<p data-testid="elapsed">{mmss(currentRec.elapsedSec)}</p>` | 下記 §1.1 参照 |

> 修正は **表示層（ExecutionPage）に限定**。`executionMachine` / `useExecution` / `elapsed` の記録ロジックは変更しない（記録は正しいため）。`elapsedSec(startedAt, endedAt, pausedTotalSec)` を表示用の導出にも再利用する。

### 1.1 ExecutionPage.tsx の after 方針（実装は /flow:tdd）

```tsx
// 既存 import に追加
import { useEffect, useState } from "react";
import { elapsedSec } from "./model/elapsed.js"; // 表示用に再利用

// now を ISO 文字列で返す既存 prop を利用（テスト注入可能）
const nowIso = now ?? (() => new Date().toISOString());

// 表示専用の tick（記録には影響しない＝生タイマー方式は維持）
const [, setTick] = useState(0);
useEffect(() => {
  if (s?.status !== "running") return;            // running 中だけ秒更新
  const id = setInterval(() => setTick((t) => t + 1), 1000);
  return () => clearInterval(id);
}, [s?.status]);

// 計時中の経過をライブ導出
function liveElapsedSec(rec: ItemExec, status: ExecStatus): number {
  if (rec.endedAt) return rec.elapsedSec;                          // 確定済み
  if (status === "paused")                                        // 一時停止は凍結
    return elapsedSec(rec.startedAt, s.pauseStartedAt ?? nowIso(), rec.pausedTotalSec);
  return elapsedSec(rec.startedAt, nowIso(), rec.pausedTotalSec);  // running はライブ
}

// 時刻表示ヘルパ（HH:MM:SS, ローカル時刻）
function hhmmss(iso: string): string {
  const d = new Date(iso);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0")).join(":");
}
```

表示（計時中セクション内）:
```tsx
<p data-testid="elapsed">{mmss(liveElapsedSec(currentRec, s.status))}</p>
<p data-testid="started-at">開始 {hhmmss(currentRec.startedAt)}</p>
<p data-testid="current-time">現在 {hhmmss(nowIso())}</p>
```

> 文言は周辺の既存ハードコード日本語スタイルに合わせる（本 PJ は i18n カタログ不使用）。design-system のボイス&コピーに沿った簡潔表記（「開始 hh:mm:ss」「現在 hh:mm:ss」「経過 mm:ss」）。ラベルの最終文言は /flow:tdd 実装時に確定（必要なら /flow:wording で校正）。

## 2. 修正範囲の限定方針
- **根本原因（表示層が保存値を読む + tick 不在）のみ修正**。記録ロジック（machine/elapsed/repo）は副作用回避のため触らない。
- 理由: 記録は正確に動作しており、バグは表示層に限局。記録に手を入れると「生タイマー不使用」の正確性保証（背景化/スリープ耐性）を毀損するリスクがある。

## 3. 副作用なき確認方法
- 既存テスト維持: `ExecutionPage.test.tsx`（開始→次へ→終了→達成記録 / メモ入力）、`executionMachine.test.ts`、`executionRepo.test.ts` を全て維持（記録ロジック不変のため壊れない想定）。
- 追加テスト: `003_REGRESSION_TEST.md` 参照（fake timers + 注入 now で計時中の経過変化・凍結・時刻表示を検証）。
- 手動確認項目:
  1. 開始後、経過時間が 1 秒ごとに増える。
  2. 一時停止中は経過が止まる（凍結）。再開で続きから増える。
  3. 開始時刻・現在時刻が表示され、現在時刻が更新される。
  4. 終了後の記録値が従来どおり正しい（達成記録も従来どおり）。
  5. 端末時計を戻しても負値にならず 0 クランプ（既存 elapsed.ts の挙動）。

## 4. リリース戦略
- 方式: 通常リリース（段階展開不要）。
- 理由: severity=medium、表示層のみの修正でデータ・記録に影響なし。
- フラグ: 不要。
- 展開計画: main マージ → 通常デプロイ。

## 5. ロールバック方針
- コード revert で戻せる: ✅（ExecutionPage.tsx の単一コミット revert で復旧）
- DB ロールバック: 無（スキーマ・データ不変）
- 手順: 該当コミットを `git revert`。

## 6. 関係者通知
- 通知先: オーナー（seiji）。
- 通知タイミング: 修正完了後（UX 改善の告知任意）。

## 7. DoD
- [ ] 計時中、経過時間が秒単位で増える（再現テストで before:固定 / after:増加 を検証）
- [ ] 一時停止中は経過が凍結し、再開で継続する
- [ ] 開始時刻・現在時刻が計時中に表示される
- [ ] 003 REGRESSION_TEST 全成功
- [ ] 既存テスト（ExecutionPage / machine / repo）破壊なし
- [ ] `/flow:spec-review` 通過（実装前ゲート）

## 8. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-10 | 初版 | /flow:fix |
