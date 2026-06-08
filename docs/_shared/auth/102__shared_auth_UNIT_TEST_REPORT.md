# 単体テストレポート: _shared/auth

## 実施日時
2026-06-08 18:50 (JST)

## テスト実行環境
- Node v22.11.0 / Vitest 2.1.9 / happy-dom（component）/ TypeScript 5.7（typecheck green）

## テスト結果
| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| N3/N5 | withOwner 認証済み 200 | owner.test.ts | ✅ |
| E1 | withOwner 未認証 401 | owner.test.ts | ✅ |
| E3 | owner 詐称 → サーバ値使用 | owner.test.ts | ✅ |
| - | AuthError → ステータス変換 | owner.test.ts | ✅ |
| N4 | requireOwner 一致通過 | owner.test.ts | ✅ |
| E2 | requireOwner 不一致 404 | owner.test.ts | ✅ |
| - | null リソース 404 | owner.test.ts | ✅ |
| - | clerkAdapter 空 secret エラー | clerkOwnerAdapter.test.ts | ✅ |
| - | Clerk セッション→userId | clerkOwnerAdapter.test.ts | ✅ |
| - | 未認証 null | clerkOwnerAdapter.test.ts | ✅ |
| **P4.46** | 匿名→実adapter→withOwner 200 | clerkOwnerAdapter.test.ts | ✅ |
| **P4.46** | 未認証→実adapter→401 | clerkOwnerAdapter.test.ts | ✅ |
| - | issueGuestTicket 空 secret | guestSession.test.ts | ✅ |
| - | ゲスト作成+チケット発行 | guestSession.test.ts | ✅ |
| - | guest endpoint 503 degrade | guest.test.ts | ✅ |
| - | useOwner userId→OwnerId | useOwner.test.tsx | ✅ |
| - | useOwner null | useOwner.test.tsx | ✅ |
| N6 | deleteAllData 全5テーブル | dataOps.test.ts | ✅ |
| N7 | reassignOwner 付け替え | dataOps.test.ts | ✅ |

## 追加テストケース
なし。

## サマリー
| 項目 | 値 |
|---|---|
| 計画 | 19（owner/clerk/guest/useOwner/dataOps） |
| 追加 | 0 |
| 合計 | 19（プロジェクト累計 37） |
| 成功 | 19 |
| 失敗 | 0 |
| 成功率 | 100% |
