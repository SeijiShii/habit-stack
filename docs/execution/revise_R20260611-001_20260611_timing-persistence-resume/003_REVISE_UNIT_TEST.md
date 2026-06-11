# execution 単体テスト計画（計時状態の永続化・復帰 + 4H放置キャップ）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, 既存 `../003_execution_UNIT_TEST.md` + 実テスト
> **最終更新**: 2026-06-11

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U-R1-01 | `cappedElapsedSec` | started 09:00, now 12:00, paused 0 | 10800（4H未満→クランプなし） |
| U-R1-02 | `cappedElapsedSec` | started 09:00, now 14:00, paused 0（5H） | 14400（4Hクランプ） |
| U-HB-01 | `heartbeat.save` | ownerId=o1, state, lastSavedAt=T | `localStorage['hs:exec:hb:o1']` に JSON 書込 |
| U-HB-02 | `heartbeat.load` | ownerId=o1（保存済） | `{ sessionLocalId, lastSavedAt, snapshot }` を返す |
| U-HB-03 | `heartbeat.clear` | done 遷移時 | キー削除（または snapshot=null） |
| U-REPO-01 | `executionRepo.persist` | state + lastSavedAt | session LocalRecord に `lastSavedAt` が入る |
| U-REPO-02 | `restoreInProgress` | IndexedDB に running session 1件 | `{ state, lastSavedAt }` を再構成して返す |
| U-REC-01 | `decideRecovery` | running, gap=1H | `{ kind: 'resume' }` |
| U-REC-02 | `decideRecovery` | running, gap=4H ちょうど | `{ kind: 'autoEnd', endedAt: lastSavedAt }` |
| U-REC-03 | `decideRecovery` | running, gap=8H | `{ kind: 'autoEnd', endedAt: lastSavedAt }` |
| U-REC-04 | `decideRecovery` 後の `endSession(state, lastSavedAt)` | 自動終了適用 | status=done, endedAt=lastSavedAt, current item endedAt=lastSavedAt |
| U-REC-05 (R6) | `restoreInProgress` の id 採用 | found session.clientLocalId="sess-X-2026-06-10"、現在日=2026-06-11 | 復元後の永続 id は **found レコードの id** を採用（日付再計算 id で重複生成しない） |
| U-REC-06 (R3) | 自動終了の達成記録 | 開始直後放置（lastSavedAt≈startedAt、有効経過0秒） | achieved を記録しない（doneItemCount で 0秒 item を除外） |
| U-REC-07 (R3) | 自動終了の達成記録 | 有効経過 >0 の item あり | achieved=true（>0 秒 item を done に算入） |
| U-REC-08 (R1) | finalize 冪等 | decideRecovery→finalize を 2 回適用（StrictMode 模擬） | 2 回目も同一結果（put 上書き、重複レコード・二重達成なし） |
| U-LOGIN-01 (R8) | `shouldEndOnNavigate(toPath, status)` | to=`/account`, status=running | true（終了する） |
| U-LOGIN-02 (R8) | `shouldEndOnNavigate` | to=`/summary/x`, status=running | false（終了しない、計時継続） |
| U-LOGIN-03 (R8) | `shouldEndOnNavigate` | to=`/account`, status=done | false（既に done、再終了しない） |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U-HB-E1 | `heartbeat.load` | owner 不一致（保存 o1、要求 o2） | undefined（復元しない） |
| U-HB-E2 | `heartbeat.load` | JSON 破損 | undefined（throw せず握る） |
| U-REC-E1 | `decideRecovery` | `lastSavedAt` 欠落 | フォールバック（updatedAt → startedAt）で gap 算出、throw しない |
| U-REC-E2 | `decideRecovery` | gap < 0（時計巻き戻し） | `resume`（自動終了しない、0 クランプ） |
| U-R1-E1 | `cappedElapsedSec` | now < started（負） | 0（既存 0 クランプ維持 + cap） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U-R1-B1 | cap | elapsed=14399 | 14399 |
| U-R1-B2 | cap | elapsed=14400 | 14400 |
| U-R1-B3 | cap | elapsed=14401 | 14400 |
| U-REC-B1 | autoEnd 閾値 | gap=14399s | resume |
| U-REC-B2 | autoEnd 閾値 | gap=14400s | autoEnd |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| U-EX-LIVE（既存 liveElapsed 系） | `liveElapsed` は素の `elapsedSec` | `cappedElapsedSec` で 4H 上限 | R1 導入。4H 未満の既存期待値は不変、超過ケースの期待を追加 |
| U-REPO-PERSIST（既存 persist） | session に lastSavedAt なし | lastSavedAt を許容（任意引数、未指定時 undefined/NULL 許容） | 後方互換を壊さない確認 |

## 3. 削除テストケース

| ID | 対象 | 削除理由 |
|---|---|---|
| （なし） | 既存テストは全維持 |

## 4. リグレッション強化

- 既存 execution 単体（全遷移 / 経過 / 復元 / 穴あき達成、102 で 15→現行 green）を全維持。
- 追加チェック: pause 中も `lastSavedAt` が更新されるが経過は凍結（pause 凍結のリグレッション）。
- 追加チェック: 4H 未満のセッションは復元後 `resume` で経過が `startedAt` 起点に一致。

## 5. Mock 方針差分

| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| localStorage | guest のみ | fake/in-memory storage を heartbeat テストに注入（DI 可能に） | 毎秒書込の検証、owner 分離 |
| `now()` | 注入済 | 継続注入（gap/4H 境界を決定的に） | 時刻依存の境界テスト |
| LocalStore（IndexedDB） | fake-indexeddb 既存 | 継続 + lastSavedAt 列の往復確認 | restoreInProgress |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承（recovery 分岐 resume/autoEnd/fallback を網羅） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-11 | 初版作成 | /flow:revise |
