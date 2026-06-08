# streak-summary 単体テスト計画

> **入力**: `./001_streak-summary_SPEC.md`, `./002_streak-summary_PLAN.md`
> **最終更新**: 2026-06-08

---

## 1. テストケース一覧
### 1.1 正常系
| ID | 対象 | 期待 |
|---|---|---|
| N1 | summarize 継続率 | 達成7/対象10 → 70% |
| N2 | summarize 連続日数 | 直近連続達成日数を算出 |
| N3 | summarize 完遂率 | 全アイテム実行日/達成日 |
| N4 | summarize ドット | 達成=true/未達=false の配列 |
| N5 | summaryRepo | owner の daily_achievements 取得 |
| N6 | api/summary | withOwner で owner 集計 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待 |
|---|---|---|---|
| E1 | summarize | 達成日ゼロ | rate=0、空状態フラグ |
| E2 | summarize | 期間に未来日 | 対象は今日まで |
| E3 | api/summary | 未認証 | 401（匿名はローカル経路） |

### 1.3 境界値
| ID | 対象 | 境界 | 期待 |
|---|---|---|---|
| B1 | 穴あき日 | 1 アイテムのみ実行 | 達成カウント（D20260608-003） |
| B2 | 連続途切れ | 1 日抜け | currentStreak リセット、エラー表現なし |
| B3 | 期間=1日 | — | 達成0or1 |

## 2. Mock 方針
| 対象 | 方針 |
|---|---|
| local-sync/db | mock daily_achievements |
| auth | mock owner |
| 時刻 | 固定値（今日基準） |

## 3. カバレッジ目標
| 種別 | 目標 |
|---|---|
| 行 | 80% |
| 分岐 | 75%（連続/穴あき分岐） |

## 4. 既存ユーティリティ依存
- execution(daily_achievements), _shared/db, _shared/local-sync。

## 5. テスト実行環境
- Vitest + 時刻固定。

## 6. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
