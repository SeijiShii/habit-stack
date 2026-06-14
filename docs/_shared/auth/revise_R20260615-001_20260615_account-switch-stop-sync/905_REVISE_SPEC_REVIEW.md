<!-- auto-generated-start -->
# 設計レビューレポート — _shared/auth R20260615-001 (account-switch-stop-sync)

**レビュー日**: 2026-06-15
**レビュー実施者**: Claude (opus-4-8) + seiji
**対象**: revise_R20260615-001_20260615_account-switch-stop-sync の 001-004
**入力**: 001_REVISE_SPEC / 002_REVISE_PLAN / 003_REVISE_UNIT_TEST / 004_REVISE_E2E_TEST + concept.md + 実コード（App / AccountPage / AuthProvider / ownerContext / executionRepo / localStore / repos / selfDelete / recovery）
**観点ソース**: 組み込みチェックリスト + ~/.claude/flow-data/review-perspectives.md (P2, P11, P19, P25, P83 を適用)
**モード**: auto-pick
**severity-threshold**: low（Info も参考掲載）

## 1. レビューサマリー

| 観点 | 評価 | 備考 |
|------|------|------|
| 仕様の明確性 | OK | 変更前/後・ポリシー 3 経路が明示 |
| 既存パターンとの一貫性 | 要確認→是正 | wipe 配線層が AuthProvider 指定だが LocalStore 非到達（R1） |
| 影響範囲・副作用 | 要確認→是正 | 上書きパス物理 wipe が OAuth リダイレクトで同期不能（R2）。副作用分岐（R3） |
| API 流用・責務逸脱 | OK | wipeOwner 再利用は responsibilities 一致（O54 と区別済） |
| 既存実装の再利用 | OK | clearLocalData を新設せず wipeOwner 再利用（P19 充足） |
| データ移行・互換性 | OK | スキーマ不変・migration 不要 |
| 権限・認可 | OK | owner スコープに閉じる（SEC-001） |
| テストカバレッジ | 要確認→補強 | M-01 は「既存修正」でなく「非停止の固定」主体（R4） |
| UX・操作性 | OK | 確認キャンセル=切替中止が明示（P18 充足） |

総合: **実装可。ただし R1（wipe 配線層）は実装前に SPEC/PLAN へ反映必須**。Critical なし。

## 2. 指摘事項 (severity 降順)

### [R1] サインアウト時 wipe の配線層が誤り — AuthProvider は LocalStore 非到達 (severity=High)
- **対象**: 001 §2.2/§7.2, 002 §1（AuthProvider.signOut）
- **現状**: 「`AuthProvider.signOut` に `store.wipeOwner(ownerId)` を追加」と記載。
- **問題**: `AuthProvider`（`ClerkOwnerBridge`）は **repos レイヤより上**で、`LocalStore` インスタンスを保持しない（`repos.ts` で owner 確定後に `LocalStore.open()` → 各 Repo を生成）。AuthProvider 内で wipeOwner は呼べない。
- **推奨**: **App 層で合成**する（既存 `onDeleteAllData`=purgeAllData と同パターン）。`App` が `repos.store` / `repos.ownerId` を握っているので、`onSignOut = async () => { const oid = repos.ownerId; await ownerSignOut(); await repos.store.wipeOwner(oid); }` を AccountPage に注入。**ownerId は signOut 前に捕捉**（signOut 後は新ゲストへ切替わるため）。
- **種別**: 指摘事項（自動反映）
- **chosen**: App 層合成に変更。AuthProvider.signOut は `clerk.signOut()` のままにし、デバイス wipe は App→AccountPage 経路で配線。
- **反映先**: 001 §2.2/§7.2, 002 §0/§1/§8

