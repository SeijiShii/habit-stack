# execution 変更仕様書（計時中セッションの可視化と導線確立）

> **改修種別**: 機能改修（UI 導線の再設計 + 不変条件の明示。データ形状不変）
> **issue / slug**: R20260614-001 / running-session-visible-nav
> **基準 SPEC**: `../001_execution_SPEC.md`
> **最終更新**: 2026-06-14
> **タグ**: auth-required（owner-scoped）、stateful（進行中セッション）、offline-critical（local-first）

---

## 1. 変更概要

現状の起動導線は「セット詳細 →『実行する』→ `/run` ページで『開始』ボタン → 計時開始」という二段構えで冗長。さらに `ExecutionRepo.findInProgress` / `restoreInProgress` は **owner グローバル（setId 非依存）に単一の進行中セッション**を返す設計だが、UI 側がこの不変条件を活かせていない。結果として:

1. 計時中に他画面（一覧・振り返り等）へ移ると、進行中セッションを表示・停止・復帰する導線が一切無い（**幽霊セッション化**。永続データ上は running/paused のまま残る）。
2. 同じ／別のセットを重ねて「開始」でき、二重開始の危険がある。
3. 振り返り画面では自動終了判定等で「終了済みに見える」ことがあり挙動が紛らわしい。

本改修は **「グローバルに進行中セッションは高々 1 つ」を UI 全体の不変条件として明示**し、(a) セット詳細から「開始」ボタン一発で計時開始（中間ページ撤去）、(b) セット一覧に「進行中」バッジ + 進行中セットを選ぶと活動画面へ復帰、(c) 別セット進行中に `/run` 直叩きしても二重開始させず復帰導線を出す、という UI 導線のみを変更する。永続データ形状・`ExecState` 形状・状態機械の遷移は一切変えない（後方完全互換、migration 不要）。

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC-EX-START（起動） | セット詳細「実行する」(`Link to /run/:id`) → `/run` で中間「開始」ボタン → start | セット詳細「開始」ボタン → `/run/:id` 遷移 → 進行中なしなら **auto-start**（中間ゲート撤去） | 二段構えの冗長さ解消 |
| UC-EX-RESUME（復帰） | 進行中があっても一覧/詳細から復帰する導線が無い（幽霊化） | 一覧に「進行中」バッジ表示 + 当該セット選択で `/run/:id`（活動画面）へ復帰 | 計時中の不可視・停止不能を解消 |
| UC-EX-DOUBLE（二重開始防止） | 同/別セットを重ねて開始できる | 進行中セッションが他セットなら `/run/:otherSet` で二重開始させず復帰導線を提示 | 単一進行中の不変条件を UI で担保 |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| `App.tsx` SetDetailRoute (74-88) | `<Link to={/run/${set.id}}>実行する</Link>` + `<Link to={/summary/${set.id}}>継続を見る</Link>` | 「開始」ボタン（`navigate(/run/:id)`）+ 「継続を見る」link は維持 | 互換（導線変更） |
| `App.tsx` SetsRoute (64-72) | `SetListPage` に `repo` / `onOpenSet`（常に `/sets/:id`）を渡す | 追加で `inProgressSetId`（`repos.execution.findInProgress()` の setId）を渡し、`onOpenSet` は進行中セットなら `/run/:id`、他は `/sets/:id` | 互換（prop 追加） |
| `SetListPage.tsx` (14-19, 72-78) | `props = { repo, onOpenSet }`。各セットはボタンのみ | `props` に `inProgressSetId?: string` 追加。当該セットに「進行中」バッジ（`data-testid="in-progress-badge"`） | 互換（optional prop 追加） |
| `ExecutionPage.tsx` (99-117) | `if (!s) return <開始ボタン>`（中間ゲート） | 中間ゲート撤去。復元 settle 後に進行中なし → auto-start（fresh）。別セット進行中 → 復帰導線を表示 | 互換（内部分岐の変更） |
| `useExecution.ts` (46-74) | 復元 effect は found 時のみ state を set。settle 完了の可観測フラグなし | 復元 settle 済みフラグ（`settled`）を返す。settle 後に「進行中なし」を判定可能に | 互換（戻り値追加） |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `execution_session` / `execution_record` / `daily_achievement` | 変更なし。`ExecState` 形状・列も不変 | 不要 |
| 進行中セッションの単一性 | スキーマ変更なし（既に owner グローバル単一を `findInProgress` が前提）。UI 不変条件として明示するのみ | 不要 |

### 2.4 バリデーション・エラー変更
- 「別セットが進行中の状態で `/run/:otherSet` を開いた」場合は二重開始させず、`『{進行中セット名}』が進行中です` + 進行中セットへのリンクを表示（エラーではなくガイド表示）。
- アイテム 0 件のセットでの開始は既存挙動（`RunInner` の「先にアイテムを追加してください」）を維持。

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| `ExecutionPage.tsx` | 高 | 中間「開始」ゲート撤去・auto-start・別セット進行中の復帰導線（直接対象） |
| `useExecution.ts` | 高 | 復元 settle 済みフラグ追加（auto-start のトリガ） |
| `App.tsx` (SetsRoute / SetDetailRoute) | 中 | 一覧へ `inProgressSetId` 配線・詳細の「開始」ボタン化・遷移先分岐 |
| `SetListPage.tsx` (activity-sets) | 中 | 「進行中」バッジ + 当該セットの遷移先分岐 |
| `executionRepo.ts` | 低 | `findInProgress` を SetsRoute から呼ぶ（実装は不変。利用箇所追加のみ） |
| 既存テスト（中間「開始」ゲート前提） | 低 | auto-start 化に合わせ更新 |

