# D20260609_011 /flow:auto (continuous)

状態: 進行中

## Step 0.5 retrospective
- 前回 = /flow:claim C20260609-002 完了ハンドオフ（「/flow:fix 走らせるか?」1問）= 正当な分岐確認、歪曲停止でない。

## Step 1-3 照合 + auto-pick
- リリース: live・HEAD 反映済、残=実機 B-4（人間手番、auto 不可）
- claim C20260609-002 = バグ(fix) 判定済・スコープ確定（tip=ゲスト / ログイン動線=引き継ぎ・同期用）→ fix 未着手
- concept §8 open Critical/High SEC = 0（全 accepted-as-requirement）
- fix_/revise_ subfolder for _shared/auth = none

## Decisions
```yaml
- id: D20260609-011-001
  command: /flow:auto
  question: next-step auto-pick
  options: [/flow:fix _shared/auth C20260609-002 (login動線), 実機B-4(人間手番=auto不可)]
  recommended: /flow:fix _shared/auth C20260609-002
  chosen: /flow:fix _shared/auth C20260609-002
  chosen_type: auto-recommended
  context: |
    claim C20260609-002 がバグ判定した Google ログイン/連携動線の未実装（契約違反、中核価値
    データ引き継ぎの機能不全）が唯一の actionable Class A dev 作業。実機 B-4 は人間手番で auto 不可。
    fix 設計生成は Class A、実装は GCP OAuth 認証情報など Class C 人手ゲートで pause 想定。
```
