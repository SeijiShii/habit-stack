# _shared/auth 実装計画書

> **入力**: `./001__shared_auth_SPEC.md`, `../../concept.md` §4.3、`~/.claude/flow-data/guest-auth-clerk-scaffold.md`（Clerk ゲスト認証 scaffold）
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `src/services/auth/owner.ts` | `getOwnerId` / `withOwner` / `requireOwner`（サーバ owner resolver） | @clerk/backend, db | 110 |
| `src/services/auth/guest.ts` | 匿名サインイン確立 + Google リンク + mergeGuestData | @clerk/clerk-js, db | 120 |
| `src/components/auth/AuthProvider.tsx` | ClerkProvider ラッパ + 初回匿名サインイン副作用 | @clerk/clerk-react | 60 |
| `src/hooks/useOwner.ts` | クライアント owner id フック | @clerk/clerk-react | 30 |
| `src/services/auth/deleteAllData.ts` | セルフサービス全削除（O54） | db, local-sync | 60 |
| `src/services/auth/owner.test.ts` 他 | テスト | vitest | — |

## 2. 実装 Phase 分割（injectable + interface default、O35）

### Phase 1: owner resolver interface + 実装（mock Clerk でテスト）
- `getOwnerId`/`withOwner`/`requireOwner` を Clerk クライアントを **injectable** にして実装。
- テスト: mock Clerk セッション注入で 401/200/403 分岐を検証。**「匿名セッション → authed owner で保護 API が 200（401 でない）」を検証**（P4.46 hard gate 要件）。

### Phase 2: クライアント匿名サインイン + Provider
- `AuthProvider` 初回マウントで匿名サインイン（Clerk anonymous）。`useOwner`。
- テスト: jsdom + Clerk mock で匿名 owner 取得を検証。

### Phase 3: Google リンク + mergeGuestData
- `linkWithGoogle`、移行（[論点-009] の確定方式）。
- テスト: 移行で owner_id 付け替え後にデータが authed owner で参照可能。

### Phase 3.5: app bootstrap（実 SDK 統合、O35）
- `@clerk/clerk-react` / `@clerk/backend` install、実 Provider wiring、`.env.example` に Clerk キー追記。
- **本番ゲストセッション経路の実コード**を確定（P4.46 gate: stub auth でなく実セッション）。

### Phase 4: deleteAllData（O54 セルフサービス削除）
- owner 配下全テーブル + IndexedDB 削除。テスト: 削除後 0 件。

## 3. 依存関係順序
```
owner.ts(getOwnerId/withOwner/requireOwner) → guest.ts(匿名+リンク+merge)
  → AuthProvider/useOwner(クライアント) → deleteAllData
依存: _shared/db, _shared/local-sync(merge/delete)
```

## 4. 既存ファイルへの影響
- 全 feature API が `withOwner` を import（feature 実装時に配線）。

## 5. 横断フォルダへの追加・変更
- _shared/local-sync: mergeGuestData / deleteAllData で協調（owner 付け替え・ローカル削除）。

## 6. リスク・注意点
- **P4.46 ハードゲート**: stub auth（固定 owner 注入）が green でも未実装扱い。**本番セッション経路の実コード + 匿名→authed API 200 検証**が必須。
- Clerk anonymous の永続化アップグレード可否（[論点-009]）で移行実装が変わる。
- owner_id 詐称防止: クライアント送信値を一切信用しない（SEC-001）。
- PII を認証ログに出さない（SEC-004）。

## 7. 完了の定義
- [ ] owner resolver（withOwner/requireOwner）実装 + 401/403/200 テスト green
- [ ] 匿名サインイン → authed owner で保護 API 200 の検証（P4.46）
- [ ] Google リンク + データ移行 green
- [ ] deleteAllData green（O54）
- [ ] 実 Clerk SDK 統合（Phase 3.5、stub でない）
- [ ] E2E は feature 側（認証フロー）でカバー

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
