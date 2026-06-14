# E2E テストレポート: execution R20260614-001（計時中セッションの可視化と導線）

- **状態**: E2E green
- **FW**: Playwright（chromium, headless）/ 実行コマンド: `npx playwright test` / 対象 URL: ローカル dev（`npx vite --port 5180`）= Class A
- **last_updated**: 2026-06-14

## journey 別結果（004_REVISE_E2E_TEST 由来）

| journey | spec | 結果 |
|---|---|---|
| セット詳細「開始」で中間ページを挟まず計時開始 | `e2e/revise-20260614.spec.ts` R20260614-001 E1 | pass |
| 計時中はセット一覧で「進行中」表示 + 選択で活動画面へ復帰 | `e2e/revise-20260614.spec.ts` R20260614-001 E2 | pass |
| 別セット計時中は二重開始を防ぎ計時中セットへ誘導 | `e2e/revise-20260614.spec.ts` R20260614-001 E3 | pass |
| 既存コアジャーニー（実行フロー）の新「開始」導線への追従 | `e2e/core-journey.spec.ts` / `e2e/ui-revise-20260613.spec.ts` / `e2e/timing-persistence.spec.ts` | pass（リグレッション修正済） |

## リグレッション修正（テスト側）
本改修で「実行する」リンク → セット詳細「開始」ボタン（autoStart）に変わったため、旧導線
（`getByRole("link", {name:"実行する"})` → `/run` の「開始」ボタン）を使っていた既存 E2E 3 本を
新導線（セット詳細「開始」で直接計時開始）に更新した。実装バグではなくテスト側の追従。
- core-journey.spec.ts（2 箇所）/ ui-revise-20260613.spec.ts（2 箇所）/ timing-persistence.spec.ts（共通ヘルパ）

`/run` への直接遷移（reflect-overview の `goto('/run/:id')`）は autoStart 無し = フォールバックの
「開始」ボタンが従来どおり機能するため変更不要。

## flaky / quarantine
なし。

## 検出した実装バグ
なし。

## 全体結果
`npx playwright test`: **23 passed**（全 spec、15.0s）。
