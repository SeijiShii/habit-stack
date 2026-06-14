# 修正計画: 計時停止後も「進行中」表示が残る

> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, ExecutionPage.tsx / useExecution.ts
> **最終更新**: 2026-06-15

---

## 1. 修正対象ファイル

| ファイル | 修正内容 | before 抜粋 | after 抜粋 |
|---|---|---|---|
| `src/features/execution/ExecutionPage.tsx` | セッションが done になったら `["in-progress-session"]` を invalidate（既存の done 検知 useEffect に追加） | `useEffect(() => { if (s?.status === "done" && ownerId) clearHeartbeat(ownerId); }, [s?.status, ownerId]);` | `const qc = useQueryClient();` 追加 + 同 effect 内で `if (s?.status === "done") qc.invalidateQueries({ queryKey: ["in-progress-session"] });` |

> **修正点は 1 箇所**。done 検知 useEffect（ExecutionPage:104-107）は手動終了（`exec.end`）・自動終了（recovery autoEnd）双方で `status==="done"` に遷移したとき発火するため、両経路を 1 点でカバーできる。

## 2. 修正範囲の限定方針
- **根本原因のみ修正**（done→invalidate の対を追加）。query key `["in-progress-session"]` は App.tsx が所有する文字列リテラルで、ExecutionPage から同じキーで invalidate すれば足りる（マジック文字列の重複だが既存スタイル踏襲。定数化は別 refactor）。
- ghost session の能動 cleanup や findInProgress の仕様変更は行わない（done 化は正常動作のため）。

## 3. 副作用なき確認方法
- 既存テスト維持: ExecutionPage.test / App.test / SetListPage.test / timing-persistence E2E（24 green）が壊れないこと。
- 追加テスト: 003_REGRESSION_TEST 参照（done でバッジが消える unit + E2E）。
- **手動確認（CLAUDE.md UI タイミング debug 方針）**: 実機で「計時→終了→一覧」を行い、必要なら done 検知 effect に一時 console.log を仕込んで invalidate 発火と badge 消滅のタイミングを確認 → 確認後ログ削除（release Phase 2 のローカルスマホ動作確認に組込）。

## 4. リリース戦略
- 方式: 通常リリース（medium、表示整合の修正で低リスク）。
- フラグ: 不要。

## 5. ロールバック方針
- コード revert で戻せる: ✅（1 箇所の追加、DB 変更なし）。
- DB ロールバック: 無。

## 6. 関係者通知
- 不要（単独 UX 修正）。

## 7. DoD
- [ ] 計時終了後、一覧の「進行中」バッジ／`/run` の「計時中です」が即消える
- [ ] 003 REGRESSION_TEST 全成功（done でバッジ消滅の unit + E2E）
- [ ] 既存 245 unit + 24 E2E 破壊なし
- [ ] `/flow:spec-review` 不要（軽微・単一点）／実機確認は release Phase 2

## 8. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-15 | 初版 | /flow:fix |
