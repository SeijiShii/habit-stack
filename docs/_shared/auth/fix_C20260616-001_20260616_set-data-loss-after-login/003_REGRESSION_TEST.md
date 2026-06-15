# リグレッションテスト計画: ログイン状態で活動セットがパーシャルに消失

> **入力**: `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`
> **最終更新**: 2026-06-16

---

## 1. 再発防止テストケース

### 1.1 直接原因を捉えるテスト（修正前: fail / 修正後: pass）
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| RT-1 | `wipeOtherOwners` の不可逆性 | owner G1 のレコード（**未送信 outbox あり**）+ owner U のレコードがある状態で `wipeOtherOwners(U)` | G1 の**未同期データが消えない**（保全される／または push 後に消す）。修正前は entity + outbox が消えて fail。 |
| RT-2 | 即時 mitigation: wipe 呼び出し撤去 | `consumeDeviceOverwrite()` true + G1/U 混在ローカル | app 初期化（repos）が G1 データを物理削除**しない**。owner-scoped read で U のみ表示・G1 は保持。 |
| RT-3 | owner churn の保全 | guest G1 で set A 作成 → 既存アカウント U へサインイン（userId churn） | set A が失われない（reassignOwnerLocal で U に付け替え or 保持）。修正前は wipe で A 消失 → fail。 |

### 1.2 修正後に必ず通るテスト
| ID | 対象 | 期待 |
|---|---|---|
| RT-4 | owner-scoped 隔離維持 | U セッションで `getAllByOwner('activity_set', U)` が U のセットのみ返す（G1 と混在表示しない）。 |
| RT-5 | reassignOwnerLocal（新設時） | `reassignOwnerLocal(G1,U)` 後、旧 G1 エンティティ + outbox payload の ownerId が U に更新され、削除は発生しない。 |

## 2. 類似境界条件テスト
| ID | 境界条件 | 期待振る舞い |
|---|---|---|
| RT-6 | 未送信 outbox が空（全同期済）の orphan owner | 物理削除しても復元可能（サーバに存在）。安全に cleanup されてよい（または保全でも可、消失しなければ可）。 |
| RT-7 | O54 セルフサービス全削除 | `wipeOwner` 経由のセルフ削除は**従来どおり全消去**（未同期含む）。保全ロジックがセルフ削除を阻害しない。 |
| RT-8 | wipe と sync push の順序競合 | push が先でも wipe が先でも、未同期データがサーバ到達前に消えない（保全 or push 完了保証）。 |
| RT-9 | markDeviceOverwrite が立たない通常連携（同一 userId 維持） | churn なし → 保全も wipe も不要、データそのまま保持（既存挙動回帰）。 |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| RT-10 | `localStore.test.ts`（getAllByOwner=未削除のみ / wipeOwner 全削除） | コア契約。セルフ削除挙動の回帰防止。 |
| RT-11 | `AuthProvider.test.ts` | 連携/サインイン分岐の回帰防止。 |
| RT-12 | `useSync.test.tsx` / `syncQueue.test.ts` | push/pull・LWW の回帰防止。 |
| RT-13 | R20260615-001 の停止条件緩和・確認ダイアログ系テスト | 即時 mitigation（wipe 撤去）が他機能を壊さないこと。 |

## 4. E2E シナリオ追加
| シナリオ ID | バグ再現 → 修正後の確認 |
|---|---|
| E2E-1 | ゲストで活動セット作成・計時 → 既存 Google アカウントへサインイン → 再読込 → **作成したセット＋実績が残っている**（修正前は消失）。 |
| E2E-2 | 既存アカウントに既存データがある状態でサインイン → 自分のアカウントデータが見える ＆ ゲストデータも失われない。 |

## 5. Mock 方針
| 対象 | 固定値 | 理由 |
|---|---|---|
| Clerk userId | guest=G1 固定 → account=U 固定で churn を再現 | owner churn の決定的再現 |
| 時刻 / updatedAt | 固定タイムスタンプ | LWW・outbox 順序の再現性 |
| `/api/sync/push` `/api/sync/pull` | スタブ（push 成否を制御） | wipe×push 競合（RT-8）の再現 |
| `consumeDeviceOverwrite` / sessionStorage | テストで marker を直接設定 | wipe トリガの決定的制御 |

## 6. カバレッジ目標
- 修正コード行: 100%（repos の wipe 撤去分岐 / localStore 保全分岐 / reassignOwnerLocal）。
- 関連境界条件カバレッジ: 90%+（churn・未同期・順序競合・セルフ削除の区別）。

## 7. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-16 | 初版 | /flow:fix |
