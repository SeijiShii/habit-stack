# 単体テストレポート: tip-jar

## 実施日時
2026-06-08 19:24 (JST)

## テスト実行環境
- Node v22.11.0 / Vitest 2.1.9 / happy-dom + testing-library / TS 5.7 green

## テスト結果
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| N1 | webhook 有効署名 200+記録 | tip-jar.test.tsx | ✅ |
| E1 | webhook 署名不正 400 | tip-jar.test.tsx | ✅ |
| E2 | 重複 session 冪等 | tip-jar.test.tsx | ✅ |
| N2 | checkout 認証済み URL | tip-jar.test.tsx | ✅ |
| E3 | checkout 未認証 401 | tip-jar.test.tsx | ✅ |
| N3 | TipJarButton 金額 CTA 明示(O43) | tip-jar.test.tsx | ✅ |
| - | 匿名→Google リンク誘導 | tip-jar.test.tsx | ✅ |

## サマリー
| 項目 | 値 |
|---|---|
| 計画 | 7 |
| 追加 | 0 |
| 合計 | 7（プロジェクト累計 110） |
| 成功率 | 100% |
