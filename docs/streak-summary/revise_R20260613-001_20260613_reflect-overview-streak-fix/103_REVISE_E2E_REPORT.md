# E2E テストレポート: streak-summary R20260613-001（振り返り総覧 + 連続日数の正確化）

- 状態: **E2E green**
- FW: Playwright 1.60 + Chromium（ローカル headless、Class A・実キー不要）
- 実行コマンド: `npx playwright test` ／ 対象 URL: ローカル dev (vite :5180、webServer 自動起動)
- TZ: `Asia/Tokyo` 固定（`test.use({ timezoneId })`、UTC ズレの再現）
- last_updated: 2026-06-13

## journey 別結果

| journey (004 由来) | spec ファイル | 結果 | 備考 |
|---|---|---|---|
| E2E-OV-01/02/03 継続ナビ→総覧（ドロップダウン+折りたたみ+合計時間）→個別サマリ遷移 | e2e/reflect-overview.spec.ts | ✅ pass | 行き止まり解消を実証 |
| E2E-OV-04 セット 0 件の空状態 + 作成導線 | 同上 | ✅ pass | |
| E2E-ST-01/02 昨日までの連続保持（今日未実施）→ 今日実施で +1 | 同上 | ✅ pass | ローカル日付達成を IDB 注入 |
| E2E-MG-01 UTC ズレ達成の再構築（migration、冪等） | 同上 | ✅ pass | META フラグ完了待ち→補正→再リロード不変 |
| E2E-RG（リグレッション）コアジャーニー / サマリ反映 / 法務 | e2e/core-journey.spec.ts | ✅ pass 3/3 | |
| E2E-RG 計時永続化・復帰・ログイン終了・サマリ遷移継続 | e2e/timing-persistence.spec.ts | ✅ pass 4/4 | E-SUMMARY が新総覧と共存 |
| E2E-RG セルフ削除 | e2e/account-delete.spec.ts | ✅ pass 1/1 | |

**合計: 12/12 green（新規 4 / 既存 8）**

## flaky / quarantine
なし。

## 検出した実装バグ (fix seed)
なし。red 2 件はいずれもテスト側（セレクタ strict mode / migration fire-and-forget との同期）で、spec 修正で解消。
- 設計どおりの挙動として確認: migration は fire-and-forget のため、補正は「次回表示」から反映（005_REVISE_MIGRATION §2、リアルタイム反映は非要件）。

## metrics
metrics: { e2e_specs: 12, pass: 12, fail: 0, flaky: 0, new_specs: 4 }
