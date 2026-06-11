# execution 変更仕様書（計時状態の永続化・復帰 + 4H放置キャップ）

> **改修種別**: 機能拡張（耐障害性 + データ保全）
> **issue / slug**: R20260611-001 / timing-persistence-resume
> **基準 SPEC**: `../001_execution_SPEC.md`
> **最終更新**: 2026-06-11
> **タグ**: stateful, offline-critical, auth-required

---

## 1. 変更概要

計時中（running / paused）のセット・活動が **タブ切替・端末スリープ後のリロードで失われる** 体験を解消する。account-scoped で **localStorage を毎秒 / バックエンドを 15 秒ごと** に永続化（ハートビート）し、**マウント時に進行中セッションを復元**する。あわせて「口が開いたまま」放置（計時開始のまま離脱）対策として **1活動の最大時間を 4H にキャップ**し、**復帰時に最終保存時刻から 4H 経過していれば、その保存時刻で活動・セットを終了**する。

### 1.0 前提の再確認（重要 — 真因の分解）

報告された「リロードでデータが消える」は、コード調査の結果 **データは IndexedDB に保存済み**であり、額面通りではない:

| 観測 | 実態 |
|---|---|
| `ExecutionRepo.persist()` | 遷移ごと（start/next/pause/resume/end）に session + records を IndexedDB へ保存済み。account-scoped（ownerId）。 |
| 経過時間の算出 | `elapsedSec(startedAt, now, pausedSec)` のタイムスタンプ差分（生タイマー不使用）。`startedAt` が残れば**リロード後も経過は正しく復元可能**。 |
| **真因 (1)** | **復元が未配線**。`App.tsx:110` が毎レンダーで `sessionLocalId` を採番、`useExecution` は初期 `state=null` で `findInProgress()`（実装済み・未使用）を呼ばない → UI に戻らない。 |
| **真因 (2)** | **定期バックエンド push が不在**。`useSync` はマウント時 / `online` イベントのみ（`setInterval` なし）→ 進行中セッションが 15 秒ごとに同期されない。 |

本改修は **真因(1)(2) の修復** + **毎秒/15秒ハートビート** + **4H キャップ/復帰終了** を行う。substrate は既存 IndexedDB を維持しつつ localStorage を足す **ハイブリッド**（[D20260611-003]）。

---

## 2. 変更前 vs 変更後

### 2.1 UC 変更
| UC ID | 変更前 | 変更後 | 理由 |
|---|---|---|---|
| UC-EX-RESUME（復帰） | リロードで `state=null` に戻り、計時画面が「開始」ボタンに戻る（進行が消えたように見える） | マウント時に進行中セッションを復元し、計時を継続表示。経過は `startedAt` から再算出（4Hキャップ適用） | 真因(1)の修復 |
| UC-EX-IDLE（放置）新規 | 放置後リロードで `now-startedAt` がそのまま経過になり数時間〜数日に膨張 | `gap=now-lastSavedAt >= 4H` なら `lastSavedAt` で活動・セットを自動終了（status=done、達成記録）。`< 4H` なら継続復元（ただし1活動は 4H クランプ） | 「口が開いたまま」対策 |
| UC-EX-RUN（計時中） | 永続は遷移時のみ（次の同期は mount/online 依存） | 計時中は毎秒 localStorage / 15秒 backend にハートビート + スナップショット | データ保全（真因(2)） |

### 2.2 入出力変更
| 対象 | 変更前 | 変更後 | 互換性 |
|---|---|---|---|
| localStorage | guest-id のみ（`localGuest.ts`） | 追加: `hs:exec:hb:<ownerId>` = `{ sessionLocalId, lastSavedAt, snapshot }`（毎秒更新、owner 別 namespace） | 互換（新規キー、既存に無影響） |
| backend `execution_sessions` | `last_saved_at` 列なし | `last_saved_at timestamp NULL` 追加。進行中は15秒ごとに更新 | 互換（additive nullable、§005 MIGRATION） |
| sync push payload | session に lastSavedAt なし | session payload に `lastSavedAt` 含む（`{...payload}` 透過で server upsert に自動反映） | 互換（旧クライアントは欠落=NULL） |
| ExecutionPage 表示 | `liveElapsed` 上限なし | 1活動の表示・確定経過を `min(elapsed, 4H)` にクランプ | 互換（4H未満は不変） |