### [R2] 上書きパスの物理 wipe は OAuth リダイレクトで同期実行不能 (severity=Medium)
- **対象**: 001 §7.1 UC-ACCT-OVERWRITE, 002 Phase 3
- **現状**: 「signInWithGoogle fallback で旧 guest owner を wipeOwner → account データ pull」。
- **問題**: `signInWithGoogle` / fallback は `authenticateWithRedirect` で **Google へページ遷移**し、戻りは `/sso-callback` → 新セッション。旧 guest owner の wipe を「切替と同一 JS コンテキスト」で同期実行できない（ページが飛ぶ）。
- **推奨**: 「上書き」UX は **owner スコープ read 分離で自動成立**（新 owner は account データのみ getAllByOwner、guest データは非表示）。物理 cleanup は **app 初期化時に「current owner 以外のローカルデータを wipe」** する opportunistic 方式（または当面 orphan 許容）。fragile な cross-redirect wipe を避ける。
- **種別**: 指摘事項（自動反映）
- **chosen**: 視覚上の上書きは read 分離で担保。物理削除は app init の非 current-owner cleanup（[論点-003] として記録、tdd で確定）。
- **反映先**: 001 §7.1 / §9, 002 Phase 3

### [R3] 保持(linkGoogle) と 上書き(signInWithGoogle) の副作用分岐を明示 (severity=Medium, P11)
- **対象**: 001 §7.1, 003 U-06/U-07
- **現状**: 連携=保持 / 既存=上書き は記載済。
- **問題**: P11。モード分岐（新規連携 vs 既存サインイン）で **wipe 副作用を必ず分岐**し、保持経路では絶対に wipe しないことをテストで固定する必要。
- **推奨**: U-07（連携成功=wipe 呼ばれない）/ U-06（fallback=旧 owner wipe or cleanup 対象）を必須化（既に test 計画にあり、明示を強化）。
- **種別**: 指摘事項（自動反映）
- **chosen**: 003 に副作用分岐固定を明記（保持経路の no-wipe を回帰ロックイン）。
- **反映先**: 003 §1.1/§4

### [R4] LoginEndGuard 撤去後 isLoginPath は production caller ゼロ・既存 App.test は path 停止を未 assert (severity=Low, P2)
- **対象**: 002 §3, 003 M-01
- **現状**: D-01 で isLoginPath 関連テスト撤去を示唆。M-01 は「既存テストを修正」と記載。
- **問題**: P2 の Grep 結果 — `isLoginPath` の production caller は LoginEndGuard（App.tsx）のみ。撤去後は recovery.ts 定義 + recovery.test のみ残る。`App.test.tsx` は `/account` 到達・描画は assert するが **path 停止挙動は未 assert**。よって M-01 は「既存修正」ではなく **U-14（/account 閲覧で endInProgressNow が呼ばれない）の新規追加が主**。
- **推奨**: `isLoginPath` 定義 + recovery.test は **残置**（無害・再利用余地）。LoginEndGuard 利用のみ削除。M-01 を「U-14 追加（非停止固定）」に読み替え。
- **種別**: 指摘事項（自動反映）
- **chosen**: isLoginPath 残置、recovery.test 維持。UNIT の M-01 注記を補正。
- **反映先**: 002 §3, 003 §2

### [R5] 既存アカウントだがデータ空のサインイン時の挙動 (severity=Low / Info, P25)
- **対象**: 001 §7.1 UC-ACCT-OVERWRITE
- **現状**: 「既存データ持ち=上書き」。
- **問題**: 「アカウント=SoT」方針では、既存 Clerk user でも **データ空**ならサインイン後に device が空表示になり、guest データは視覚上消える。要望5「データが既に存在する場合」の境界（空アカウント）は未定義。
- **推奨**: 既定は「既存ユーザーサインイン=常に owner 切替（account=SoT）」で一貫（空でも device は account を映す）。エッジとして [論点-004] に記録。判定は createExternalAccount 成否（BE/Clerk 由来、P25 準拠）で行い FE state に依存しない。
- **種別**: 設計判断項目（auto-pick）
- **chosen**: account=SoT で一貫（空アカウントでも切替）。論点として明記。
- **反映先**: 001 §9 [論点-004]

