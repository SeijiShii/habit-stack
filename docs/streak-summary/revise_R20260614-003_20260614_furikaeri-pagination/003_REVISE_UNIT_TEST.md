# streak-summary 単体テスト計画（活動記録のページネーション）

> **入力**: `./001_REVISE_SPEC.md`, `./002_REVISE_PLAN.md`, `SummaryPage.test.tsx`
> **最終更新**: 2026-06-14
> **状態**: 実装完了（SM-S8 追加・green）

---

## 1. 追加テストケース

### 1.1 正常系
| ID | 対象 | 入力 | 期待出力 |
|---|---|---|---|
| SM-S8（前半） | `SummaryPage` | 1 セット・11 セッション（古→新で sess_00..sess_10 を投入、newest=sess_10） | 1 ページ目は最新 10 件（`activity-total-sess_10` 存在）。最古 `activity-total-sess_00` は非表示。`page-indicator` が「1 / 2」 |
| SM-S8（後半） | `SummaryPage` | 上記状態で「次へ」ボタンをクリック | 2 ページ目に `activity-total-sess_00` 出現、`activity-total-sess_10` 消失。`page-indicator` が「2 / 2」 |

### 1.2 異常系
| ID | 対象 | 失敗条件 | 期待振る舞い |
|---|---|---|---|
| U-bnd1 | `SummaryPage` | 先頭ページ | 「前へ」ボタンが `disabled`（範囲外に進めない） |
| U-bnd2 | `SummaryPage` | 末尾ページ | 「次へ」ボタンが `disabled` |

> 注: U-bnd1/U-bnd2 は実装上 `disabled` 属性とクランプ（`Math.max/Math.min`）で担保。SM-S8 のページ遷移検証で実質カバーされる。

### 1.3 境界値
| ID | 対象 | 境界 | 期待振る舞い |
|---|---|---|---|
| U-edge1 | `SummaryPage` | 活動ちょうど 10 件 | ページ nav 非表示（`activities.length > PAGE_SIZE` が偽）。全件 1 画面表示 |
| U-edge2 | `SummaryPage` | 活動 0 件 | `ActivityTable` は `null`、ページ nav も非表示 |

## 2. 修正テストケース

| ID | 対象 | 修正前 | 修正後 | 理由 |
|---|---|---|---|---|
| （なし） | — | — | — | 既存ケースは挙動不変のため修正不要 |

## 3. 削除テストケース
| ID | 対象 | 削除理由 |
|---|---|---|
| （なし） | — | — |

## 4. リグレッション強化
- **SM-S6**（活動の記録テーブル: 1 セッション 1 行、開くと item 別時間・メモ）: 活動 1 件 = 10 件以下のためページ nav 非表示。表示内容・挙動は不変であることを担保。
- **SM-S1 / SM-S4 / SM-S5**（継続率・連続日数・期間切替・空状態）: 活動記録のページングとは独立。期間ボタンは率/連続日数にのみ作用し、活動記録ページには影響しないこと。
- **SM-S7**（セット切替ドロップダウン）: `setId` 変更で `page` が 0 にリセットされること（古いページ番号に取り残されない）。

## 5. Mock 方針差分
| 対象 | 前回 | 今回 | 理由 |
|---|---|---|---|
| repo（`SummaryRepo`） | fake-indexeddb 経由で実 store に投入 | 同左（SM-S8 は `execution_session`/`execution_record` を 11 件投入） | 既存テストと同じ手法を踏襲 |

## 6. カバレッジ目標
| 種別 | 目標 | 根拠 |
|---|---|---|
| 行 | 80% | 既存継承 |
| 分岐 | 70% | 既存継承（10 件超分岐・境界 disabled 分岐を SM-S8 でカバー） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版作成（SM-S8 追加・green を反映） | /flow:revise |
