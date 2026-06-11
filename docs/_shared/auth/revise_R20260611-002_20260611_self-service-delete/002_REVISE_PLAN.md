# _shared/auth 変更計画書（セルフサービス全データ削除の UI 導線）

> **入力**: `./001_REVISE_SPEC.md`, `../../concept.md` §1.4, Step 2 で読んだ実装（AccountPage / dataOps / owner / localStore / App.tsx / push.ts）
> **最終更新**: 2026-06-11

---

## 1. 既存ファイル変更一覧

| ファイル | 変更内容（概要） | リスク | 関連 SPEC § |
|---|---|---|---|
| `src/features/account/AccountPage.tsx` | 「全データを削除」セクション + 確認ダイアログ + purge 実行 + busy 制御。repos/store + ownerId を props か hook で受け取る | 中（削除は不可逆、確認 UI 必須） | §7.1 |
| `src/App.tsx` | `<AccountPage />` に repos を注入（`<AccountPage repos={repos} />`）。repos 未確立時のガード | 低 | §3 |
| `src/services/sync/localStore.ts` | （必要なら）`wipeOwner` が outbox もクリアするか確認・補強（owner 配下 outbox も消す） | 低 | §7.1(b) |

## 2. 新規ファイル一覧

| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| `api/account/delete.ts` | `DELETE /api/account` ハンドラ。`withOwner(adapter, ...)` で owner 強制 → `deleteAllData(db, ownerId)` → `200 {deleted:true}` | owner.withOwner / dataOps.deleteAllData / serverContext | ~25 |
| `src/services/auth/selfDelete.ts` | frontend `purgeAllData({store, ownerId, deleteRemote})`: ローカル `wipeOwner` + （deleteRemote 時）`DELETE /api/account` fetch。失敗時もローカル wipe 完了を保証 | localStore / fetch | ~30 |
| `src/services/auth/selfDelete.test.ts` | purgeAllData の単体テスト | vitest / fake-indexeddb | ~60 |
| `api/account/delete.test.ts` | delete ハンドラの単体テスト（owner 強制 / deleteAllData 呼び出し / 401） | vitest | ~50 |

## 3. 削除ファイル一覧
| ファイル | 削除理由 | 代替 |
|---|---|---|
| （なし） | — | — |

## 4. マイグレーション要否
- DB スキーマ変更: ❌
- 既存データ変換: ❌
- 設定ファイル変更: ❌
- ストレージパス変更: ❌
→ **MIGRATION 不要**

## 5. 実装 Phase 分割（tdd 連携）

### Phase 1: サーバ削除 API（RED→GREEN→IMPROVE）
- 対象: `api/account/delete.ts` + test
- ゴール: withOwner で owner 強制、`deleteAllData` 呼び出し、401 ガード

### Phase 2: frontend purge サービス
- 対象: `src/services/auth/selfDelete.ts` + test
- ゴール: ローカル wipe + リモート削除協調、失敗時ローカル保証

### Phase 3: AccountPage UI 導線 + App 配線
- 対象: `AccountPage.tsx`（削除セクション + 確認 + purge 実行）, `App.tsx`（repos 注入）
- ゴール: ボタン → 確認 → purgeAllData → `/` リロード。busy/エラー表示

## 6. 依存関係順序
```
deleteAllData(既存) ──> api/account/delete ──┐
                                             ├─> purgeAllData(selfDelete) ──> AccountPage ──> App 配線
LocalStore.wipeOwner(既存) ──────────────────┘
```

## 7. ロールアウト計画
| ステップ | 内容 | 期日 | 検証方法 |
|---|---|---|---|
| 1 | unit green（Phase 1-3） | 2026-06-11 | vitest |
| 2 | E2E（削除導線到達 + 確認 + 削除後フレッシュ） | 2026-06-11 | playwright ローカル headless |
| 3 | release-pre full audit→secure→再デプロイ（R20260611-001 と合流） | — | /flow:release |

## 8. リスク・注意点
- 削除は**不可逆**。確認ダイアログを必須にし、誤操作を防ぐ（「元に戻せません」明示）。
- サーバ削除失敗時にローカルだけ消えると、次回 pull でサーバから復活する可能性 → ローカル wipe 後は outbox もクリアし、かつ削除完了まで pull を抑制（or 削除フラグ）。MVP は「ローカル wipe + リモート削除を同期実行、リモート失敗時はユーザーに再試行を促す」で許容。
- guest（keyless）は `deleteRemote=false`（サーバにデータなし）。

## 9. 完了の定義 (DoD)
- [ ] Phase 1-3 実装完了
- [ ] 単体テスト green（API owner 強制 / purge ローカル+リモート / AccountPage 確認フロー）
- [ ] E2E: 削除導線到達 → 確認 → 削除後フレッシュ状態
- [ ] プラポリ N2 文言と整合（導線が約束を充足）
- [ ] 既存 167 テスト green 維持

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-11 | 初版作成 | /flow:revise |
