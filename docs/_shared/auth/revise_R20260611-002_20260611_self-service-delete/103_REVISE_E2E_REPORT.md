# E2E テストレポート: _shared/auth R20260611-002（セルフサービス全データ削除）

- **状態**: E2E green
- **FW**: Playwright 1.60 + Chromium　**実行**: `npx playwright test`　**対象 URL**: ローカル dev（vite :5180、実キーなし=ローカルゲスト）= Class A
- **last_updated**: 2026-06-11T20:20:00+09:00
- **入力**: `./004_REVISE_E2E_TEST.md`, `./101_REVISE_IMPL_REPORT.md`
- **spec**: `e2e/account-delete.spec.ts`（新規 2 本）

## journey 別結果
| journey (004 由来) | spec | 結果 | 備考 |
|---|---|---|---|
| E-DEL-01 全データ削除→確認→消失 | account-delete.spec.ts | ✅ pass | /account「全データを削除」→ alert → 「削除する」→ トップへ → セット一覧が空 |
| E-DEL-02 削除→キャンセルで残存 | account-delete.spec.ts | ✅ pass | 「キャンセル」でデータ残存 |
| E-DEL-03 keyless ゲスト削除 | （E-DEL-01 が兼ねる） | ✅ | ローカル headless は実キーなし=keyless ゲスト owner。E-DEL-01 がこの経路を実証 |

> サーバ DB の物理削除（`deleteAllData` / `DELETE /api/account`）は unit U-DEL-01 で検証（ローカル headless は実 DB/関数を持たないため）。E2E はローカル wipe の実ブラウザ挙動を担う。

## フルスイート結果
- **8 passed (12.6s)**: account-delete 2 + timing-persistence 3 + core-journey 3。リグレッションなし。
- unit: 176 green / typecheck clean（tdd 102 参照）。

## flaky / quarantine
- なし（全 spec 安定 green）。

## 検出した実装バグ (fix seed)
- なし。

## metrics
metrics: { e2e_specs: 2, pass: 2, fail: 0, flaky: 0, suite_total: 8, suite_pass: 8 }

## 結論
AUDIT_20260611_2000 Critical [AUDIT-perspective-001]（O54 セルフ削除 UI 欠落＝約束済み消去権の履行不能）を、UI 導線実装 + E2E 実証で**解消**。プラポリ/利規が約束する「アプリ内セルフサービス全データ削除」が実ブラウザで実行可能であることを確認した。
