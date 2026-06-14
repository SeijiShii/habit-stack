# 実装レポート: _shared/auth R20260615-001 (account-switch-stop-sync)

## 実装日時
2026-06-15 08:15 (JST)

## モード
revise

## 関連ドキュメント
- [001_REVISE_SPEC.md] - 変更仕様書
- [002_REVISE_PLAN.md] - 変更計画書
- [003_REVISE_UNIT_TEST.md] - 単体テスト計画
- [905_REVISE_SPEC_REVIEW.md] - 設計レビュー（R1-R6 反映）
- [AI_LOG セッション](../../../AI_LOG/D20260615_003_tdd__shared_auth_revise_R20260615-001.md)

## 注意事項
本レポートのファイルパス・行番号は実装日時時点のもの。以後の変更でずれる可能性あり。

## 変更一覧

### Phase 1: 停止トリガ緩和（LoginEndGuard 撤去）+ 確認ゲート
- `src/App.tsx`:
  - `LoginEndGuard`（`isLoginPath` 起因の `endInProgressNow`）を**撤去**。`/account` 閲覧では計時が止まらない。
  - 未使用化した `useEffect` import / `isLoginPath` import を削除。
  - `AccountRoute` を新設し、`/account` ルートに配線。`probeInProgress`（`execution.findInProgress` → boolean）と `onStopInProgress`（`endInProgressNow`）を AccountPage に注入。
- `src/features/account/AccountPage.tsx`:
  - props 追加: `onSignOut?`, `probeInProgress?`, `onStopInProgress?`。
  - アカウント切替（ログイン/サインアウト）を `requestSwitch(kind)` に集約。`probeInProgress()` が真なら確認ダイアログ（`pendingSwitch` state）を表示、偽なら即 `runSwitch`。
  - 確認ダイアログ「計時中の活動があります。停止しますか？」: 「停止して続行」→ `onStopInProgress()`（保存停止）→ 切替続行 / 「キャンセル」→ 切替中止（計時継続）。

### Phase 2: サインアウト時デバイス削除（要望6、App 層合成 spec-review R1）
- `src/App.tsx` `AccountRoute`:
  - `onSignOut = async () => { const oid = repos.ownerId; await signOut(); await repos.store.wipeOwner(oid); }`。
  - ownerId は signOut 前に捕捉（signOut 後は新ゲストへ切替わるため）。サーバ非干渉（既存 `wipeOwner` 再利用、O54 purgeAllData とは別物）。
  - AuthProvider.signOut は `clerk.signOut()` のまま（LocalStore 非到達のため wipe を持たせない）。

### Phase 3: 既存データ持ちログイン時の上書き（要望5、read 分離 + marker ガード init cleanup spec-review R2/R3）
- `src/services/sync/localStore.ts`: `wipeOtherOwners(currentOwnerId)` 追加（current 以外の全 owner ローカルを物理削除、サーバ非干渉）。
- `src/services/auth/deviceOverwrite.ts`（新規）: `markDeviceOverwrite` / `consumeDeviceOverwrite`。既存アカウントサインインの意図を OAuth リダイレクト跨ぎで 1 回限り伝える sessionStorage marker。
- `src/components/auth/AuthProvider.tsx`: `signInWithGoogle` と自動 fallback（createExternalAccount 失敗=既存アカウント）の**リダイレクト直前に `markDeviceOverwrite()`**。
- `src/app/repos.ts`: app 初期化 effect で `consumeDeviceOverwrite()` が真のときだけ `store.wipeOtherOwners(ownerId)`。**単なるゲスト churn では marker が立たない**ため誤 wipe しない（要望4 保持と両立）。
- 視覚上の上書きは既存の owner スコープ read 分離（`getAllByOwner`）で自動成立（コード変更不要）。

### Phase 4: 未連携ログイン保持の回帰（要望3/4）
- 保持は既存の `createExternalAccount` 同一 userId 維持で成立（コード追加なし）。
- ロックイン: `wipeOtherOwners` は他 owner ゼロ時 no-op（U-07b）、marker 無し時 cleanup 不発（deviceOverwrite テスト）で「保持経路 no-wipe」を固定。

## 実装計画からの差分

| 項目 | 内容 |
|------|------|
| 計画にない追加変更 | `deviceOverwrite.ts`（marker）を新設。spec-review R2/R3 の「churn 安全な上書き cleanup」を実現するため、PLAN の「app init で非 current-owner cleanup」を **marker ガード付き**に具体化（churn-loss 回避） |
| 計画から省略した変更 | `useAccountSwitch.ts`（任意 hook）は作らず AccountPage 内に集約（小規模で十分） |
| 想定外の問題と対処 | `wipeOtherOwners` を init で無条件実行すると churned guest データを消す危険（要望4 と逆行）→ marker ガードで「明示的な既存アカウントサインイン時のみ」に限定 |

## PR Description

### タイトル
_shared/auth R20260615-001: アカウント切替時のみ計時停止（確認付き）+ デバイス⇔アカウント同期ポリシー

### 概要
`/account` 閲覧での計時強制停止を撤去し、Google ログイン/サインアウトという明示的なアカウント切替時のみ、確認のうえ計時を保存停止する。あわせてデバイス⇔Google アカウント間の同期ポリシー（未連携=保持アップロード / 既存=デバイス上書き / サインアウト=デバイス削除）を配線し、強制停止時のデータ消失を是正する。

### 変更内容
- LoginEndGuard 撤去（path 起因停止の廃止）
- AccountPage に確認ゲート（「計時中の活動があります。停止しますか？」）
- サインアウト時のデバイスローカル wipe（App 層合成・サーバ無傷）
- 既存アカウントサインイン時のデバイス上書き（read 分離 + marker ガード cleanup）

### テスト
- 単体: 245 passed（新規/拡充: AccountPage 確認ゲート 7・deviceOverwrite 3・localStore wipeOtherOwners 2）
- tsc --noEmit クリーン
