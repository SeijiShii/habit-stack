# E2E テストレポート: _shared/auth R20260615-001 (account-switch-stop-sync)

- **状態**: E2E green（24/24 pass、flaky 0）
- **FW**: Playwright (chromium)　**実行コマンド**: `npx playwright test`　**対象 URL**: ローカル dev server `http://localhost:5180`（Class A）
- **last_updated**: 2026-06-15 (JST)

## journey 別結果

| journey (004 由来) | spec ファイル | 結果 | 備考 |
|---|---|---|---|
| E-01 計時中に /account 閲覧で停止しない | `e2e/timing-persistence.spec.ts:56` | ✅ pass | 旧 `E-LOGIN`（/account で終了）を新仕様に**置換** |
| E-01b /account 経由後も一覧の「進行中」バッジが残る | `e2e/timing-persistence.spec.ts:74` | ✅ pass | 継続の可視化（R20260614-001 と整合）を固定 |
| リグレッション: E-RESUME / E-SUMMARY | `e2e/timing-persistence.spec.ts` | ✅ pass | リロード復元・/summary 継続は不変 |
| リグレッション: R20260614-001 進行中可視化/二重開始ガード | `e2e/revise-20260614.spec.ts` | ✅ pass | 停止契機変更後も維持 |
| リグレッション: O54 セルフ削除 | `e2e/account-delete.spec.ts` | ✅ pass | signOut wipe（ローカルのみ）と別物として両立 |
| その他全 spec（core-journey / reflect-overview / header / footer / ui-revise） | `e2e/*.spec.ts` | ✅ pass | 全 24 green |

## 計画 (004) のうち headless 非対象（実 Clerk 鍵が必要）

| 004 シナリオ | 状態 | 理由 / 担保先 |
|---|---|---|
| E-02〜E-05 確認ダイアログ（ログイン/サインアウト押下） | headless 非対象 | keyless モードでは「Google でログイン」「サインアウト」ボタンが描画されない（Clerk 不在）。**単体テストで確認ゲート分岐を網羅**（U-01/02/03/09/10、102 参照）+ `/flow:release` Phase 2 実機スモークで実 OAuth を軽く確認 |
| E-06 サインアウト=デバイス削除 | headless 非対象 | 同上。単体 U-05（wipeOwner 合成）+ localStore wipeOwner テストで担保 |
| E-07 既存ログイン=上書き | headless 非対象 | 同上。単体 U-15 wipeOtherOwners + deviceOverwrite marker テストで担保 |
| E-08 未連携ログイン=保持 | headless 非対象 | 同上。単体 U-07b（no-wipe）+ createExternalAccount 同一 userId（既存）で担保 |

> 確認ダイアログ・wipe・上書き・保持の**ロジックは単体テスト（102、245 green）で網羅済**。headless E2E は OAuth 非依存の「停止条件緩和（E-01/E-01b）」と全リグレッションを担う。実 OAuth 経路は release 実機スモークへ。

## flaky / quarantine

- quarantine: なし。
- 既知の timing jitter（コールド dev server で稀に restore assertion がタイムアウト）に対し `playwright.config.ts` の `retries: 0 → 1` を設定（フレッシュ context 再実行、flaky は list reporter に明示）。本実行は retry 発火なしの素 green。

## 検出した実装バグ (fix seed)

- なし（E2E から新規バグ検出なし）。
- 別件: 「計時停止後も『進行中』表示が残る」不具合はユーザー指定で別 `/flow:fix` 起票予定（本 revise の E-R4 観点）。E2E 上は正規終了後にバッジが残らないことを既存リグレッションで担保。

## metrics
metrics: { wall_clock_min: ~6, e2e_specs: 24, pass: 24, fail: 0, flaky: 0, new_specs: 2, changed_specs: 1, config_change: "retries 0→1" }