### 2.3 データモデル変更
| エンティティ | 変更内容 | マイグレーション要否 |
|---|---|---|
| `executionSessions`（db/schema.ts） | `lastSavedAt` (`last_saved_at` timestamp, nullable) 追加 | **要**（§005、additive） |
| LocalRecord（execution_session, IndexedDB） | session レコードに `lastSavedAt` フィールド追加 | 不要（スキーマレス、欠落許容） |
| localStorage ハートビート（新規） | `hs:exec:hb:<ownerId>` JSON | 不要 |
| ExecState（executionMachine） | **変更しない**（ハートビートは遷移でなく状態機械の外で扱う、純粋性維持） | 不要 |

### 2.4 バリデーション・エラー変更
| 対象 | 変更前 | 変更後 |
|---|---|---|
| 経過秒の上限 | なし（端末時計巻き戻しの 0 クランプのみ） | 1活動 `MAX_ACTIVITY_SEC = 14400`（4H）で上限クランプ |
| 復元時の不整合 | 該当なし | `lastSavedAt` 欠落時は `session.updatedAt` → current item `startedAt` の順でフォールバック。**ExecState の構造正本は IndexedDB**（full records 保持）。localStorage は `lastSavedAt` と IndexedDB miss 時のフォールバックのみ。フィールド単位マージはしない（`<!-- spec-review R4 -->`、P5 リスク低減）。`lastSavedAt` は両ソースの新しい方を採用 |
| owner 不一致 | 該当なし | localStorage ハートビートの owner が現在の `ownerId` と異なる場合は無視（別アカウントのデータを復元しない） |

---

## 3. 影響範囲

| 対象 | 影響度 | 説明 |
|---|---|---|
| 機能 execution | 高 | 直接対象（hook / page / repo / elapsed / machine 周辺） |
| 横断 _shared/local-sync | 中 | session レコードに lastSavedAt 追加、push が透過反映。定期 flush 起動点の追加 |
| 横断 _shared/db | 中 | schema 列追加 + migration |
| 横断 _shared/auth | 低〜中 | ownerId 別 namespace。guest→Clerk リンク時の進行中セッション扱い（§7.5 エッジ） |
| 機能 streak-summary | 低 | 自動終了で達成記録が増えうる（達成定義は穴あき許容で既存と整合） |

---

## 4. 後方互換性

- **互換維持**: ✅（[D20260611-004]）
- `last_saved_at` は nullable additive 列。既存セッション行・既存達成データに無影響。
- 旧クライアントは `lastSavedAt` を送らない → NULL のまま（復元フォールバックが吸収）。
- clientLocalId ベースの冪等 upsert は不変。

## 5. ロールバック方針

- **コード revert で戻せる**: ✅（[D20260611-007]）
- **DB マイグレーションのロールバック**: 任意（`last_saved_at` 列は残置しても無害。down は `DROP COLUMN`、§005）。
- **手順**: コードを revert すれば旧挙動（復元未配線）に戻る。列は NULL のまま放置で安全。

## 6. リリース戦略

- **方式**: 一括（[D20260611-005]）。フィーチャーフラグ不要。
- **理由**: 破壊的な UI/契約変更なし。復元・キャップは改善方向。
- **ロールアウト**: (1) migration 適用（additive、ダウンタイム不要）→ (2) アプリデプロイ → (3) スモーク（計時→リロード復元 / 放置4H終了）。

---

## 7. 詳細仕様（新仕様）

### 7.1 詳細 UC（新仕様）

#### UC-EX-RUN: 計時中の継続永続（毎秒/15秒）
- 計時中（running または paused）の間、`ExecutionPage` の 1秒インターバル（既存）で:
  1. **毎秒**: localStorage `hs:exec:hb:<ownerId>` に `{ sessionLocalId, lastSavedAt: now, snapshot: ExecState }` を書く（同期・軽量）。
  2. **15秒ごと**（1秒tickのうち15回に1回 or 別カウンタ）: session レコードを `lastSavedAt=now` 付きで `repo.persist` 再保存（IndexedDB + outbox 積み）し、`syncQueue.push()` を非ブロッキングで起動。
- paused 中も `lastSavedAt` は更新する（放置検知のため「生存」を刻む）。経過自体は pause 凍結のまま（既存 `liveElapsed`）。

