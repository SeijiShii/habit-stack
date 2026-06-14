# 単体テストレポート: execution F20260615-001 (stale-in-progress-badge)

## 実施日時
2026-06-15 08:50 (JST)

## 関連ドキュメント
- [003_REGRESSION_TEST.md] - リグレッションテスト計画

## テスト実行環境
- TypeScript: tsc --noEmit クリーン
- Vitest (happy-dom / fake-indexeddb) + Playwright (chromium)

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| RG-01 | セッション done で onSessionEnd が 1 度発火（running では非発火 = RG-05） | ExecutionPage.test.tsx | ✅ | unit |
| RG-02 | 計時終了 → セット一覧で「進行中」バッジが消える | e2e/timing-persistence.spec.ts | ✅ | E2E（toPass で tick 再描画に強い終了クリック） |
| RG-06/07/08 | 既存テスト維持（revise-20260614 / timing-persistence / ExecutionPage） | 各 | ✅ | 回帰なし |
| 回帰修正 | セッション終了系 E2E（core-journey / reflect-overview / revise-20260614 / ui-revise） | e2e/*.spec.ts | ✅ | undefined→null 正規化で done 表示巻き戻り回帰を解消 |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| RG-01 | ExecutionPage | done で onSessionEnd 発火・running で非発火 | 根本修正の固定 |
| RG-02 | E2E | 終了→一覧バッジ消滅 | バグ再現の E2E ロックイン |

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数（RG-01〜08） | 8 件 |
| 追加テスト数 | 2 件（RG-01 unit, RG-02 E2E） |
| 合計（プロジェクト全体） | unit 246 + E2E 25 |
| 成功 | unit 246 / E2E 25 |
| 失敗 | 0 |
| 成功率 | 100% |

## 計画との差分メモ
- RG-04（自動終了 autoEnd で invalidate）は同一 done 検知 effect が手動/自動を 1 点でカバーするため RG-01 の done 遷移検証で代表（autoEnd も status=done に遷移 → 同経路）。
- 実装中に undefined→null 正規化の回帰修正が必要になった（101 §想定外の問題）。これにより既存セッション終了系 E2E も green 復帰。
