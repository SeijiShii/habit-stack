# _shared/app-shell 単体テスト計画

> **入力**: `./001__shared_app-shell_SPEC.md`, `./002__shared_app-shell_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧
### 1.1 正常系
| ID | 対象 | 期待 |
|---|---|---|
| N1 | main/Providers | Provider ツリーが例外なくマウント |
| N2 | routes | /,/sets,/run/:id,/summary,/legal/* がレンダー |
| N3 | api/health | 200 + ok |
| N4 | 認証配線 | 匿名サインイン後、保護 API が 200（P4.46） |
| N5 | LegalFooter | 全 route に表示（O55） |
| N6 | 入口リード文 | トップに「これは何？」説明（O41） |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | ErrorBoundary | 子の例外 | フォールバック UI + Sentry（PII scrub） |
| E2 | 未定義 route | 不正 path | 404 ページ |
| E3 | Clerk 障害 | 起動時 | ローカル動作継続（offline） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | O55 到達性 | 全 route | inbound link 存在（grep + テスト） |
| B2 | smoke | /api/health, / | 起動後到達 |

## 2. Mock 方針
| 対象 | 方針 |
|---|---|
| Clerk | mock（匿名/authed 切替） |
| 全 feature hooks | 実物 or 軽 mock |
| api | supertest 風 or 関数直叩き |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 75%（合成は配線中心） |
| 重要分岐 | 認証/ErrorBoundary/404 を網羅 |

## 4. 既存ユーティリティ依存
- 全 feature + 全 _shared。

## 5. テスト実行環境
- Vitest + Testing Library + Clerk mock + fake-indexeddb。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
