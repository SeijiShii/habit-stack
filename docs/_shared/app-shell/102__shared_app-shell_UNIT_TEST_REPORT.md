# 単体テストレポート: _shared/app-shell

## 実施日時
2026-06-08 19:34 (JST)

## テスト実行環境
- Node v22.11.0 / Vitest 2.1.9 / happy-dom + testing-library / fake-indexeddb / Vite 5 build / TS 5.7 green

## テスト結果
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| N1/N6 | ホーム描画 + 入口リード(O41) | App.test.tsx | ✅ |
| N5 | 全ルート法務フッタ(O55) | App.test.tsx | ✅ |
| N2 | /legal/privacy + O54 文言 | App.test.tsx | ✅ |
| - | /sets repos 確立後描画 | App.test.tsx | ✅ |
| - | 未定義ルート 404 | App.test.tsx | ✅ |
| **build** | vite build 成功（251 modules/SW/manifest） | （CI/手動） | ✅ |

## サマリー
| 項目 | 値 |
|---|---|
| 計画 | 5 + build |
| 追加 | 0 |
| 合計 | 5（プロジェクト累計 115）+ build green |
| 成功率 | 100% |
