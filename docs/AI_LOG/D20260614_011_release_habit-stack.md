# AI_LOG — /flow:release habit-stack（Clerk guest reverification 修正を本番デプロイ）

- **実行日時**: 2026-06-14（JST）
- **コマンド**: /flow:release（live PJ 改修 deploy）
- **対象**: habit-stack 本番（https://habit-stack.givers.work）
- **実行者**: seiji + Claude
- **状態**: 完了（deploy READY + automated smoke green）。残 = ユーザーによる aged guest 実機 smoke
- **含まれる decision 範囲**: live 判定 / release-pre / Class B deploy / post-deploy smoke

## 主要決定サマリ

| decision_id | テーマ | chosen | type |
|---|---|---|---|
| D20260614-039 | 本番デプロイ（fix C20260614-002） | live PJ 改修（auth）。reverification 403 は production Clerk(pk_live_) + aged guest でのみ再現するため prod-direct（preview では再現不可）。後方互換・degrade-safe（authenticateRequest 失敗→新規ゲスト=従来挙動）。新規 env 0 / 新規 function 0（count 8<12）。deploy-prod.sh → READY、smoke green（/api/auth/guest 200+ticket = refresh-or-create の create fallback OK） | explicit-choice |

## デプロイ結果
- deployment id: dpl_6jVN85NQvS3SyENCq4JcUSRyyK5C（target=production, READY）
- 公開 URL: https://habit-stack.givers.work
- automated smoke: `/`=200 / `/api/health`=200 / **`/api/auth/guest`=200+ticket（endpoint 変更が後方互換と確認）** / `/api/sync/pull`=401 / `DELETE /api/account`=401

## release-pre（focused）
baseline AUDIT_20260614_1912 = C0/H0。delta = claim docs + contained auth fix（O22 (C) を実装）。新規 env var 0（CLERK_* は既存）/ 新規 api function 0 / fix 構造一致。full audit skill は context 節約のため focused 検証で代替（変更は contained + perspective 充足方向）。

## 残作業（ユーザー手番、§3.4 #4.5）
**aged guest social smoke**（本デプロイの本丸、CF-20260614-001）:
- ① fresh guest（シークレットタブ）で /account → 「Google で引き継ぐ」→ Google へ遷移すること。
- ② **詰まっていた端末（古い session のスマホ）**でページ再読込 → 「Google で引き継ぐ」→ **403 無反応にならず Google へ遷移**すること（= linkGoogle が連携直前に session を fresh 化する修正の検証）。guest token スモークは Clerk 非経由で本症状を見逃すため、ブラウザ実踏が必須。

## metrics
metrics: { deploy_target: production, deployed_url: "https://habit-stack.givers.work", smoke: green, collected_vars: 0 }

## 依存関係
- depends_on: D20260614-038（fix C20260614-002 実装）/ 前回 release D20260614_008

## Decisions

```yaml
- id: D20260614-039
  timestamp: 2026-06-14T21:40:00+09:00
  command: /flow:release
  phase: §1.0/§3.3/§3.4
  question: fix C20260614-002 の本番デプロイ
  options: [preview-first, prod-direct]
  recommended: prod-direct（reverification 403 は prod Clerk + aged guest でのみ再現、preview 再現不可）
  chosen: prod-direct。deploy-prod.sh（agent, masked）→ dpl_6jVN85 READY → smoke green。/api/auth/guest 200+ticket で endpoint 後方互換を確認。残 = ユーザー aged guest 実機 smoke。
  chosen_type: explicit-choice
  depends_on: [D20260614-038]
  context: 後方互換・degrade-safe、新規 env/function 0。ユーザーが「a」で deploy+aged guest 検証を選択。
```
