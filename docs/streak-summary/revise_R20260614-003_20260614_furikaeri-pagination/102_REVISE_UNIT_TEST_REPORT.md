# 単体テストレポート: streak-summary R20260614-003

## 実施日時
2026-06-14 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md] - 単体テスト計画

## テスト実行環境
- Vitest 2.1.9（happy-dom）+ React Testing Library

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| U1 | 11 セッションで 1 ページ目は最新 10 件のみ | SummaryPage.test.tsx SM-S8 | ✅ | `activity-total-sess_10` 表示、最古 `sess_00` は非表示 |
| U2 | 10 件超でページ操作 nav とインジケータが出る | SummaryPage.test.tsx SM-S8 | ✅ | `page-indicator`「1 / 2」 |
| U3 | 「次へ」で 2 ページ目へ遷移 | SummaryPage.test.tsx SM-S8 | ✅ | `sess_00` 表示、`sess_10` 消滅、「2 / 2」 |
| U4 | 10 件以下ではページ操作非表示（既存ケースに影響なし） | SummaryPage.test.tsx SM-S1/S4/S5/S6/S7 | ✅ | 回帰なし（`activities.length > PAGE_SIZE` ガード） |
| U5 | `ActivityTable` は slice 済み配列をそのまま描画 | SummaryPage.test.tsx SM-S6/S8 | ✅ | props シグネチャ不変、完全互換 |

## 追加テストケース
| ID | 対象 | 内容 |
|---|---|---|
| SM-S8 | SummaryPage.test.tsx | 11 セッションを古い→新しいで投入（newest=sess_10）。1 ページ目で最新 10 件（`activity-total-sess_10` 表示・最古 `sess_00` 非表示・`page-indicator`「1 / 2」）を検証 → 「次へ」クリックで 2 ページ目に `sess_00` が出て `sess_10` が消え「2 / 2」になることを検証 |

## 修正テストケース
| ID | 対象 | 修正 |
|---|---|---|
| （なし） | — | 既存テストは無修正で全 green |

## 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| （なし） | — | — |

## カバレッジ補足
- 単体（vitest）でページング表示ロジック（slice / 範囲ガード / nav 表示条件 / 前へ・次へ遷移）を網羅。
- E2E（`103_*_E2E_REPORT.md`）は**本レポート時点では未実施**。実機でのページ操作・セット切替リセットの統合確認は P4.5 gate（`/flow:e2e`）で別途実施する。

## サマリー

| 項目 | 値 |
|------|-----|
| 合計（全スイート） | 226 |
| 成功 | 226 |
| 失敗 | 0 |
| 成功率 | 100% |
