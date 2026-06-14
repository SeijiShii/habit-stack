# _shared/auth 単体テスト計画（アカウント切替時の計時停止条件緩和 + 同期ポリシー）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, Step 2 で読んだ既存テスト（AccountPage.test / AuthProvider.test / executionRepo.test / localStore.test / selfDelete.test）
> **最終更新**: 2026-06-15

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| U-01 | AccountPage onLink（進行中なし） | findInProgress=undefined、ログイン押下 | 確認ダイアログを出さず linkGoogle を即実行 |
| U-02 | AccountPage onLink（進行中あり・OK） | findInProgress=session、押下→確認 OK | endInProgressNow(now) 呼出（保存）→ その後 linkGoogle 実行 |
| U-03 | AccountPage onSignOut（進行中あり・OK） | findInProgress=session、押下→確認 OK | endInProgressNow → signOut 実行 |
| U-04 | AccountPage onSignOut（進行中なし） | findInProgress=undefined | 確認なしで signOut |
| U-05 | App onSignOut 合成（spec-review R1） | ownerSignOut + store mock | signOut 前に捕捉した ownerId に対し store.wipeOwner が呼ばれる（AuthProvider でなく App 層合成） |
| U-06 | 既存ユーザーサインイン後の表示（spec-review R2） | owner=B へ切替後 | getAllByOwner(B) のみ表示。旧 guest(A) データは非表示。app init cleanup で A のローカルが wipe される |
| U-07 | linkGoogle（未連携・新規連携成立、**保持 no-wipe ロックイン** P11/R3） | createExternalAccount 成功（同一 userId） | wipeOwner/cleanup は呼ばれない（データ保持）。owner 不変で作成済みデータが getAllByOwner に残る |
| U-08 | endInProgressNow（保存） | 進行中 running セッション | session.status='done' + records 永続（既存挙動の回帰固定、strict 達成） |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U-09 | AccountPage onLink（確認キャンセル） | 確認ダイアログでキャンセル | endInProgressNow も linkGoogle も呼ばれない（計時継続・切替中止） |
| U-10 | AccountPage onSignOut（確認キャンセル） | キャンセル | signOut 呼ばれず、進行中も停止しない |
| U-11 | AuthProvider signOut（wipe 失敗） | wipeOwner が reject | clerk.signOut は完了し、エラーで握り潰さない範囲で best-effort（サインアウト自体は成功扱い） |
| U-12 | wipeOwner（存在しないストア/空 owner） | 該当データなし | 例外なく no-op（冪等） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U-13 | findInProgress（paused 状態） | status='paused'（done でない） | 進行中ありとして確認ダイアログを出す |
| U-14 | LoginEndGuard 撤去後の `/account` 描画 | path=/account へ遷移 | endInProgressNow が呼ばれない（path 停止の不発火を固定） |
| U-15 | 複数 owner ローカル混在時の wipeOwner | owner=A wipe、owner=B 残置 | A のみ削除、B は getAllByOwner で残る（[論点-001] 案A 現 owner 限定の固定） |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| M-01 | App.test（path 停止）※spec-review R4 | 既存 App.test は `/account` 到達・描画のみ assert（**path 停止は未 assert**）→ 「修正」より **U-14（非停止）新規追加が主**。既存に壊れる assert はほぼ無い | U-14 を追加し path 停止廃止を固定 | 停止契機を path→明示アクションへ。`isLoginPath`/recovery.test は残置 |
| M-02 | AccountPage signOut 既存テスト（spec-review R1） | AccountPage が useOwner().signOut を直接呼ぶ前提 | App 注入の `onSignOut`（wipe 合成）経由を検証。AuthProvider.signOut 自体は clerk.signOut のまま | wipe 配線を App 層へ移動 |
| M-03 | AccountPage onLink/onSignOut 既存テスト | 押下で即 linkGoogle/signOut | 進行中なし時のみ即実行、ありは確認経由 | 確認ゲート追加 |

## 3. 削除テストケース

| ID | 対象 | 削除理由 |
|---|---|---|
| D-01 | `isLoginPath` 起因の自動停止に依存するテスト（あれば） | path 停止を廃止。M-01 / U-14 で代替（`isLoginPath` を他で使わないなら関連テストも撤去） |

## 4. リグレッション強化

- **R20260614-001（計時中可視化）**: 一覧「進行中」バッジ・別セット二重開始ガード・auto-start が停止契機変更後も維持されること（進行中は `/account` 閲覧で消えない）。
- **R20260611-002（O54 セルフ削除）**: `purgeAllData`（サーバ + ローカル削除）は本改修の signOut wipe（ローカルのみ）と別物として共存し、どちらも回帰グリーン。
- **C20260614-002（Google ログイン統合/自動分岐 + churn 抑止）**: refreshGuestTicket 経路・signInWithGoogle fallback が確認ゲート挿入後も成立。
- **endInProgressNow の保存/達成（strict）**: 既存挙動を固定（停止でデータが消えない＝要望3 の核）。

## 5. Mock 方針差分

| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| Clerk（useClerk/useSignIn/useUser） | injectable mock（既存 AuthProvider.test） | 継続。signOut→wipeOwner 検証用に LocalStore mock/spy を追加 | wipe 呼出の検証 |
| LocalStore | 実 fake-indexeddb（localStore.test） | 継続。AccountPage/AuthProvider 側は wipeOwner を spy | 副作用検証 |
| executionRepo.findInProgress / endInProgressNow | — | AccountPage テストで stub/spy（進行中有無の分岐 + 保存呼出） | 確認ゲートの分岐検証 |

## 6. カバレッジ目標

| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 75% | 確認ゲート（進行中有無 × OK/キャンセル）+ ログイン経路（連携/上書き）の分岐網羅を強化 |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-15 | 初版作成 | /flow:revise |
