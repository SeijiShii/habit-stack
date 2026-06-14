# 修正計画: reverification 403 の可視化（防御）+ Clerk 設定緩和（機能修正）

> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, src/features/account/AccountPage.tsx, src/services/auth/linkWithGoogle.ts, src/services/auth/dataOps.ts
> **最終更新**: 2026-06-14

---

## 0. 方針サマリ（2 トラックを明確に分離）
本バグの「ボタンが動かない」を直す**機能修正は Clerk Dashboard の設定**であり、コードだけでは動かない。コードは**失敗を二度と無言にしない防御 UX**を担う。両者を混同しないため、下記 3 つを明示する。

## 1. 改修トラック

### 1.1 PRIMARY — 機能修正（ボタンを動かす）／ user・dashboard 作業（Class C）
**Clerk Dashboard で reverification（step-up 再認証）を無効化／緩和する。**
- ゲスト中心アプリでは「初回外部アカウント連携＝アップグレードそのもの」に step-up を課す意味が薄い（ゲストは factor を持たず完了できないため、実質ロックアウトにしかならない）。
- これで**既存コードが aged guest でも動く**（403 が出なくなる）。
- 作業: User が Clerk Dashboard → 本番 instance → Sessions / User & Authentication の reverification（step-up）設定を確認し、`createExternalAccount` 系に課す reverification を緩和。
- ⚠️ human dashboard（Class C）。コードコマンドでは自動実行不可。

### 1.2 CODE（本 fix・実装済み）— 防御 UX（失敗を無言にしない）
**403 / reverification を catch して画面に `role="alert"` でメッセージ表示する。**
- 単体ではボタンを動かさない（機能修正は 1.1 の設定）が、失敗が**二度と無言にならない**。
- = 「無言失敗を撲滅」。原因究明の遅延（今回の最大コスト）を再発させない。

### 1.3 CODE option（堅牢・今回未実装）— データ安全リスクあり
連携直前にゲストセッションを fresh 化（新 ticket → `signIn.create({strategy:'ticket'})` → `setActive`）して reverification window 内に入れる案。
- ただし guest endpoint（`api/auth/guest`）は userId param が無く**毎回新しい guest userId** を発行するため、userId が変わる。
- → `src/services/auth/dataOps.ts` の `reassignOwner` で旧 owner のローカルデータ（IndexedDB）を新 owner へ移行する必要があり、OAuth リダイレクト往復をまたぐデータ継続性の慎重な実装＋検証が要る。
- **本セッションでは未実装**。必要なら別 follow-up。Clerk 設定（1.1）が最短・最安全。

## 2. 修正対象ファイル（CODE トラック = 実装済み）

| ファイル | 修正内容 | before | after |
|---|---|---|---|
| `src/features/account/AccountPage.tsx` | `linkError` state 追加 + `onLink` に **catch** 追加（旧 try/finally は catch 無し＝無言）。`linkErrorMessage(e)` helper を export（403/reverification 検出→専用文言、else 汎用）。`<p role="alert">{linkError}</p>` を render | catch 無し・失敗無言 | catch + linkError 表示 |
| `src/features/account/AccountPage.test.tsx` | テスト追加: 「reverification 403 で失敗→無言でなくエラー表示」「linkErrorMessage が reverification(403) と汎用を区別」 | — | auth suite 32 tests green, tsc clean |

## 3. 修正範囲の限定方針
- CODE トラックは **AccountPage の onLink に catch + 可視化を足すのみ**（純粋に additive）。既存のゲスト/連携済/keyless/削除導線分岐は無改変。
- 機能修正（reverification 緩和）はコードに触れず Clerk Dashboard で行う（1.1）。

## 4. 副作用なき確認方法
- 既存テスト維持: `src/features/account/*.test.tsx`（連携済/keyless/削除導線）を破壊しない。
- 追加テスト: 003_REGRESSION_TEST.md 参照。
- 手動確認（release 実機）: **aged guest session（数十分放置 or シークレットで fresh と対比）で実機 Google 連携を踏み 403 にならないこと**（Clerk 設定緩和後）。release §3.4 #4.5（CF-20260614-001 で追加）と対。

## 5. リリース戦略
- 方式: 通常リリース。CODE トラック（catch + 可視化）は additive で feature flag 不要。
- severity=high だが production incident（ダウン）ではなく aged guest の機能不全のため、hotfix 緊急展開は不要。
- 展開計画: ① CODE（catch+可視化、Class A、実装済み）→ ② Clerk Dashboard で reverification 緩和（Class C、PRIMARY 機能修正）→ ③ 再デプロイ → ④ **aged guest session で実機 Google 連携 1 回検証**（fresh だけでは検知不能）。
- ⚠️ CODE 単体ではボタンは動かない。**ボタンを動かすのは ② の設定**。

## 6. ロールバック方針
- CODE: revert で戻せる（additive、データ非破壊）。
- Clerk 設定: Dashboard で reverification を再有効化すれば戻る（連携済ユーザーへの影響なし）。

## 7. 関係者通知
- 通知先: seiji（Clerk Dashboard の reverification 設定は本人作業 = Class C）。
- タイミング: CODE 実装完了 → release で reverification 緩和を 1問1答案内。

## 8. DoD
- [x] `onLink` に catch + `linkError` state + `role="alert"` 表示（無言失敗の撲滅）
- [x] `linkErrorMessage(e)` export（403/reverification → 専用文言 / else 汎用）
- [x] 追加テスト green（auth suite 32 tests）+ tsc clean
- [ ] **（release）Clerk Dashboard で reverification 緩和**（PRIMARY 機能修正、Class C）
- [ ] **（release）aged guest session で実機 Google 連携が 403 にならず通る**（§3.4 #4.5 smoke）
- [ ] 既存 AccountPage テスト（連携済/keyless/削除導線）を破壊しない

## 9. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版 | /flow:fix |
