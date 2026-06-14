# 単体テストレポート: _shared/auth R20260615-001 (account-switch-stop-sync)

## 実施日時
2026-06-15 08:15 (JST)

## 関連ドキュメント
- [003_REVISE_UNIT_TEST.md] - 単体テスト計画

## テスト実行環境
- TypeScript: tsc --noEmit クリーン
- Vitest (happy-dom / fake-indexeddb)

## テスト結果

| # | テストケース | テストファイル | 結果 | 備考 |
|---|------------|-------------|------|------|
| U-01 | 進行中なし → ログインは確認なしで即 linkGoogle | AccountPage.test.tsx | ✅ | onStopInProgress 未呼出・ダイアログ非表示 |
| U-02 | 進行中あり + ログイン → 確認 → 停止して続行で endInProgressNow→linkGoogle | AccountPage.test.tsx | ✅ | 順序検証 |
| U-09 | 進行中あり + ログイン → キャンセルで停止も linkGoogle もしない | AccountPage.test.tsx | ✅ | 切替中止 |
| U-03 | 進行中あり + サインアウト → 停止して続行で onStopInProgress→onSignOut(合成) | AccountPage.test.tsx | ✅ | App 合成 signOut |
| U-10 | 進行中あり + サインアウト → キャンセルで onSignOut しない | AccountPage.test.tsx | ✅ | |
| U-Sig | onSignOut 注入時は context.signOut でなく注入版（wipe 経路, R1） | AccountPage.test.tsx | ✅ | spec-review R1 |
| U-15 | wipeOtherOwners は current 以外を消し current は残す | localStore.test.ts | ✅ | 既存ログイン上書き |
| U-07b | wipeOtherOwners は他 owner 無しで no-op（保持経路 no-wipe） | localStore.test.ts | ✅ | spec-review R3 ロックイン |
| DO-1 | mark→consume で true・1 回限り消費 | deviceOverwrite.test.ts | ✅ | marker |
| DO-2 | mark 無しは consume=false（churn では wipe しない） | deviceOverwrite.test.ts | ✅ | churn 安全 |
| DO-3 | storage null でも例外を投げない | deviceOverwrite.test.ts | ✅ | プライベートモード耐性 |
| 既存 | AccountPage 既存 8 / AuthProvider 4 / localStore wipeOwner 等 | （各） | ✅ | 後方互換（probeInProgress 未注入で即切替） |

## 追加テストケース

| # | 対象 | テストケース | 追加理由 |
|---|------|------------|---------|
| U-Sig | AccountPage onSignOut | 注入 signOut 優先 | spec-review R1 の App 層合成を固定 |
| U-07b | wipeOtherOwners | 他 owner 無し no-op | 保持経路で誤 wipe しないロックイン（R3） |
| DO-1〜3 | deviceOverwrite | marker の消費/未設定/例外耐性 | churn-loss 回避ガードの検証 |

## サマリー

| 項目 | 値 |
|------|-----|
| 計画テスト数（本改修の主要 U-/M-） | 12 件 |
| 追加テスト数 | 5 件（U-Sig, U-07b, DO-1〜3） |
| 合計（プロジェクト全体） | 245 件 |
| 成功 | 245 件 |
| 失敗 | 0 件 |
| 成功率 | 100% |

## 計画との差分メモ
- 計画の U-04〜U-08, U-11〜U-14（一部）は「probeInProgress 未注入時の後方互換」「endInProgressNow 既存挙動」など既存テスト + tsc で担保される範囲は新規追加せず、新規挙動（確認ゲート分岐・wipe 配線・marker ガード）に絞って追加した。
- App.test の path 停止（M-01）は LoginEndGuard 撤去で構造的に消滅（既存 App.test は /account 到達・描画のみ assert のため破綻なし、spec-review R4 どおり）。