### [R6] 旧 LoginEndGuard は useEffect 起因 → 撤去で StrictMode 誤発火リスクも解消 (severity=Info, P83)
- **対象**: 001 §2.2
- **内容**: 旧停止は `useEffect([pathname])` 由来。撤去で StrictMode 二重実行起因の誤停止懸念も消える。新 wipe・確認はイベント駆動（onClick）+ state で StrictMode 安全。
- **chosen**: 追加対応不要（撤去で改善）。Info 記録のみ。

## 3. コードベース調査結果

### 3.1 既存パターン
- セルフ削除（O54）: `App` が `repos.store` + `repos.ownerId` を握り `purgeAllData({store, ownerId})` を AccountPage.onDeleteAllData に注入（**破壊的ローカル操作は App 層で配線する既存パターン**）。→ R1 はこのパターンに揃える。
- owner 切替・churn 抑止: AuthProvider の refreshGuestTicket / signInWithGoogle fallback（C20260614-002）が既に二経路を実装。
- 進行中検出: `repos.execution.findInProgress()` を App の SetsRoute/RunInner が既に利用 → AccountPage ゲートも同じ口で取得可。

### 3.2 影響範囲分析（P2 全参照）
| 変更対象 | 既存呼び出し箇所 | 呼び出し元の前提（契約） | 破壊リスク |
|---|---|---|---|
| `LoginEndGuard` | App.tsx のみ | path=/account で進行中終了 | なし（撤去対象、App.test は path 停止を未 assert） |
| `endInProgressNow` | App.tsx(LoginEndGuard), executionRepo(.test) | 進行中を保存して done。no-op safe | 低（呼び出し位置を AccountPage へ移動） |
| `isLoginPath` | App.tsx(LoginEndGuard), recovery(.test) | path 判定 pure fn | なし（残置、利用元のみ消える） |
| `wipeOwner` | selfDelete, repos(型), localStore(.test) | owner 配下ローカル + outbox 物理削除、サーバ非干渉 | なし（再利用） |
| `signOut` | ownerContext(型), AccountPage, AuthProvider(def) | Clerk セッション破棄 | 中（wipe 合成を App 層に置く必要、R1） |
| `findInProgress` | App.tsx, executionRepo(.test) | status!=done を 1 件返す | なし |
| `purgeAllData` | App, AccountPage, selfDelete(.test) | サーバ+ローカル全削除（O54） | なし（signOut wipe と別物として共存、要区別） |

### 3.3 API 責務の評価
- `wipeOwner` 再利用は責務一致（ローカル owner wipe）。O54 `purgeAllData`（サーバ+ローカル）とは責務が異なり、**サインアウト wipe=ローカルのみ** で混同しないこと（004 E-R3 で両立を回帰）。
- 停止責務（endInProgressNow）は execution の所掌のまま。AccountPage は「確認 + 呼び出し」のみで責務逸脱なし。

## 4. 設計判断ログ

| # | 判断項目 | 結論 | chosen_type | 反映先 |
|---|---|---|---|---|
| D1 (R1) | signOut wipe の配線層 | App 層合成（purgeAllData パターン）。ownerId は signOut 前に捕捉 | auto-recommended | 001 §2.2/§7.2, 002 §0/§1/§8 |
| D2 (R2) | 上書きパスの物理 wipe | 視覚上書き=read 分離で担保、物理は app init 非 current-owner cleanup（[論点-003]） | auto-recommended | 001 §7.1/§9, 002 Phase3 |
| D3 (R3) | 保持/上書きの副作用分岐 | 保持経路 no-wipe を回帰ロックイン | auto-recommended | 003 §1.1/§4 |
| D4 (R4) | isLoginPath / M-01 | isLoginPath 残置、M-01 を U-14 追加主体に補正 | auto-recommended | 002 §3, 003 §2 |
| D5 (R5) | 空アカウント サインイン | account=SoT で一貫切替（[論点-004]） | auto-recommended | 001 §9 |

## 5. 次のステップ
- 反映済み 001-003 を確認
- `/flow:tdd _shared/auth R20260615-001` で実装着手（Phase 1=停止緩和+確認、Phase 2=signOut wipe[App 層], Phase 3=上書き cleanup, Phase 4=保持検証）
<!-- auto-generated-end -->
