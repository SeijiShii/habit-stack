# リグレッションテスト計画: 計時停止後も「進行中」表示が残る

> **入力**: `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`
> **最終更新**: 2026-06-15

---

## 1. 再発防止テストケース

### 1.1 直接原因を捉えるテスト
| ID | 対象 | 入力 | 期待（修正前: 失敗 / 修正後: 成功） |
|---|---|---|---|
| RG-01 | ExecutionPage（unit） | 計時開始 → セット終了で status=done に遷移 | done 遷移時に `queryClient.invalidateQueries({queryKey:["in-progress-session"]})` が呼ばれる（spy） |
| RG-02 | E2E（timing-persistence） | 計時開始 → 「セット終了」→ `/sets` へ | セット一覧に `in-progress-badge` が**表示されない**（修正前: 残る） |

### 1.2 修正後に必ず通るテスト
| ID | 対象 | 期待 |
|---|---|---|
| RG-03 | E2E | 計時 running 中（終了していない）は一覧に `in-progress-badge` が表示される（R20260614-001 の正常表示を壊さない） |

## 2. 類似境界条件テスト
| ID | 境界条件 | 期待振る舞い |
|---|---|---|
| RG-04 | 自動終了（recovery autoEnd で done） | 同 done 検知 effect 経由で invalidate される（手動終了と同じ 1 点でカバー）。unit で autoEnd→done 時に spy 発火を確認 |
| RG-05 | done でない（running/paused）状態変化 | invalidate は呼ばれない（無駄な refetch を増やさない） |

## 3. 既存テスト維持確認
| ID | 既存テスト | 維持理由 |
|---|---|---|
| RG-06 | `revise-20260614.spec.ts`（進行中表示 + 復帰） | 計時中の正常バッジ表示を壊さない |
| RG-07 | `timing-persistence.spec.ts`（E-RESUME/E-01/E-01b/E-SUMMARY） | 復元・停止条件緩和を壊さない |
| RG-08 | ExecutionPage.test 既存 | done 検知 effect への追加が既存挙動（heartbeat clear）を壊さない |

## 4. E2E シナリオ追加
| シナリオ ID | バグ再現 → 修正後の確認 |
|---|---|
| RG-02 | 計時 → 終了 → `/sets`: バッジ非表示（修正で green）。timing-persistence.spec.ts に追加 |

## 5. Mock 方針
| 対象 | 固定値 | 理由 |
|---|---|---|
| QueryClient | テストで spy 可能な invalidateQueries（または実 QueryClient + queryCache 観測） | invalidate 呼出検証 |
| 時刻 now | 注入（既存 ExecutionPage now prop） | 再現性 |

## 6. カバレッジ目標
- 修正コード行（done→invalidate）: 100%
- done/非 done 分岐の双方をテスト

## 7. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-15 | 初版 | /flow:fix |
