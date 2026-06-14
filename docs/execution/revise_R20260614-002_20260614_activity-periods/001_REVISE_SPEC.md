# execution 変更仕様書（活動を 1:N period モデルにして中断時間を経過から除外）

> **改修種別**: データモデル変更（経過計算の構造変更）+ UI 表示の妥協
> **issue / slug**: R20260614-002 / activity-periods
> **origin**: claim C20260614-001（pause したまま次活動へ移行すると中断時間が経過に混入）
> **基準 SPEC**: `../001_execution_SPEC.md`
> **最終更新**: 2026-06-14
> **タグ**: stateful（実行セッション）、offline-critical（local-first, IndexedDB 構造正本）

---

## 1. 変更概要

現在の `ItemExec` は計時を **単一の start/end ペア + `pausedTotalSec`（一時停止累計 1 個）** で表現する。`pausedTotalSec` は「同じ活動を再開（`resumeSame`）」したときにだけ加算されるため、**活動 A を一時停止したまま再開せず「次の活動へ」/「セット終了」した場合、中断区間（pause 開始〜切替時刻）が経過に混入する**（`pausedTotalSec=0` のまま `endCurrentItem` が `now − startedAt` を確定）。

本改修では、1 活動が **複数の計時区間 `periods`（1:N・無制限）を SoT として持つ** モデルへ変更する。pause は末尾の開いた period を閉じ、resume は新しい period を開き、終了時は開いた period があれば閉じる（無ければ何もしない）。これにより「pause したまま次へ」でも、開いていない区間（中断区間）が経過に含まれず**自然に除外**される。経過秒は各 period 長の総和（1 活動 4H 上限）で算出する。表示する開始時刻は煩雑さ回避のため **最初の period の開始時刻のみ** とする。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 中断（pause）→ 同じ活動を再開 | `resumeSame` で `pausedTotalSec += 中断秒`。経過から除外される（正） | `pause` で末尾 period を閉じ、`resume` で新 period を開く。閉じた区間外は計時されない（同等の結果） | period 区間方式に統一 |
| 中断（pause）→ **再開せず次の活動へ/終了** | `pausedTotalSec=0` のまま終了 → **中断区間が経過に混入（欠陥）** | pause で末尾 period が閉じたまま終了 → 開いた period が無いので**何も追加されず中断区間は経過に含まれない** | クレーム C20260614-001 の是正 |
| 何度も中断する | 中断累計は 1 個の `pausedTotalSec`。区間履歴は持たない | `periods` に区間が無制限に積まれる（1:N） | 多重中断を構造で表現 |
| 計時画面の開始時刻表示 | 現アイテムの `startedAt`（単一） | `periods[0].startedAt`（最初の開始時刻のみ。妥協） | period を全部出すと煩雑なため |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `ItemExec` | `{ itemId, startedAt, endedAt, elapsedSec, pausedTotalSec, note }` | 左記 + `periods: { startedAt: string; endedAt: string \| null }[]`（SoT）。`startedAt`/`endedAt` は派生（`periods[0].startedAt` / 末尾 period の `endedAt`）として維持 | 後方互換（periods は additive、派生フィールド維持） |
| `elapsed.ts` | `elapsedSec` / `cappedElapsedSec` / `diffSec` / `sessionElapsedSec` | 左記維持 + `periodsElapsedSec(periods, openEnd)` を追加。`sessionElapsedSec` は periods があれば periods から、無ければ従来式（後方互換） | 後方互換（純追加 + 分岐） |
| `ExecutionPage` 計時中表示 | 開始時刻 = 現アイテム `startedAt` / `liveElapsed` は `startedAt`+`pausedTotalSec` ベース | 開始時刻 = `periods[0].startedAt` / `liveElapsed` は periods ベース | 互換（同画面・表示同等） |
| `executionRepo` persist/restore | `startedAt/endedAt/elapsedSec/pausedTotalSec` を保存・復元 | 左記 + `periods` を保存・復元。periods 欠落の legacy は `[{startedAt, endedAt}]` を合成 | 後方互換 |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `ItemExec`（ドメイン） | `periods: {startedAt; endedAt\|null}[]` を SoT として追加。`startedAt`/`endedAt`/`pausedTotalSec` は派生・互換のため残置（`pausedTotalSec` は vestigial、経過計算には使わない） | 不要（ランタイム・additive） |
| IndexedDB `execution_record` | `periods`（JSON 配列）を保持。**IndexedDB が構造正本** | 不要（読み取り時に periods 欠落なら合成、保存済み `elapsedSec` を信頼） |
| backend `execution_records`（Postgres / Neon） | 任意で `periods jsonb` 列を additive 追加（`db/schema.ts` + drizzle migration）。IndexedDB が正本のため必須ではない | **任意**（additive・オンライン・ダウンタイム不要） |

