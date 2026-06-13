# AI_LOG — /flow:release habit-stack（Google OAuth 設定 Class C + UI 改修再デプロイ）

- **実行日時**: 2026-06-13（JST）
- **コマンド**: /flow:release（/flow:auto P4.7 Release gate から dispatch）
- **対象**: habit-stack（live 化済、UI 改修バッチ R20260613-002/003/004 を本番反映 + Google ログイン OAuth 設定）
- **実行者**: seiji + Claude
- **状態**: Class C human gate で pause（Google OAuth = ユーザーのダッシュボード操作待ち）
- **含まれる decision 範囲**: live 判定 / Google social OAuth 検出 / 再デプロイ target

## 主要決定サマリ

| decision_id | テーマ | chosen | type |
|---|---|---|---|
| D20260613-064 | live 判定（§1.0） | `.env.production.local` = CLERK/STRIPE すべて LIVE → live 化済。残＝UI 改修 3 件の再デプロイ + Google OAuth 設定（Class C） | auto-recommended |
| D20260613-065 | Google social OAuth（§3.1） | コードに `oauth_google`/`linkWithGoogle`/`createExternalAccount` 検出 = social sign-in 実装あり。Clerk 本番は custom OAuth クレデンシャル必須 → 未設定が「Google ログイン動作しない」の真因。guided Class C step を提示し pause | auto-recommended |
| D20260613-066 | 再デプロイ target（§1.0c case ii） | UI 改修は表示系中心で unit+E2E green だが、Google OAuth 設定とセットで本番確認したいため preview 先行を推奨（ユーザー判断、pause 中） | open |

## 依存関係
- depends_on: D20260613-063（audit 後 release dispatch）/ D20260610_006（Google OAuth Class C 既知宿題）

## Class C human gate（pause 理由）
Google ログインの本番稼働には、ユーザーしか実行できない GCP + Clerk ダッシュボード操作が必要（クレデンシャル）。`/flow:auto` はここで正当に pause（§4.5.1 condition 2 / auto-pick-policy §1.5.5b: Class C 本質入力）。OAuth 設定完了後、UI 改修 3 件と合わせて再デプロイ（Class B）。

## Decisions

```yaml
- id: D20260613-064
  timestamp: 2026-06-13T18:45:00+09:00
  command: /flow:release
  phase: §1.0 live 判定
  question: live 化状態
  options: [test/dev のまま, live 化済]
  recommended: live 化済（.env.production.local 実 read）
  chosen: live 化済（CLERK_SECRET_KEY/STRIPE_SECRET_KEY/VITE_CLERK_PUBLISHABLE_KEY = LIVE）
  chosen_type: auto-recommended
  depends_on: [D20260613-063]
  context: SoT ① .env.production.local prefix 実 read。残作業 = 再デプロイ + Google OAuth 設定

- id: D20260613-065
  timestamp: 2026-06-13T18:46:00+09:00
  command: /flow:release
  phase: §3.1 social sign-in OAuth 検出
  question: Google social sign-in の本番設定状況
  options: [設定済, 未設定（custom OAuth 必要）]
  recommended: 未設定（本番未稼働の真因、D20260610_006 既知）
  chosen: 未設定 → guided Class C step を提示し pause
  chosen_type: auto-recommended
  depends_on: [D20260613-064]
  context: コードに oauth_google 検出。Clerk 本番 instance は共有 OAuth を使えず provider 別 custom クレデンシャル必須

- id: D20260613-066
  timestamp: 2026-06-13T18:47:00+09:00
  command: /flow:release
  phase: §1.0c case ii 再デプロイ target
  question: UI 改修 + OAuth を preview 先行か本番直行か
  options: [preview 先行, 本番直行]
  recommended: preview 先行（OAuth 設定とセットで実 social sign-in を 1 回確認したい）
  chosen: （ユーザー判断待ち、pause 中）
  chosen_type: open
  depends_on: [D20260613-064]
  context: UI 改修は表示系 + unit/E2E green だが Google OAuth は実ログインを踏むまで確認不能
```
