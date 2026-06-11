# AI_LOG — /flow:release（habit-stack 再デプロイ）

- **実行日時**: 2026-06-12（JST）
- **コマンド**: /flow:release（/flow:auto P4.7 から dispatch、本番 prod 直行）
- **対象**: 未デプロイ改修 2 件（R20260611-001 計時永続化 + R20260611-002 セルフ削除）の本番再デプロイ
- **状態**: 完了
- **含まれる decision 範囲**: D20260612-009〜012
- **metrics**: deploy_target=production / deployed_url=https://habit-stack.givers.work / check_result=smoke-green（5/5、DELETE /api/account 405→401 修正後）/ collected_vars=none（live 化済）

## 主要結果
- live 化判定: `.env.production.local` = sk_live_（Clerk/Stripe）+ Neon postgres → live 化済、swap skip。
- post-deploy スモークで **新 endpoint DELETE /api/account が 405** を検出（O51 系のルート不整合バグ）。
- 原因: 関数ファイル `api/account/delete.ts` → 実ルート `/api/account/delete`。クライアント `selfDelete.ts` + SPEC は `/api/account` を呼ぶ → 本番で SPA fallback に落ち 405 = **サーバ側削除が一度も実行されず**、O54 消去権が本番で未履行（ローカル wipe のみ動作）。
- unit は fetch モック + パス文字列 assert、E2E はローカル wipe のみ検証でルーティング不整合を検知できず。
- 修正: `api/account/delete.ts` → `api/account.ts` 移設（ルート一致）+ DELETE 以外 405 メソッドガード + 回帰 U-DEL-10 + smoke-prod.sh に DELETE /api/account 恒久追加。177 unit green、typecheck green。
- 再デプロイ後スモーク 5/5 green（DELETE /api/account 401 = ルート存在 + 認証ゲート OK）。

## Decision 一覧

| id | phase | 要約 | chosen_type |
|---|---|---|---|
| D20260612-009 | §3 build/関数ガード | 8 関数（新 account/delete 含む、上限 12 内）、build green | auto-recommended |
| D20260612-010 | §3.4 post-deploy スモーク | DELETE /api/account 405 検出 = O51 系ルート不整合バグ（Class A） | auto-recommended |
| D20260612-011 | バグ修正 | api/account.ts 移設 + メソッドガード + 回帰テスト + smoke 追加 | auto-recommended |
| D20260612-012 | 再デプロイ + スモーク | 再デプロイ green、DELETE /api/account 401、リリース完了 | auto-recommended |

## Decisions

```yaml
- id: D20260612-009
  timestamp: 2026-06-12T08:52:00+09:00
  command: /flow:release
  phase: §3 build + 関数数ガード
  question: 新 endpoint 追加で Hobby 12 関数上限を跨がないか
  chosen: 8 関数（上限内）、Build Output API ビルド green
  chosen_type: auto-recommended
  depends_on: [D20260612-008]
  context: |
    api/account/delete.func 含め 8 関数（health/feedback/sync(pull,push)/tip(webhook,checkout)/
    auth/guest/account/delete）。MAX_FUNCTIONS=12 内。raw-body 関数は既存 tip/webhook のみ。

- id: D20260612-010
  timestamp: 2026-06-12T08:55:00+09:00
  command: /flow:release
  phase: §3.4 post-deploy スモーク
  question: 公開 URL の正常系 + 新 endpoint 起動確認
  chosen: DELETE /api/account 405 検出 = ルート不整合バグ（要修正、デプロイ完了扱いにしない）
  chosen_type: auto-recommended
  depends_on: [D20260612-009]
  context: |
    1回目デプロイ後スモーク: / 200 / health 200 / guest 200 / sync 401（OK）だが
    DELETE /api/account = 405（期待 401）。関数ファイル api/account/delete.ts → 実ルート
    /api/account/delete。クライアント selfDelete.ts:30 は /api/account を fetch → 本番で
    どの関数にもマッチせず SPA fallback（静的）→ DELETE on static = 405。
    = サーバ側自己削除が本番で一度も実行されない（O54 消去権が未履行、ローカル wipe のみ）。
    unit は fetch モック + パス assert、E2E はローカル wipe のみ = ルーティング不整合を素通り（O51 系）。

- id: D20260612-011
  timestamp: 2026-06-12T09:00:00+09:00
  command: /flow:release
  phase: 実装バグ修正（Class A）
  question: ルート不整合の修正方針
  chosen: api/account.ts 移設 + DELETE-only メソッドガード + 回帰テスト + smoke 恒久追加
  chosen_type: auto-recommended
  depends_on: [D20260612-010]
  context: |
    api/account/delete.ts → api/account.ts（depth 調整 ../src ../db）でルートを /api/account に一致。
    DELETE 以外を 405 で弾くメソッドガード追加（GET 等での誤削除防止 = 認証前に拒否）。
    既存 U-DEL-01（200）/ U-DEL-07（401）維持 + U-DEL-10（誤メソッド 405、db 未呼び）追加。
    smoke-prod.sh に DELETE /api/account（401 期待、405 ならルート不整合）を恒久追加 = 再発検出。
    typecheck green、177 unit green（+1）。commit e33434f。

- id: D20260612-012
  timestamp: 2026-06-12T09:05:00+09:00
  command: /flow:release
  phase: 再デプロイ + post-deploy スモーク
  question: 修正反映 + リリース完了判定
  chosen: 再デプロイ green、スモーク 5/5、リリース完了
  chosen_type: auto-recommended
  depends_on: [D20260612-011]
  context: |
    deploy-prod.sh 再実行（Production READY、aliased https://habit-stack.givers.work）。
    再スモーク: / 200 / health 200 / guest 200（Clerk prod）/ sync 401 / DELETE /api/account 401
    （ルート存在 + 認証ゲート OK、405 解消）。計時永続化は client-side（E2E timing green、frontend 200）。
    未デプロイ改修 2 件を本番反映完了 = O54 法令ギャップ（セルフ削除）の本番履行を回復。

metrics:
  deploy_target: production
  deployed_url: https://habit-stack.givers.work
  check_result: smoke-green (5/5, DELETE /api/account 405→401 fixed)
  collected_vars: none
  bug_found_and_fixed: route-mismatch (api/account/delete.ts→api/account.ts, 405→401)
  pj_tags: [habit-tracker, pwa]
```