### 2.4 バリデーション・エラー変更
- 端末時計巻き戻し（負値区間）は各 period に既存 `diffSec`（0 下限）を適用し、合計も負にならない。
- 1 活動の経過は `MAX_ACTIVITY_SEC = 4H` で上限クランプ（既存 `cappedElapsedSec` の上限を periods 合計にも適用）。
- 開いた period が無い状態（paused）での終了は no-op（区間を追加しない）→ 中断区間が除外される。

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `model/executionMachine.ts` | 高 | `ItemExec.periods` 追加、`newRec`/`pause`/`resumeSame`/`endCurrentItem`/`nextItem`/`endSession`/`startSession` を period 操作に変更（直接対象） |
| `model/elapsed.ts` | 中 | `periodsElapsedSec` 追加、`sessionElapsedSec` を periods 対応（後方互換分岐） |
| `model/executionRepo.ts` | 中 | persist で `periods` 保存、`restoreInProgress` で periods 復元 + legacy 合成 |
| `ExecutionPage.tsx` | 中 | `liveElapsed` を periods ベースに、開始時刻表示を `periods[0].startedAt` に |
| 既存テスト（machine/elapsed/ExecutionPage/repo/recovery） | 中 | pausedTotalSec を断定する N3 等を periods 断定に更新 + trailing-pause 除外の追加 |
| `db/schema.ts`（backend periods 列） | 低 | 任意の additive 列追加（必須ではない） |
| `summaryRepo`（振り返り集計） | なし | 集計は確定 `elapsedSec` を使うため形状不変（履歴合計が改修前後で不変） |

## 4. 後方互換性

- **互換維持**: ✅
  - `periods` は **additive**。既存の `startedAt`/`endedAt`/`elapsedSec`/`pausedTotalSec` は派生フィールドとして残す（persist/restore・集計形状を維持）。
  - **既存完了レコードは保存済み `elapsedSec` を信頼し、履歴を遡及補正しない**（過去の値は不変）。
  - **legacy レコード復元時**: `periods` が欠落していれば `[{ startedAt, endedAt }]`（単一区間）を合成し、`elapsedSec` は保存値を信頼。
- 非互換変更なし（経過計算は periods があれば periods、無ければ従来式へフォールバック）。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅。`periods` 列は additive なので、列が残ってもアプリは無害（旧コードは periods を読まない）。
- backend periods 列を追加した場合も DROP は任意（nullable jsonb 残置で無害）。

## 6. リリース戦略

- **方式**: 一括（フィーチャーフラグ不要）。periods は additive で旧データと共存可能。
- ロールアウト: 単体 green → `/flow:e2e` → 実機目視（pause→次活動で中断時間が経過に入らないことを確認）→ 次回 release。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
- `startSession` / 次活動開始: 現アイテムの `periods = [{ startedAt: now, endedAt: null }]`（開いた period 1 本）。
- `pause`: `status=paused`。末尾の開いた period を `endedAt=now` で閉じる（→ 開いた period が無い＝計時凍結）。
- `resumeSame`（同じ活動を再開）: 新 period `{ startedAt: now, endedAt: null }` を push（`status=running`）。
- `endCurrentItem` / `endSession`: 開いた period があれば `now` で閉じる。paused（開いた period なし）なら**何も追加しない** → 中断時間が自然に除外される。
- `nextItem`: `endCurrentItem`（上記）してから次 record（新 periods）。
- 表示開始時刻 = `periods[0].startedAt`（最初の開始時刻のみ。period を全部表示しない妥協）。

### 7.2 入出力（新仕様）
- `periodsElapsedSec(periods, openEnd): number` — `Σ diffSec(p.startedAt, p.endedAt ?? openEnd)` を `MAX_ACTIVITY_SEC` で上限クランプ。`openEnd` は running 中は `now`、paused 中は末尾が既に閉じているため openEnd は使われない。
- `elapsedSec = min(Σ diffSec(period.startedAt, period.endedAt ?? openEnd), MAX_ACTIVITY_SEC)`。
- `sessionElapsedSec(state, now)`: record が `periods` を持てば `periodsElapsedSec`（進行中は openEnd=now）で合算、無ければ従来の `startedAt/endedAt/pausedTotalSec` 経路（後方互換）。

### 7.3 データモデル（新仕様）
```ts
interface ItemExec {
  itemId: string;
  startedAt: string;          // 派生 = periods[0].startedAt（互換・persist 用）
  endedAt: string | null;     // 派生 = 末尾 period の endedAt（互換・persist 用）
  elapsedSec: number;         // 確定経過（periods 合計の確定値）
  pausedTotalSec: number;     // vestigial（互換のため残置、経過計算に未使用）
  note: string;
  periods: { startedAt: string; endedAt: string | null }[]; // SoT・1:N・無制限
}
```

### 7.4 バリデーション・エラー（新仕様）
- 各 period は `diffSec`（0 下限）。合計は `MAX_ACTIVITY_SEC`（4H）で上限クランプ。
- 開いた period が複数同時に存在しない不変条件（pause で閉じ、resume で 1 本だけ開く）。
- paused での終了は区間を追加しない（中断除外）。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- offline-critical: 生タイマー不使用のタイムスタンプ差分方式を維持。バックグラウンド/スリープ復帰後も periods から経過が正確に再導出される。
- IndexedDB を構造正本とし、periods を損失なく persist/restore する（R20260611-001 の永続・復帰方針を継承）。
- 既存のハートビート保存・15 秒ごと backend flush には影響しない（periods を含む state を従来どおり保存）。

## 8. タグ別追加項目
- **stateful**: periods は状態機械（executionMachine）の遷移で更新する。経過は periods からの純導出。
- **offline-critical**: now 差分のライブ算出のみ。永続値（保存済み elapsedSec）と periods 由来の再導出が整合。legacy は単一区間合成でフォールバック。

## 9. 未決事項

> 現時点で論点なし（2026-06-14）。
> backend `execution_records.periods jsonb` 列の追加は **任意**（IndexedDB が構造正本のため、未追加でも実害なし）。`pausedTotalSec` は互換のため残置するが経過計算には使わない（vestigial、将来の cleanup 候補）。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版作成（claim C20260614-001 起点） | /flow:revise |