#### UC-EX-RESUME: マウント時の復元
- `ExecutionPage`/`useExecution` の初期化で復元を試行（**ライブ描画前に確定**、暴走数値のフラッシュ防止）:
  1. IndexedDB `findInProgress()`（status != done）+ localStorage ハートビート（owner 一致時のみ）を読む。
  2. **復元後の永続 id は、見つかった session レコード自身の `clientLocalId` を採用する**（`App.tsx` が再計算する日付スタンプ id ではなく）。理由: `sessionLocalId = sess-<setId>-<YYYY-MM-DD>` は日付を含むため、23:30 開始→翌 00:30 復帰で id が変わる。`findInProgress` は owner 単位で非 done を返し id を無視するため、再計算 id で hydrate すると **別 id で重複 session が生成**される。→ found レコードの id を `useExecution` の `sessionLocalId` として渡す（`<!-- spec-review R6 -->`）。
  3. ExecState の構造的正本は **IndexedDB**（full records 保持）。localStorage は `lastSavedAt`（ハートビート）と IndexedDB miss 時のフォールバック snapshot のみに使う。**フィールド単位マージはしない**（§2.4、`<!-- spec-review R4 -->`）。owner 不一致の localStorage は破棄。
  4. `gap = now - lastSavedAt` を算出し UC-EX-IDLE 判定へ。
  5. 終了不要なら ExecState を `useExecution` に hydrate し計時継続（経過は `startedAt` 起点で再算出 + 4Hクランプ）。

#### UC-EX-IDLE: 放置の自動終了（4H）
- 復元時、**計時中の活動があり** かつ `gap = now - lastSavedAt >= 14400 秒(4H)` の場合:
  - current item を `endedAt = lastSavedAt` で終了（`endCurrentItem(state, lastSavedAt)` 相当）。記録される `elapsedSec` は §7.4 R1 で 4H クランプ済み。
  - session を `endSession(state, lastSavedAt)` で `status=done, endedAt=lastSavedAt` に。
  - 達成記録: **`endedAt = lastSavedAt` でクランプ後の有効経過が 0 秒より大きい item のみ done と数える**（`<!-- spec-review R3 -->`）。理由: 「開始直後に放置」の場合 `lastSavedAt ≈ startedAt` で実経過 ~0 → 0 秒の達成を継続(streak)に算入すると罪悪感回避の設計意図（concept 論点-001）に反する。実際に手をつけた（>0 秒）セッションのみ achieved=true。
  - 永続（IndexedDB + outbox）+ push。UI は完了状態（サマリ導線）を表示し、ライブタイマーは出さない。
  - **冪等性**: 自動終了の finalize は clientLocalId 由来 id の put 上書きで冪等。React StrictMode の二重マウント／復元の再実行でも結果は同一（`<!-- spec-review R1 -->`）。`decideRecovery` は純関数、副作用（persist/push）は init 1 回に限定し unmount で interval を解除する。
- `gap < 4H` の場合は終了せず継続復元。ただし R1 キャップは常時適用。

#### UC-EX-LOGIN-END: ログイン画面遷移での自動終了（論点-001 解決、`<!-- spec-review R8 -->`）
- 計時中（running / paused）に **ログイン／アカウント画面（`/account`）へ遷移**した場合、**遷移前に現在のセッションを終了**する（`endSession(state, now)` → status=done、達成記録は §7.1 R3 準拠で有効経過>0 の item のみ）。永続（IndexedDB + outbox）+ push。
- **適用範囲はログイン画面遷移に限定**: サマリ／ふりかえり（`/summary`, `/summary/:setId`）やセット一覧（`/sets`）等への遷移では**終了しない**（計時継続。ExecutionPage は unmount で heartbeat interval が止まるだけで、IndexedDB の running session は保持され、`/run` 復帰時に UC-EX-RESUME で継続復元）。
- **設計上の効果**: owner 切替（guest→Clerk リンク／サインアウト）はすべて `/account` 画面で発生するため、ログイン前にセッションが done 化される → **owner 変更を跨ぐ進行中セッションが構造的に発生しない**。これにより [論点-001] の移送是非・P89/P90 の owner 競合が原理的に消える。リンクは既存フロー（C20260609-002、`linkWithGoogle` は同一 owner id 維持）が担う。
- **トリガ実装**: 計時中に遷移先が `/account` の場合に終了させるナビゲーションガード（実装シームは 002 PLAN）。ログイン画面が将来 `/account` から分離された場合は、その login 入口に追従する。

### 7.2 入出力（新仕様）

