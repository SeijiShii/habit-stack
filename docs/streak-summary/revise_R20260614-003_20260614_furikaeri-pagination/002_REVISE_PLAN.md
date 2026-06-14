# streak-summary 変更計画書（活動記録のページネーション）

> **入力**: `./001_REVISE_SPEC.md`, `src/features/streak-summary/SummaryPage.tsx`, `components.tsx`, `SummaryPage.test.tsx`
> **最終更新**: 2026-06-14
> **状態**: 実装完了（unit green）

---

## 1. 既存ファイル変更一覧

| ファイル | 変更内容（概要） | リスク | 関連 SPEC § |
|---|---|---|---|
| `src/features/streak-summary/SummaryPage.tsx` | `PAGE_SIZE = 10` 定数追加。`page` state（`useState(0)`）と `setId` 変更時のリセット（`useEffect`）追加。`activities` を `slice(cur*10, cur*10+10)` して `ActivityTable` に渡す。10 件超のとき `aria-label="活動の記録ページ"` の nav（前へ / `page-indicator` / 次へ）を描画 | 中 | §2.2, §7.1, §7.2 |
| `src/features/streak-summary/components.tsx`（`ActivityTable`） | **変更なし**。受け取る配列が slice 済みになるのみ | 低 | §2.2 |
| `src/features/streak-summary/SummaryPage.test.tsx` | ページネーションの単体テスト `SM-S8` を追加（11 件投入 → 1 ページ目最新 10 件 → 次へで 2 ページ目） | 低 | §7.1 |

## 2. 新規ファイル一覧
| ファイル | 責務 | 依存 | LOC 見積 |
|---|---|---|---|
| （なし） | — | — | — |

## 3. 削除ファイル一覧
| ファイル | 削除理由 | 代替 |
|---|---|---|
| （なし） | — | — |

## 4. マイグレーション要否
- DB スキーマ変更: ❌ / 既存データ変換: ❌ / 設定ファイル変更: ❌ / ストレージパス変更: ❌
→ **マイグレーション不要**（表示のページングのみ。永続データ・リポジトリ契約は不変）。

## 5. 実装 Phase 分割（`/flow:tdd` 連携）

### Phase 1 — ページ state + slice + ページ操作 UI（RED→GREEN→IMPROVE）
- 対象: `SummaryPage.tsx`, `SummaryPage.test.tsx`
- 手順:
  1. `SummaryPage.test.tsx` に `SM-S8`（11 セッション → 1 ページ目最新 10 件、`page-indicator` 「1 / 2」、最古 sess_00 非表示。次へで 2 ページ目 sess_00、sess_10 消失、「2 / 2」）を追加 → RED。
  2. `SummaryPage.tsx` に `PAGE_SIZE`、`page` state、`useEffect([setId])` リセット、`slice`、10 件超のみ表示の nav を実装 → GREEN。
  3. 範囲ガード（`cur = Math.min(page, pageCount-1)`、ボタン disabled）と穏やかなトーンを確認 → IMPROVE。
- ゴール: `SM-S8` green、既存 streak-summary テスト全 green。

## 6. 依存関係順序

```mermaid
graph TD
  A[SM-S8 テスト追加 (RED)] --> B[SummaryPage に page state + slice + nav]
  B --> C[範囲ガード/トーン調整 (IMPROVE)]
```

## 7. ロールアウト計画
| ステップ | 内容 | 期日 | 検証方法 |
|---|---|---|---|
| 1 | 実装 + 単体 green（SM-S8 追加） | 2026-06-14（完了） | vitest |
| 2 | `/flow:design` 視覚レビュー（10 件超でページ nav が穏やかに出る / 10 件以下で非表示） | 実装後 | headless スクショ |
| 3 | release バンドル同梱 | 次回 release | 実機目視 |

## 8. リスク・注意点
- `page` が `pageCount` を超えないよう `Math.min(page, pageCount-1)` でガード（セット切替直後の境界）。実装済み。
- セット切替で page を 0 に戻す `useEffect([setId])` 漏れに注意（古いページ番号で空表示になる事故防止）。実装済み。
- 10 件以下のセットでページ nav が出ないこと（SM-S6 等の既存ケースが影響を受けないこと）。

## 9. 完了の定義 (DoD)
- [x] `SummaryPage` に `page` state + `slice` + ページ操作 nav を実装
- [x] セット切替で page が 0 にリセットされる
- [x] 10 件超のみ nav 表示（`page-indicator`「{cur+1} / {pageCount}」、前へ/次への境界 disabled）
- [x] 単体テスト `SM-S8` を追加し green
- [x] 既存 streak-summary テスト（SM-S1/4/5/6/7 等）が全 green
- [ ] `/flow:design` 視覚レビュー通過（穏やかなトーン）

## 10. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版作成（実装完了・unit green を反映、DoD チェック済み） | /flow:revise |
