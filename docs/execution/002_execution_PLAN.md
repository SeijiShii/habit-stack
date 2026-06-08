# execution 実装計画書

> **入力**: `./001_execution_SPEC.md`, `../concept.md` §1.4、`../_shared/`
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧（src/features/execution/）

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `model/executionMachine.ts` | 状態機械（start/endItem/pause/resume/next/end）純関数 | types | 200 |
| `model/elapsed.ts` | タイムスタンプ差分による経過算出（クランプ含む） | — | 50 |
| `model/executionRepo.ts` | local-sync 経由 session/record 永続 + 達成 upsert | local-sync, types | 140 |
| `hooks/useExecution.ts` | 進行中 session の復元 + 操作ディスパッチ | executionRepo, machine | 120 |
| `ExecutionPage.tsx` | 実行画面（TimerControl + 経過表示 + メモ） | design, hooks | 180 |
| `components/TimerDisplay.tsx` | 経過時間表示（tabular-nums、now 差分で再描画） | design | 70 |
| `components/ItemMemo.tsx` | 今日メモ入力 | design | 40 |

## 2. 実装 Phase 分割

### Phase 1: executionMachine（純関数 状態機械）+ elapsed
- start/endItem/pause/resumeSame/nextItem/endSession を純関数で。経過はタイムスタンプ差分（注入された now）。
- テスト: 全遷移、pause 加算、経過算出、負値クランプ（端末時計戻り）。**生タイマー不使用を担保**（now を引数注入してテスト決定的）。
### Phase 2: executionRepo（local-sync 永続 + 達成 upsert）
- session/record put、done/1アイテム実行で daily_achievement upsert（穴あき許容）。
- テスト: 永続、達成 upsert（同日重複は unique で 1 件）。
### Phase 3: useExecution（復元 + ディスパッチ）
- アプリ再起動時に進行中 session を IndexedDB から復元、経過を now 差分で再計算。
- テスト: 復元、各操作。
### Phase 4: ExecutionPage + TimerDisplay + ItemMemo（UI）
- TimerDisplay は setInterval で**表示だけ**更新（記録はタイムスタンプ、表示は再計算）。
- design-system トークン適用。

## 3. 依存関係順序
```
elapsed + executionMachine(純) → executionRepo(local-sync) → useExecution → ExecutionPage(+TimerDisplay/ItemMemo)
依存: activity-sets(対象参照), _shared/local-sync, _shared/types, _shared/auth, design-system
```

## 4. 既存ファイルへの影響
- app-shell が /run/:setId ルート登録。
- streak-summary が daily_achievements を消費（execution が書く）。

## 5. 横断フォルダへの追加・変更
- なし（既存利用）。

## 6. リスク・注意点
- **生タイマーを記録に使わない**（表示更新の setInterval は OK、記録はタイムスタンプ差分）。バックグラウンド復帰時は now 差分で正確（§3 NFR）。
- 端末時計戻りで負の経過 → 0 クランプ。
- 進行中 session 復元の堅牢性（IndexedDB 破損時はフォールバック）。

## 7. 完了の定義
- [ ] 状態機械 + 経過算出 + repo + hook + UI 実装
- [ ] 単体 green（全遷移 + 経過 + 達成 upsert + 復元）
- [ ] E2E（004）green：開始→終了→一時停止→再開→次へ→メモ→達成
- [ ] バックグラウンド/再起動で経過正確（E2E or 単体で now 差分検証）
- [ ] design-system 適用 + 視覚レビュー green

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
