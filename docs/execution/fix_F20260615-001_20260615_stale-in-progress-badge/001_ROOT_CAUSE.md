# 根本原因分析: 計時停止後も「進行中」表示が残る

> **入力**: `./000_調査レポート.md`, App.tsx / SetListPage.tsx / useExecution.ts / ExecutionPage.tsx / useSets.ts
> **最終更新**: 2026-06-15

---

## 1. 5 Whys

| # | 問い | 答え |
|---|---|---|
| Why 1 | なぜ停止後も「進行中」表示が残るか? | 一覧バッジ/復帰導線が `["in-progress-session"]` react-query の値を見ており、その値が停止後も「進行中」のまま |
| Why 2 | なぜ query 値が「進行中」のままか? | セッション done 化（`exec.end()`）時に `["in-progress-session"]` が **invalidate されない**ため、キャッシュが更新されない |
| Why 3 | なぜ invalidate されないか? | `useExecution.end()` は IndexedDB へ done を persist するだけで QueryClient に触れない。done を検知して invalidate する配線が ExecutionPage / useExecution のどこにも無い |
| Why 4 | なぜ配線が無いか? | R20260614-001 で `["in-progress-session"]` query を**読み取り側**（SetsRoute/RunInner）に導入したが、**書き込み側**（セッション状態遷移）からの cache 無効化を対にしなかった（sets/items は useSets で invalidate 済だが in-progress は対象外） |
| Why 5 | なぜ対にし損ねたか? | **読み取りクエリと書き込み（状態遷移＝別レイヤの useExecution/IndexedDB）が別モジュールに分かれ、無効化の責務境界が曖昧だった**（react-query の mutation→invalidate 規約が execution 状態機械側に適用されていない）＝ 根本原因 |

## 2. 直接原因
| ファイル | 行 | 問題箇所 |
|---|---|---|
| `src/features/execution/hooks/useExecution.ts` | 114 | `end` が persist のみで `["in-progress-session"]` を invalidate しない |
| `src/App.tsx` | 70, 138 | `["in-progress-session"]` を読むが、done 化時に無効化される経路が無い（staleTime 既定 0 でも observer 非 remount 経路で stale 値が描画される） |
| `src/features/activity-sets/SetListPage.tsx` | 82-84 | stale な `inProgressSetId` をそのままバッジ描画 |

## 3. 根本原因
セッション状態遷移（execution machine / IndexedDB＝書き込み側）と、`["in-progress-session"]` 読み取りクエリ（App 層）が分離しており、**「done になったら in-progress クエリを無効化する」という mutation→invalidate の対が欠落**している。sets/items は `useSets` で invalidate されているが、in-progress セッションだけ無効化の責務が宙に浮いていた。

## 4. 寄与要因
| 種別 | 内容 |
|---|---|
| テスト不足 | 「終了後に進行中バッジが消える」回帰テストが unit/E2E に無かった（R20260614-001 はバッジ「表示」のみ検証） |
| レビュー漏れ | R20260614-001 で読み取りクエリ導入時、無効化トリガーの設計を伴わせなかった |
| 設計境界 | react-query の cache 無効化規約が execution 状態機械側に適用されていない（責務境界の曖昧さ） |

## 5. 仮説と検証
| 仮説 | 検証方法 | 結果 |
|---|---|---|
| done 化時に in-progress query 未 invalidate | コード grep（`invalidateQueries` に `in-progress-session` 不在を確認） | ✅ 確認（無効化呼出ゼロ） |
| ghost session が主因 | endSession が status=done を persist し findInProgress が除外することを確認 | ✗ 主因でない（done 化は正常、表示の stale が主因） |
| 実機タイミング依存 | CLAUDE.md 方針で実機 console.log 確認を fix 後検証に組込（002 §3） | 計画（release Phase 2） |

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-15 | 初版 | /flow:fix |
