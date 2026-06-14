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
| U-05 | AuthProvider signOut | clerk.signOut mock | clerk.signOut 後に store.wipeOwner(現 ownerId) が呼ばれる |
| U-06 | signInWithGoogle fallback（既存ユーザー） | createExternalAccount 失敗→fallback | 旧 guest ownerId に対し wipeOwner が呼ばれてから account 切替（上書き） |
| U-07 | linkGoogle（未連携・新規連携成立） | createExternalAccount 成功（同一 userId） | wipeOwner は呼ばれない（データ保持）。owner 不変で作成済みデータが getAllByOwner に残る |
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
| M-01 | App / LoginEndGuard 既存テスト | `/account` 遷移で endInProgressNow が呼ばれることを検証 | 「呼ばれないこと」を検証（または当該テスト削除し U-14 に置換） | 停止契機を path から明示アクションへ移行 |
| M-02 | AuthProvider signOut 既存テスト | clerk.signOut のみ検証 | clerk.signOut + wipeOwner 呼出を検証 | サインアウト時デバイス削除追加 |
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
