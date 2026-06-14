# E2E テストレポート: execution R20260614-002（活動 1:N period 化・中断時間の除外）

- **状態**: E2E green
- **FW**: Playwright（chromium, headless）/ 実行コマンド: `npx playwright test` / 対象 URL: ローカル dev = Class A
- **last_updated**: 2026-06-14

## journey 別結果（004_REVISE_E2E_TEST 由来）

| journey | spec | 結果 |
|---|---|---|
| 一時停止 → 同じ活動を再開せず次の活動へ進める（中断フロー） | `e2e/revise-20260614.spec.ts` R20260614-002 E1 | pass |
| 通常計時（開始→次の活動→セット終了）のリグレッション | `e2e/core-journey.spec.ts` / `e2e/ui-revise-20260613.spec.ts` | pass |

## カバレッジ方針（E2E と unit の役割分担）
中断時間の**精密な秒数除外**（pause→next で中断区間が経過に算入されない、多重中断の合算、4H クランプ）は
壁時計に依存せず決定的に検証できる **unit** が担う:
- `executionMachine.test.ts` N3b（pause したまま次活動へ → i1 経過 60s のみ、中断除外）
- `executionMachine.test.ts` N3c（複数回中断 1:N、3 periods、180s）
- `elapsed.test.ts` confirmedPeriodsSec / periodsElapsedSec（閉じた合計・中断除外・凍結）

E2E は**ユーザー操作としての中断フローが破綻なく流れる**こと（一時停止→次の活動→セット終了→達成）を
実ブラウザで担保する。秒数の精密 assert は E2E では flaky になるため置かない。

## flaky / quarantine
なし。

## 検出した実装バグ
なし。

## 全体結果
`npx playwright test`: **23 passed**（全 spec）。
