# _shared/types 実装計画書

> **入力**: `./001__shared_types_SPEC.md`, `../db/001__shared_db_SPEC.md`
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧（src/types/）

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `src/types/domain.ts` | enum const + union（TimeOfDay/SessionStatus）+ VO（OwnerId branded, ContinuationRate） | — | 60 |
| `src/types/db.ts` | _shared/db schema 型を意味名で re-export | db/schema | 40 |
| `src/types/sync.ts` | SyncEnvelope/SyncPullResult/SyncPushResult | domain, db | 50 |
| `src/types/index.ts` | barrel re-export | 上記 | 10 |

## 2. 実装 Phase 分割
### Phase 1: domain.ts（enum + VO）
- enum const オブジェクト + union 型、branded OwnerId、ContinuationRate。
- テスト: 型テスト（expectTypeOf）+ enum const の値検証。
### Phase 2: db.ts + sync.ts
- db schema 型の re-export、SyncEnvelope ジェネリクス。
- テスト: 型テスト（ActivitySet が期待 shape、SyncEnvelope<ActivitySet> が通る）。

## 3. 依存関係順序
```
domain.ts → db.ts(_shared/db 依存) → sync.ts → index.ts
```

## 4. 既存ファイルへの影響
- なし。_shared/db の型 export を前提（先に db 実装）。

## 5. 横断フォルダへの追加・変更
- _shared/db: 型 re-export の窓口になる（db 側で型 export を用意済み前提）。

## 6. リスク・注意点
- 循環参照回避（types は db に依存するが db は types に依存しない一方向）。
- branded OwnerId のキャスト箇所は owner resolver（_shared/auth）のみに限定。

## 7. 完了の定義
- [ ] domain/db/sync/index 実装
- [ ] 型テスト green
- [ ] 全 feature から `import type` 可能
- [ ] E2E は cross-cutting で skip

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
