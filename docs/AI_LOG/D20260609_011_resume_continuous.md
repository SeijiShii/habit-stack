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

## 反復 2 (auto-pick)
- 前反復: /flow:fix _shared/auth C20260609-002 完了（002_FIX_PLAN 生成、commit 814735e）
- P4.2 Fix-impl gate 発火: fix_C20260609-002_*/002_FIX_PLAN.md 存在 + 101 不在 → /flow:tdd _shared/auth C20260609-002
- P4.46 は guest セッション実装済のため非発火（gap=login/upgrade 動線=fix で対応中）
- dispatch: /flow:tdd _shared/auth C20260609-002（Class A、Clerk mock で実装。OAuth provider 設定は Class C=release）

## 反復 3 (auto-pick) + 停止判定
- 前反復: /flow:tdd _shared/auth C20260609-002 完了（code e90e67d / docs 59dd4fb、129 green）
- §4.5.1#0 no-key Class-A 枯渇チェック:
  - 設計/実装/単体テスト = 完了。build OK。
  - 残 = ① GCP custom OAuth + Clerk Google connection (Class C 人手、release §3.1) ② 再デプロイ (Class B、新commit e90e67d/59dd4fb) ③ 本番で実 Google ログイン 1 回検証
  - = 実サービス設定 + デプロイが必須 → §4.5.1#0 step4「停止でなく Release gate へ」
- 停止判定: P4.7 Release gate = Class C(OAuth FILL/設定) + Class B(deploy) の human gate に到達 → 1-decision pause（正当、marker 保持）
- 推奨次アクション: /flow:release（live化済判定 → Google OAuth 設定案内 + 新commit 再デプロイ + 本番 social sign-in smoke）
