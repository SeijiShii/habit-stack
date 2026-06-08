# 実装レポート: activity-sets

## 実装日時
2026-06-08 19:08 (JST)

## モード
feature

## 関連ドキュメント
- 001-004 + 905 + [AI_LOG](../AI_LOG/D20260608_023_tdd_activity-sets.md)

## 変更一覧
- `model/schema.ts`: Zod 入力検証（name 1..60、time_of_day enum、SEC-002）。
- `model/reorder.ts`: 連番振り直し（R1、変更分のみ）。
- `model/setsRepo.ts`: セット/アイテム CRUD（local-sync 経由、owner 付与、配下アイテム連動 softDelete）。
- `hooks/useSets.ts`: useSets / useItems（TanStack Query、楽観 invalidate）。
- `SetListPage.tsx`: 一覧（time_of_day グループ）+ 作成フォーム + バリデーション表示。
- `SetEditPage.tsx`: アイテム追加/削除。

## 実装計画からの差分
| 項目 | 内容 |
|---|---|
| 追加 | zod / @tanstack/react-query / @testing-library/user-event 導入 |
| 後続 | ドラッグ並べ替え UI（reorder ロジックは実装済、dnd-kit 配線は仕上げ時）。design-system トークン適用は app-shell テーマ時 |
| 問題と対処 | なし |

## PR Description
### タイトル
activity-sets: セット/アイテム CRUD・時間帯グループ（local-first/Zod/TanStack）
### 概要
活動セットとアイテムの管理。local-sync 経由でオフライン可、Zod 検証（SEC-002）、owner スコープ。
### テスト
11 テスト（model 9 / SetListPage 2）。累計 72/72 green、typecheck green。
