# 単体テストレポート: C20260616-001 データ消失 fix

## 実施日時
2026-06-16 (JST)

## 関連ドキュメント
- [003_REGRESSION_TEST.md] — リグレッションテスト計画

## テスト実行環境
- ランタイム: Node 22 / Vite 5（vitest run）
- テストフレームワーク: Vitest 2.1.9（IndexedDB は fake-indexeddb）

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|---|---|---|---|
| RT-3 | `reassignOtherOwnersTo` は他 owner を消さず current へ付け替えて保全（パーシャル消失しない） | `src/services/sync/localStore.test.ts` | ✅ | 直接原因を捉える主テスト。旧実装なら g1/g2 消滅で fail |
| RT-5 | `reassignOwnerLocal` は entity を付け替え + 新 owner upsert を積む（削除しない、旧 owner outbox 残さない） | 同上 | ✅ | 保全 + サーバ反映 + stale outbox 除去 |
| RT(no-op) | `reassignOwnerLocal` は from===to で no-op | 同上 | ✅ | churn 無し回帰 |
| RT-2 | `reassignOtherOwnersTo` は他 owner 無しで current を消さない | 同上 | ✅ | 保持経路でデータを消さない |
| RT-7 | `wipeOwner` は owner 配下を全消去（O54 セルフ削除） | 同上 | ✅ | 既存テスト維持（意図的全削除は不変） |
| 既存 | LocalStore N1/N2/N3/B3（put/getAllByOwner/softDelete/offline） | 同上 | ✅ | 回帰なし |
| 既存 | deviceOverwrite mark→consume（マーカー機構） | `deviceOverwrite.test.ts` | ✅ | マーカーは不変・維持 |
| 既存 | AuthProvider / syncQueue / conflict / owner / 他 全 | （42 files） | ✅ | 回帰なし |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|---|---|---|
| RT-3 | reassignOtherOwnersTo | 他 owner データの保全 + current への付け替え | データ消失バグの直接再現防止 |
| RT-5 | reassignOwnerLocal | 付け替え + outbox upsert + stale 除去 | 保全プリミティブの契約固定 |
| RT(no-op) | reassignOwnerLocal | from===to no-op | churn 無し時の不変性 |

> 置換: 破壊を前提とした U-15 / U-07b（`wipeOtherOwners` がデータを削除することを assert）を削除（バグ挙動を固定するテストだったため）。

## サマリー

| 項目 | 値 |
|---|---|
| 計画テスト数（RT 系の unit 該当分） | 5 |
| 追加テスト数（新規 unit） | 4（RT-2/RT-3/RT-5/no-op） |
| 全体テスト数 | 248 |
| 成功 | 248 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | clean |

> E2E（E2E-1/E2E-2: ゲスト作成→既存アカウントサインイン→データ残存）は `/flow:e2e` の責務。004 E2E 計画が無いため本 fix では unit で直接原因をカバー。E2E gate で別途評価。
