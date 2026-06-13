# E2E テストレポート: _shared/app-shell R20260613-002（タイトル左ロゴ + 幅不足時ロゴのみ）

- **状態**: E2E green
- **FW**: Playwright（chromium, headless）  実行: `npx playwright test`  対象 URL: ローカル dev（localhost:5180）
- **last_updated**: 2026-06-13

## journey 別結果（004 由来）
| journey | spec | 結果 | 備考 |
|---|---|---|---|
| E1 広幅でロゴ+タイトル | e2e/header-brand.spec.ts | ✅ | 1024px で svg.brand-logo + .brand-name「つみあげルーティン」可視 |
| E2 狭幅でロゴのみ・エリプシスなし | e2e/header-brand.spec.ts | ✅ | 360px で brand-logo 可視 / brand-name 非表示（toBeHidden） |
| E3 ロゴ/ホームリンクで / 遷移 | e2e/header-brand.spec.ts | ✅ | /sets から brand-link クリックで / へ |
| E4 aria-label でホーム識別 | e2e/header-brand.spec.ts | ✅（暗黙） | brandLink は role=link name="つみあげルーティン（ホーム）" で取得＝aria-label 機能を担保 |

## flaky / quarantine
- なし

## 検出した実装バグ
- なし

## metrics
metrics: { e2e_specs: 3, pass: 3, fail: 0, flaky: 0 }
