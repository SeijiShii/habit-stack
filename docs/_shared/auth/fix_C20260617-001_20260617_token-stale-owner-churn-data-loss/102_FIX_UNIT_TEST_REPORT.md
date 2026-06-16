# 単体テストレポート: C20260617-001 owner churn データ消失 fix

## 実施日時
2026-06-17（JST）

## 関連ドキュメント
- ./003_REGRESSION_TEST.md（計画）

## テスト実行環境
- ランタイム: Node 22 / Vitest 2.1.9
- DOM: jsdom（fake-indexeddb for IndexedDB）

## テスト結果（本 fix の新規 + 回帰）

| # | テストケース | ファイル | 結果 |
|---|---|---|---|
| 1-9 | guest JWT sign/verify 往復 / 空 secret / 改竄 / 別 secret / 形式不正 / iss 不一致 / 失効 / 長命 TTL / iss 固定 | guestToken.test.ts | ✅ 9/9 |
| 10-20 | localStorage get/store/clear / fetch 200・429・5xx・欠落 / buildEnsure（未保持取得・保持済 no-op）/ decodeGuestSub / null storage degrade / key | guestClient.test.ts | ✅ 11/11 |
| 21-23 | provisionGuest（genSub 署名 / 実署名往復 / defaultGenSub 一意） | guestProvision.test.ts | ✅ 3/3 |
| 24-28 | 複合 resolver（guest JWT→sub / 改竄→null / Bearer なし→Clerk / 非 guest iss→Clerk / 未認証→null） | guestOrClerkAdapter.test.ts | ✅ 5/5 |
| 29 | エンドポイント 503（secret 未設定） | api/auth/guest.test.ts | ✅ |
| 30 | エンドポイント 200 verify 可能 guestToken | api/auth/guest.test.ts | ✅ |
| 31 | エンドポイント 405（POST 以外） | api/auth/guest.test.ts | ✅ |
| 32 | **RT-1/RT-2: 未サインインゲストの owner=永続 sub、Clerk userId churn でも不変** | AuthProvider.test.ts (pickOwnerId) | ✅ |
| 33 | サインイン済 owner=Clerk userId | AuthProvider.test.ts | ✅ |
| 34 | guest sub 失敗→ローカルゲスト id degrade | AuthProvider.test.ts | ✅ |
| 35 | 未ロード→null | AuthProvider.test.ts | ✅ |

> RT-4（one-time migration reassign）は `localStore.test.ts` の `reassignOtherOwnersTo` 回帰（C20260616-001 fix で固定済、未削除・物理削除なし）でカバー。repos.ts は同 API を無条件呼び出しに変更。

## 追加テストケース
- `pickOwnerId` 純ロジック抽出（owner churn 免疫の不変条件を直接固定）。
- `decodeGuestSub`（owner キー用のクライアント sub decode）。

## サマリー
| 項目 | 値 |
|---|---|
| 本 fix 新規テスト | 28（guestToken9 + guestClient11 + guestProvision3 + adapter5）+ endpoint 改修3 + pickOwnerId 4 |
| 削除テスト | 10（旧 churn 機構 guestSession/linkWithGoogle/deviceOverwrite） |
| 全体 | 272 件 |
| 成功 | 272 |
| 失敗 | 0 |
| 成功率 | 100% |
| tsc | clean |

## audit step 3.9（CF-20260617-001）整合
- `required_signals_guest_identity_persistence`（getStoredGuestToken/storeGuestToken/signGuestToken/verifyGuestToken/GUEST_TOKEN_KEY/GUEST_TOKEN_ISS）が本 PJ に**存在**し、かつ実際に owner 決定で**使用**される。
- 旧 churn アンチパターン（Clerk ticket sign-in + createUser、永続なし）は**コードごと削除**。
- → 本 fix 後、habit-stack は audit step 3.9 を **PASS**（bousai と同型）。
