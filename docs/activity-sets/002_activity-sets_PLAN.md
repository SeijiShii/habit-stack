# activity-sets 実装計画書

> **入力**: `./001_activity-sets_SPEC.md`, `../concept.md` §1.4、`../_shared/`
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧（src/features/activity-sets/）

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `SetListPage.tsx` | セット一覧（時間帯グループ表示） | local-sync, design | 130 |
| `SetEditPage.tsx` | セット編集 + アイテム CRUD・並べ替え | local-sync, design | 180 |
| `components/SetCard.tsx` | セットカード（Chip 時間帯） | design | 60 |
| `components/ItemRow.tsx` | アイテム行（ドラッグハンドル） | design | 60 |
| `model/setsRepo.ts` | local-sync 経由 CRUD ラッパ + Zod | local-sync, types | 120 |
| `model/reorder.ts` | sort_order 採番 | — | 40 |
| `hooks/useSets.ts` | TanStack Query で owner のセット取得 | local-sync, auth | 50 |

## 2. 実装 Phase 分割

### Phase 1: model（setsRepo + Zod + reorder）
- local-sync 経由の CRUD、Zod 検証（SEC-002）。
- テスト: create/update/softDelete/reorder、Zod 異常系。
### Phase 2: hooks/useSets + 一覧
- TanStack Query、time_of_day グループ表示。
- テスト: owner のセットのみ、グループ化。
### Phase 3: 編集画面 + アイテム CRUD・並べ替え
- SetEditPage、ドラッグ並べ替え。
- テスト: アイテム追加/編集/削除/並べ替え。
### Phase 4: UI 仕上げ（design-system トークン）
- Card/Chip/Button/Input をトークン適用。

## 3. 依存関係順序
```
setsRepo+reorder(model) → useSets(hooks) → SetListPage → SetEditPage+ItemRow
依存: _shared/local-sync, _shared/auth, _shared/types, design-system
```

## 4. 既存ファイルへの影響
- app-shell がルート（/sets, /sets/:id）を登録。

## 5. 横断フォルダへの追加・変更
- なし（既存横断を利用）。

## 6. リスク・注意点
- ドラッグ並べ替えライブラリ選定（dnd-kit 等、軽量）。
- オフライン編集と同期の整合（local-sync に委譲）。

## 7. 完了の定義
- [ ] model/hooks/2 画面実装
- [ ] 単体テスト green（CRUD/Zod/reorder）
- [ ] E2E（004）green：セット作成→アイテム追加→並べ替え
- [ ] design-system トークン適用 + 視覚レビュー green

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