## 4. 後方互換性

- **互換維持**: ✅（UI 導線のみ。永続データ形状・`ExecState` 形状・状態機械遷移・backend 契約に影響なし）
- 既存の進行中セッション（運用中端末に残るもの）も、本改修後はむしろ一覧バッジ + 復帰導線で**可視化・回収できるようになる**（既存データに不整合は生じない）。
- 非互換変更なし。

## 5. ロールバック方針

- **コード revert で完全復旧**: ✅（UI のみ、DB 変更なし、migration なし）。revert すれば従来の中間「開始」ページ導線に戻る。

## 6. リリース戦略

- **方式**: 一括（フィーチャーフラグ不要。導線の付け替えのみで低〜中リスク）。
- ロールアウト: 実装 + 単体/E2E green → `/flow:design` 視覚レビュー + `/flow:wording` 文言確定 → 次回 release バンドルに同梱。

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）

- **UC-EX-START（開始 / 中間ゲート撤去）**
  - セット詳細（`/sets/:id`）の「開始」ボタン押下で `/run/:id` へ遷移。
  - `/run/:id` 描画時、`useExecution` の復元 settle 完了を待つ。
    - settle 後 **進行中なし** → 当該セットを **auto-start（fresh）**（`exec.start(setId, items.map(i => i.id))` 相当）。
    - settle 後 **当該セット（同 setId）が進行中** → その state を復元して再開（破棄しない）。
    - settle 後 **別セット（setId 不一致）が進行中** → 二重開始しない。`『{進行中セット名}』が進行中です` + 進行中セットへのリンク（`/run/{進行中setId}`）を表示。
- **UC-EX-RESUME（一覧からの可視化・復帰）**
  - セット一覧（`/sets`）描画時、`repos.execution.findInProgress()` で進行中 setId を取得し `SetListPage` に渡す。
  - 進行中セットの行に「進行中」バッジを表示。
  - 行選択時: 進行中セットなら `/run/:id`（活動画面へ復帰）、それ以外なら `/sets/:id`（詳細）へ。

### 7.2 入出力（新仕様）

- `SetListPage` props: `{ repo, onOpenSet?, inProgressSetId?: string }`。`inProgressSetId === s.id` のとき「進行中」バッジ（`data-testid="in-progress-badge"`）を当該セット行に描画。
- `SetsRoute`: `repos.execution.findInProgress()` を `useQuery`（または同等）で取得し、`inProgressSetId = found?.setId`。`onOpenSet(id)` は `id === inProgressSetId ? navigate(/run/${id}) : navigate(/sets/${id})`。
- `useExecution` 戻り値: 既存に加えて復元 settle 済みフラグを公開（例: `settled: boolean`、`inProgressSetId: string | null`）。auto-start 判定は ExecutionPage 側で `settled && !state` を見て行う。
- `ExecutionPage`: `if (!s)` 中間ゲートを撤去。settle 前は読み込み表示、settle 後 `!s` なら auto-start を発火（1 回限り）。別セット進行中なら復帰導線セクションを描画。

### 7.3 データモデル（新仕様）

変更なし（既存 `execution_session` / `execution_record` を利用。`findInProgress` の owner グローバル単一前提を UI 不変条件として明示するのみ）。

### 7.4 バリデーション・エラー（新仕様）

- auto-start は **settle 完了かつ進行中なし**のときのみ（StrictMode 二重マウントでも 1 回。`useExecution` の `appliedRef` / start の冪等 put を踏襲）。
- 別セット進行中時は二重開始を禁止し、エラーではなく復帰ガイドを提示（破壊的操作を促さない）。

### 7.5 機能固有 NFR + 既存連携（新仕様）

- **auth-required / owner-scoped**: `findInProgress` は `getAllByOwner` で owner スコープ。一覧バッジ・auto-start も現 owner の進行中のみを対象。owner 切替時の終了は既存 `LoginEndGuard`（`/account` 遷移で `endInProgressNow`）を維持。
- **stateful**: 進行中セッションは owner グローバル単一。本改修はこの不変条件を UI に反映するだけで、状態機械（start/next/pause/resume/end）は不変。
- **offline-critical / local-first**: 進行中判定・復元は IndexedDB（local-sync）正本。ハートビート保存・15 秒 backend flush（R20260611-001）には影響しない。

## 8. タグ別追加項目

- **auth-required**: `inProgressSetId` は現 owner の進行中セッションのみから導出。他 owner のセッションは混在しない（`getAllByOwner`）。
- **stateful**: 「進行中は高々 1 つ」を UI の前提とし、一覧バッジ・auto-start・復帰導線すべてが単一進行中を指す。
- **offline-critical**: 一覧バッジ・復帰導線はオフラインでも local 正本から表示可能。ネットワーク不要。

## 9. 未決事項

> 現時点で論点なし (2026-06-14)。
> 別セット進行中時の `/run` 直叩きは「復帰導線で吸収」する方針で確定（二重開始禁止 / 既存進行中を破棄しない）。
> 「進行中」バッジの文言・スタイルは `/flow:design` + `/flow:wording` 段階で最終確定（auto-pick、Class A）。

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版作成 | /flow:revise |
