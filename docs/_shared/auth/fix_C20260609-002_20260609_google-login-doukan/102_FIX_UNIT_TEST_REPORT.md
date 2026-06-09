# 単体テストレポート: Google ログイン/連携動線 (fix C20260609-002)

## 実施日時
2026-06-09 21:40 (JST)

## テスト実行環境
- TypeScript / Vitest 2.1.9 / happy-dom / @testing-library/react

## テスト結果

| # | テストケース | テストファイル | 結果 |
|---|---|---|---|
| RT-2 | Google strategy + redirectUrl で連携開始・redirect 遷移 | linkWithGoogle.test.ts | ✅ |
| RT-7 | 検証 URL 無し（中断）は非遷移（匿名維持） | linkWithGoogle.test.ts | ✅ |
| — | 文字列の検証 URL も遷移先に使う | linkWithGoogle.test.ts | ✅ |
| RT-3a | ゲスト未連携: 「Google で引き継ぐ」CTA→linkGoogle 呼出 | AccountPage.test.tsx | ✅ |
| RT-3b | 連携済: email 表示 + サインアウト導線 | AccountPage.test.tsx | ✅ |
| RT-6 | keyless: 連携ボタン非表示 + ローカル利用表示 | AccountPage.test.tsx | ✅ |
| — | 未ロード時は読み込み中表示 | AccountPage.test.tsx | ✅ |
| RT-1 | 動線到達: nav に `/account` inbound link 常設 (O55) | App.test.tsx | ✅ |
| E2E-1 | `/account` がレンダーされる | App.test.tsx | ✅ |

## 既存テスト維持
- 全 28 ファイル / 129 テスト green（既存 120 + 新規 9）。`useOwner.test.tsx` は型追従で `isLinked` 追加のみ、挙動不変。guest セッション・owner-check・local-sync は無改変。

## サマリー
| 項目 | 値 |
|---|---|
| 新規テスト数 | 9 |
| 合計（全体） | 129 |
| 成功 | 129 |
| 失敗 | 0 |
| 成功率 | 100% |
| typecheck | green |
| build | OK |

## カバレッジ
- linkWithGoogle / AccountPage の分岐（連携開始・中断・連携済・keyless・未ロード）を網羅。
- 実 Google OAuth フロー（GCP/Clerk 設定依存）は release 実機 smoke で検証（§3.4、unit 範囲外）。

## 注記（donation 非ゲート）
- RT-9（tip がログイン要求しない）は既存 tip-jar.test.tsx（7 件 green）が tip フローをゲストで検証済。本 fix は tip フローに変更を加えていない（ログインゲートを「足さない」校正のみ）。
