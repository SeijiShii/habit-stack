# execution 変更仕様書（セット全体の経過時間を計時画面に表示）

> **改修種別**: 機能拡張（UI 表示 + 派生計算の追加）
> **issue / slug**: R20260613-004 / set-total-time
> **基準 SPEC**: `../001_execution_SPEC.md`
> **最終更新**: 2026-06-13
> **タグ**: stateful（実行セッション）、offline-critical（タイムスタンプ差分計時）

---

## 1. 変更概要

計時画面（`ExecutionPage`）は現在「進行中アイテムの経過秒」のみを表示し、セッション全体（セットの開始から現在までに費やした合計時間）が分からない。振り返り画面（`SummaryOverviewPage`）はセット合計時間を既に表示しているので、**同じ『セット全体の経過時間』を計時画面にも追加表示**する。合計は全 execution_record の経過秒の総和（確定済み record は保存済み `elapsedSec`、進行中 record はライブ算出値）で求める。表記は振り返り画面と揃えるため `formatDuration` を流用する。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| 計時中表示 | 進行中アイテムの経過（mm:ss）+ 開始/現在時刻 | 左記 + **セット全体の経過時間**（全 record 合計） | セッション全体の所要が一目で分かる。振り返りとの一貫性 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `ExecutionPage` 計時中セクション | `current-item` / `elapsed` / `started-at` / `current-time` | 左記 + `set-elapsed`（セット合計、`formatDuration`） | 互換（表示追加） |
| 新規 `sessionElapsedSec(state, nowIso)` | なし | record 配列を合計するピュア関数（live 含む） | 新規（純追加） |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| （なし） | 既存 `execution_record.elapsed_sec` を集計するのみ。スキーマ変更なし | 不要 |

### 2.4 バリデーション・エラー変更
- 端末時計巻き戻し（負値）は既存 `cappedElapsedSec` のクランプ（0 下限・1活動 4H 上限）を流用し、合計も負やオーバーフローしない。

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `ExecutionPage.tsx` | 中 | 計時中セクションに合計表示を追加（直接対象） |
| `model/elapsed.ts`（or 新規） | 低 | `sessionElapsedSec` 追加 |
| 既存テスト `ExecutionPage.test.tsx` / `elapsed.test.ts` | 低 | 合計表示・合計算出のテスト追加 |
| `SummaryOverviewPage`（振り返り） | なし | 既存のセット合計表示は不変 |

## 4. 後方互換性

- **互換維持**: ✅（表示と派生計算の追加のみ。保存形式・契約に影響なし）
- 非互換変更なし。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅（UI + ピュア関数追加、DB 変更なし）

## 6. リリース戦略

- **方式**: 一括（低リスクな表示追加。フィーチャーフラグ不要）
- ロールアウト: 同日 UI 改修バッチ（R20260613-002/-003）と合わせて次回 release。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）
- 計時中（running / paused）に「セット全体の経過時間」を表示する。
- 合計 = Σ（各 record の経過秒）。
  - 終了済み record（`endedAt` あり）: 保存済み `elapsedSec`。
  - 進行中 record（最後の record）: `liveElapsed` と同じ算出（running は now 差分、paused は pause 時点で凍結）。
- 1 秒ごとの再描画（既存 tick）に追従してライブ更新される。
- `done` 状態では計時中セクション自体が出ないため合計表示も非表示（完了メッセージのみ）。done 後に合計を見せるかは UC 範囲外（振り返り画面で確認可能）。

### 7.2 入出力（新仕様）
- `sessionElapsedSec(state: ExecState, nowIso: () => string): number` — record を合計（live 含む）した秒。各 record に `cappedElapsedSec` を適用し、負値は 0 クランプ。
- 表示: `<p data-testid="set-elapsed">セット合計 {formatDuration(sessionElapsedSec(...))}</p>`（ラベル文言は design/wording で最終調整）。

### 7.3 データモデル（新仕様）
変更なし（既存 record を集計）。

### 7.4 バリデーション・エラー（新仕様）
- 各 record の `cappedElapsedSec`（0 下限 / 4H 上限）を流用。合計に上限は設けない（複数活動の総和は妥当に大きくなり得る）。

### 7.5 機能固有 NFR + 既存連携（新仕様）
- offline-critical: 生タイマー不使用のタイムスタンプ差分方式を維持。バックグラウンド/スリープ復帰後も合計が正確。
- 既存のハートビート保存・15 秒ごと backend flush（R20260611-001）には影響しない（表示専用の集計）。

## 8. タグ別追加項目
- **stateful**: 合計は `s.records` から導出する純関数。状態機械（executionMachine）の遷移は変更しない。
- **offline-critical**: now 差分のライブ算出のみ。永続値（保存済み elapsedSec）と整合。

## 9. 未決事項

> 現時点で論点なし (2026-06-13)。
> ラベル文言（「セット合計」等）と表記形式（`formatDuration` 流用）は design/wording 段階で最終確定（auto-pick、Class A）。done 後にセット合計を表示するかは本改修スコープ外（振り返り画面で代替可能）とする。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-13 | 初版作成 | /flow:revise |
