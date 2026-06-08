# _shared/auth 単体テスト計画

> **入力**: `./001__shared_auth_SPEC.md`, `./002__shared_auth_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧

### 1.1 正常系
| ID | 対象 | 入力 | 期待 |
|---|---|---|---|
| N1 | getOwnerId | 有効 Clerk セッション（authed） | userId を返す |
| N2 | getOwnerId | 匿名セッション | anonymous user id を返す |
| N3 | withOwner | 認証済みリクエスト | handler に owner 注入、200 |
| N4 | requireOwner | owner_id 一致 | 通過 |
| N5 | **匿名→authed 経路** | 匿名サインイン後に保護 API 呼び出し | **200（401 でない）** ← P4.46 hard gate 要件 |
| N6 | deleteAllData | owner 配下データあり | 全テーブル + ローカル 0 件 |
| N7 | mergeGuestData | from→to owner | 対象データの owner_id が to に付け替わる |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | withOwner | 未認証 | 401 |
| E2 | requireOwner | owner_id 不一致 | 403/404（存在秘匿） |
| E3 | getOwnerId | owner をクライアントが詐称（body に owner） | サーバは無視し Clerk 由来値を使用 |
| E4 | 匿名サインイン | Clerk 障害 | 例外を握り、ローカル継続（offline、同期は後で） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | PII ログ | エラーに email 混入 | beforeSend マスクで除去（SEC-004） |

## 2. Mock 方針
| 対象 | 方針 | 理由 |
|---|---|---|
| Clerk backend/clerk-js | injectable mock | 実認証なしで分岐検証（O35） |
| DB | mock or インメモリ | owner 付け替え/削除検証 |
| local-sync | mock | merge/delete 協調 |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 85%（セキュリティ基盤のため高め） |
| 分岐 | 80% |

> 401/403/200 + 匿名→authed 経路 + owner 詐称無視 + PII マスク を必ずカバー。

## 4. 既存ユーティリティ依存
- _shared/db（owner クエリ）, _shared/types（OwnerId）。

## 5. テスト実行環境
- Vitest + Clerk mock + jsdom（Provider）。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
