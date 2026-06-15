# 実装レポート: C20260616-001 ログイン状態で活動セットがパーシャル消失（データ消失 fix）

## 実装日時
2026-06-16 (JST)

## モード
fix

## 関連ドキュメント
- [001_ROOT_CAUSE.md] — 根本原因（5 Whys）
- [002_FIX_PLAN.md] — 修正計画
- [003_REGRESSION_TEST.md] — リグレッションテスト計画
- [004_POSTMORTEM.md] — Postmortem
- [AI_LOG セッション](../../AI_LOG/D20260616_004_tdd__shared_auth_fix_C20260616-001.md)

## 注意事項
本レポートのファイルパス・行番号は実装日時時点のもの。

## 変更一覧（単一 Phase・軽）

### 修正の核
**破壊的 `wipeOtherOwners`（owner 不一致ローカルを outbox ごと物理削除＝恒久喪失）を、非破壊的な「current owner への付け替え（保全）」に置換**。device-overwrite マーカー（既存アカウントサインインの検出）は維持し、それが起動する**アクションだけ**を「破棄」→「保全（concept §1.1 UC8 データ引き継ぎ）」に変更。

| ファイル | 変更内容 |
|---|---|
| `src/services/sync/localStore.ts` | `wipeOtherOwners`（破壊的・物理削除）を**削除**し、`reassignOwnerLocal(from,to)`（entity の owner 付け替え + 新 owner の outbox upsert 積み + 旧 owner 宛 stale outbox 除去、削除しない）と `reassignOtherOwnersTo(currentOwnerId)`（current 以外の全 owner を current へ付け替え保全）を**新設**。`wipeOwner`（O54 セルフ削除用）は不変。 |
| `src/app/repos.ts` | app 初期化の `consumeDeviceOverwrite()` 経路を `store.wipeOtherOwners(ownerId)` → `store.reassignOtherOwnersTo(ownerId)` に変更（コメントも是正）。 |
| `src/services/sync/localStore.test.ts` | 破壊を前提とする U-15 / U-07b を、保全・付け替えを検証する RT-3 / RT-5 / RT-2 / from===to no-op に置換。 |

### 不変（意図的に触れていない）
- `src/components/auth/AuthProvider.tsx`（`markDeviceOverwrite` 呼び出し）: マーカーは「既存アカウントサインイン」検出として正しく機能。起動するアクションのみ変えたため変更不要。
- `src/services/auth/deviceOverwrite.ts`（+ test）: マーカー機構は維持。
- `wipeOwner` / O54 セルフ削除: ユーザー意図の全削除は従来どおり（未同期含め全消去が正しい）。

## 実装計画からの差分

| 項目 | 内容 |
|---|---|
| 計画にない追加変更 | なし |
| 計画から省略した変更 | (1) **診断 console.log**: 根本原因は静的解析で確定済み・修正は構造的変更（タイミング推測ではない）ため不要と判断（CLAUDE.md「デバッグログは確証後削除」の趣旨に沿い、残さない方が安全）。(2) **「破棄（true overwrite）を確認付きで行う」UX 確認ダイアログ**: 確認文言は Class C（人間の創作判断）。本 fix はデータ消失を止める構造修正に限定し、保全をデフォルト化（安全側）。「既存アカウントにサインインしたらデバイスのゲストデータは破棄したい」という別意図が要るなら `/flow:revise` で UC-ACCT-OVERWRITE の確認付き破棄を別途設計（下記）。 |
| 想定外の問題と対処 | なし（全 248 テスト green、typecheck clean） |

### 設計判断（記録）
- R20260615-001 には UC-ACCT-LINK（連携＝保持）と UC-ACCT-OVERWRITE（既存アカウント＝デバイス上書き＝破棄）の 2 つの意図が併存し、本バグはユーザーが OVERWRITE 経路を踏んで「データ保持」を期待した不一致。**保全をデフォルトにした**のは concept §1.1 UC8（ログイン＝データ引き継ぎ）が中核価値であり、かつ保全は O54 セルフ削除で取り消せる**可逆な選択**（O35 / auto-pick-policy §1.5）だから。「明示的破棄」を望む場合の確認付きフローは follow-up `/flow:revise` 候補（Postmortem §8 に登録）。

## PR Description

### タイトル
fix(_shared/auth): 既存アカウントサインイン時のデータ消失を停止（破壊的 wipe → 非破壊的 owner 付け替え）

### 概要
既存 Google アカウントへサインインすると、デバイスにゲスト owner で取り残されたローカルデータが `wipeOtherOwners` により outbox ごと物理削除され、同期前のデータが恒久喪失していた（C20260616-001、パーシャル消失）。物理削除をやめ、current owner への非破壊的な付け替え（保全）に置換する。

### 変更内容
- `wipeOtherOwners`（物理削除）を撤去し `reassignOwnerLocal` / `reassignOtherOwnersTo`（保全・付け替え）を新設
- app 初期化の device-overwrite 経路を保全に切替（マーカー検出ロジックは不変）
- 破壊前提のテストを保全検証テストに置換

### テスト
- 全 248 テスト green（+ typecheck clean）。新規 RT-2/RT-3/RT-5 + from===to no-op。
