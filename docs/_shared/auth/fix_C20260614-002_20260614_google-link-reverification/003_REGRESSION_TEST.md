# リグレッションテスト計画: reverification 403 の可視化

> **入力**: `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`, src/features/account/AccountPage.test.tsx
> **最終更新**: 2026-06-14

---

## 1. 再発防止テストケース

### 1.1 直接原因を捉えるテスト（このバグが再発したら確実に検知）
| ID | 対象 | 入力 | 期待（修正前: 失敗 / 修正後: 成功） | 状態 |
|---|---|---|---|---|
| RT-1 | onLink の 403 ハンドル | `linkGoogle` が 403/reverification で reject | `AccountPage` が `role="alert"` でエラーを出す（無言でない）。修正前=無言失敗で alert 無し | 実装済 green |
| RT-2 | linkErrorMessage の分岐（403） | `Object.assign(new Error("additional verification"), {status:403})` | reverification 専用文言（「セッションの再確認が必要…」）を返す | 実装済 green |
| RT-3 | linkErrorMessage の分岐（汎用） | `new Error("network down")` | 汎用文言（「Google 連携を開始できませんでした…」）を返す | 実装済 green |

### 1.2 修正後に必ず通るテスト
| ID | 対象 | 期待 |
|---|---|---|
| RT-4 | busy リセット | 403 reject 後も `finally` で busy=false に戻り、ボタンが再度押せる |

## 2. 類似境界条件テスト
| ID | 境界条件 | 期待振る舞い |
|---|---|---|
| RT-5 | generic error（network）で reject | 汎用メッセージを `role="alert"` 表示（reverification 文言は出さない） |
| RT-6 | reverification 緩和後の正常系（aged guest） | 連携が開始し alert は出ない（release 実機 smoke で確認、下記 §4） |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| RT-7 | AccountPage 連携済み表示分岐 | isLinked 時の email + サインアウト表示は無改変 |
| RT-8 | AccountPage keyless（linkGoogle 未注入） | 「ローカルのみ利用中」表示は無改変 |
| RT-9 | AccountPage 削除導線（O54） | 削除確認 → 実行フローは無改変 |
| RT-10 | auth suite 全体 | additive 変更のため 32 tests green を維持・tsc clean |

## 4. リリース前 手動 / release smoke
| ID | シナリオ |
|---|---|
| SM-1 | **aged guest session（数十分放置 or シークレットで fresh と対比）で実機 Google 連携を踏み、403 にならず Google 同意画面まで遷移すること**（Clerk Dashboard reverification 緩和後）。release §3.4 #4.5（CF-20260614-001 で追加済）と対。fresh だけでは reverification が出ないため aged で踏むのが必須 |

## 5. Mock 方針
| 対象 | 固定値 | 理由 |
|---|---|---|
| `linkGoogle`（useOwner） | mock（403 reject / generic reject / 正常） | 実 Clerk reverification はローカルで再現不可。injectable seam で分岐網羅 |
| エラーオブジェクト | `{status:403}` + message "additional verification" | 本番観測値（chrome://inspect）を反映 |

## 6. カバレッジ目標
- 修正コード行（onLink catch / linkErrorMessage / alert 表示）: 100%
- 境界条件（403 / 汎用 / busy リセット）: 90%+

## 7. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版 | /flow:fix |
