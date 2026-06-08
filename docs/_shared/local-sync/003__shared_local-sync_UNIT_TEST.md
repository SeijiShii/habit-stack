# _shared/local-sync 単体テスト計画

> **入力**: `./001__shared_local-sync_SPEC.md`, `./002__shared_local-sync_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧

### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| N1 | localStore.put | record | client_local_id/updated_at 付与で保存 |
| N2 | getAllByOwner | owner | 自分の未削除レコードのみ |
| N3 | softDelete | id | deleted_at 設定、getAll から除外 |
| N4 | sync.push | outbox 2 件 | /api/sync/push へ送信、outbox クリア |
| N5 | sync.pull | since | 差分をローカルへ反映 |
| N6 | api/sync/push | withOwner | owner_id をサーバ付与して upsert |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | sync.push | fetch 失敗 | outbox 保持 + リトライ（バックオフ） |
| E2 | 競合 | local.updated_at < server | server 採用（local 破棄） |
| E3 | 競合 | local.updated_at > server | local 採用 |
| E4 | 冪等 | 同一 client_local_id 再送 | サーバ upsert で重複なし |
| E5 | api/sync/push | 未認証 | 401（withOwner） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | 競合 | updated_at 同値 | サーバ受信順で決定（決定的） |
| B2 | tombstone | deleted_at 同期 | pull 側でローカルも削除反映 |
| B3 | オフライン | online=false で put | ローカル成功 + outbox 積む |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| IndexedDB | fake-indexeddb | 再現性 |
| fetch | injectable mock | push/pull 分岐 |
| Clerk(withOwner) | mock | owner 強制検証 |
| 時刻 | 固定値注入 | updated_at 比較の再現性 |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 85%（同期は中核ロジック） |
| 分岐 | 80%（競合分岐を網羅） |

## 4. 既存ユーティリティ依存
- _shared/db, _shared/auth(withOwner), _shared/types。

## 5. テスト実行環境
- Vitest + fake-indexeddb + fetch mock。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
