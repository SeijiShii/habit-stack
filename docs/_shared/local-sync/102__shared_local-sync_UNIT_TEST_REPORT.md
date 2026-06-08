# 単体テストレポート: _shared/local-sync

## 実施日時
2026-06-08 18:58 (JST)

## テスト実行環境
- Node v22.11.0 / Vitest 2.1.9 / fake-indexeddb / happy-dom（useSync）/ TypeScript 5.7 green

## テスト結果
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| E2 | conflict local 古→server | conflict.test.ts | ✅ |
| E3 | conflict local 新→local | conflict.test.ts | ✅ |
| B1 | conflict 同値→server | conflict.test.ts | ✅ |
| N1 | put + outbox upsert | localStore.test.ts | ✅ |
| N2 | getAllByOwner 未削除のみ | localStore.test.ts | ✅ |
| N3 | softDelete tombstone | localStore.test.ts | ✅ |
| B3 | オフライン put + outbox | localStore.test.ts | ✅ |
| - | wipeOwner（O54 ローカル） | localStore.test.ts | ✅ |
| N4 | push + outbox クリア | syncQueue.test.ts | ✅ |
| - | outbox 空 push 0 | syncQueue.test.ts | ✅ |
| E1 | push 失敗で outbox 保持 | syncQueue.test.ts | ✅ |
| N5 | pull 反映 | syncQueue.test.ts | ✅ |
| E2 | 競合 local 新を保持 | syncQueue.test.ts | ✅ |
| N6 | push owner サーバ強制 | sync.test.ts | ✅ |
| E5 | push 未認証 401 | sync.test.ts | ✅ |
| - | pull owner で changesSince | sync.test.ts | ✅ |
| - | useSync マウントで run | useSync.test.tsx | ✅ |
| - | useSync online 再実行 | useSync.test.tsx | ✅ |
| - | useSync 未認証 skip | useSync.test.tsx | ✅ |

## 追加テストケース
なし。

## サマリー
| 項目 | 値 |
|---|---|
| 計画 | 19 |
| 追加 | 0 |
| 合計 | 19（プロジェクト累計 56） |
| 成功 | 19 |
| 失敗 | 0 |
| 成功率 | 100% |