#### localStorage ハートビート（新規）
```
key:   hs:exec:hb:<ownerId>
value: {
  "sessionLocalId": "sess-<setId>-<YYYY-MM-DD>",
  "lastSavedAt": "<ISO8601>",
  "snapshot": ExecState   // setId,status,index,itemIds,startedAt,endedAt,records[],pauseStartedAt
}
```
- 書込: 計時中の毎秒。読込: マウント時。owner 別 namespace でアカウント分離。
- セッション終了（done）時にキー削除（または lastSavedAt のみ残し snapshot を null）。

#### backend `execution_sessions.last_saved_at`
- 進行中: 15秒ごとに `now` で更新。done 遷移時にも更新。
- pull 時は `changesSince` が行全体を返すため自動で伝播。

### 7.3 データモデル（新仕様）

#### `db/schema.ts` executionSessions（追加列）
```ts
lastSavedAt: ts("last_saved_at"),   // nullable。進行中セッションの最終生存時刻（ハートビート）
```

#### 定数
```ts
export const MAX_ACTIVITY_SEC = 4 * 60 * 60; // 14400 = 4H。1活動の経過上限
```

### 7.4 バリデーション・エラー（新仕様）
- **R1 キャップ**: 表示 `liveElapsed` と確定 `elapsedSec` の双方で `min(value, MAX_ACTIVITY_SEC)`。
- **R2 自動終了**: §7.1 UC-EX-IDLE。
- **フォールバック**: `lastSavedAt` 欠落 → `session.updatedAt` → current item `startedAt`。
- **owner 不一致**: localStorage ハートビートの owner ≠ 現 ownerId → 無視（復元しない）。
- **時計巻き戻し**: 既存 0 クランプ（`elapsedSec`）を維持。`gap < 0` は 0 とみなし終了しない。

### 7.5 機能固有 NFR + 既存連携（新仕様）

- **offline-critical**: localStorage / IndexedDB はオフラインでも機能。15秒 push は失敗時 outbox 保持で next-online 再送（既存）。
- **auth-required / account scope**: 全永続キーは `ownerId` scope（localStorage namespace + IndexedDB getAllByOwner + RLS）。
- **stateful**: 復元は冪等（clientLocalId 由来 id、再 put 上書き）。
- **エッジ — アカウント切替/リンク**（depends_on C20260609-002、[論点-001] 解決済）:
  - **計時中のログイン画面遷移は UC-EX-LOGIN-END でセッション終了**されるため、owner 変更時点で進行中セッションは存在しない（移送問題が原理的に発生しない）。
  - 別アカウントへ切替後: 新 ownerId の localStorage キーを参照（旧 owner の snapshot は owner 不一致で無視）。
  - 万一 owner 不一致の進行中レコードが残った場合も、復元は owner scope（getAllByOwner / localStorage namespace）で他 owner のデータを拾わない（多重防御）。
- **background throttling**: ブラウザは非アクティブタブの `setInterval` を最低 1/分に抑制し、端末スリープ中は凍結する。よって「毎秒」は前景時の保証で、放置中はハートビートが止まる→ `gap` が増える→ R2 が捕捉する設計（整合的）。

---

## 8. タグ別追加項目

- **stateful**: ExecState の純粋性を保つためハートビートは状態機械の外。復元は init 限定の副作用。
- **offline-critical**: localStorage（同期・即時）を毎秒のホットパスに、IndexedDB（非同期）を遷移時/15秒に使い、書込頻度を最適化。
- **auth-required**: owner 不一致データの復元を明示的に拒否。

---

## 9. 未決事項

> 現時点で未決の論点なし (2026-06-11)。[論点-001] は下記のとおり解決済み。

### [論点-001]（解決済 2026-06-11）計時中のアカウントリンク（guest→Clerk）時の進行中セッション
- **決定**: **(A) 移送しない** + **計時中のログイン画面（`/account`）遷移でセッションを終了する**（UC-EX-LOGIN-END、§7.1）。サマリ／ふりかえり等への遷移では終了しない（終了はログイン遷移に限定）。
- **根拠**: ログイン／owner 切替は `/account` 画面で発生する。計時中にそこへ遷移した時点でセッションを done 化すれば、owner 変更を跨ぐ進行中セッションが構造的に発生せず、移送の要否も P89/P90 の owner 競合も原理的に消える。
- **決定者**: seiji（AI_LOG D20260611-017）

---

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-11 | 初版作成 | /flow:revise |
