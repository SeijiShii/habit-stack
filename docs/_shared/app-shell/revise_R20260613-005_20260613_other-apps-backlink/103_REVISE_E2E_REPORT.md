# E2E テストレポート: _shared/app-shell R20260613-005（「他のアプリ」back-link）

- **状態**: E2E green
- **FW**: Playwright（chromium, headless）  対象 URL: ローカル dev（localhost:5180）
- **last_updated**: 2026-06-13

## journey 別結果（004 由来）
| journey | spec | 結果 | 備考 |
|---|---|---|---|
| E1/E2 footer の「他のアプリ」back-link | e2e/footer-backlink.spec.ts | ✅ | href=`https://givers.work` / target=_blank / rel=noopener。外部実遷移は踏まず属性検証 |
| R1 既存法務リンク残存（O55） | e2e/footer-backlink.spec.ts | ✅ | プラポリ/利用規約/特商法が footer に存在 |

## リグレッション
- 全 E2E 19/19 green（新規 2 + 既存 17）。ヘッダ縮退・ドット非表示・set-elapsed・法務到達性すべて維持。

## flaky / quarantine
- なし

## metrics
metrics: { e2e_specs: 2, pass: 2, fail: 0, flaky: 0 }
