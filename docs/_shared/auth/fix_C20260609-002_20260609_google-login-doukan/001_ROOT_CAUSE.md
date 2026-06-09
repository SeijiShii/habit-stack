# 根本原因分析: Google ログイン/連携動線の欠落

> **入力**: `./000_調査レポート.md`, src/components/auth/AuthProvider.tsx, src/services/auth/*, 101_IMPL_REPORT.md
> **最終更新**: 2026-06-09

---

## 1. 5 Whys

| # | 問い | 答え |
|---|---|---|
| Why 1 | なぜログインが無いのか? | `linkWithGoogle()` 関数も Google 連携 UI ボタンも実装されておらず、`AuthProvider` は匿名ゲスト ticket セッションを自動確立するだけだから |
| Why 2 | なぜ未実装なのか? | auth の **backend（owner-resolver / guest セッション / reassignOwner）は実装したが、Google リンクの UI フローを「app-shell の UI 配線時に」と先送りした**（101_IMPL_REPORT L33） |
| Why 3 | なぜ先送りが回収されなかったのか? | app-shell 実装フェーズで Google リンク動線が拾われず、`_shared/auth` が **✅ 完了扱い**のまま次工程（E2E / release）へ進んだ |
| Why 4 | なぜ ✅ 完了の誤りが検出されなかったのか? | audit #4（観点反映）の O22 broad `code_signals`（guestMode/anonymousUser/signInAnonymously）が **(A) 匿名ゲスト部でヒットして「O22 充足」と判定**し、契約の **(B) 段階的認証=login/upgrade 動線の欠落をマスク**したから |
| Why 5 | なぜ「2 部構成契約の片方欠落」を仕組みで防げなかったのか? | **(B) login/upgrade 動線を表す `required_signals` が O22 に定義されておらず**、audit が「契約済みだが動線ゼロ」を機械検出できなかった（= 根本原因。CF-20260609-009 で O22 required_signals + audit #4 step 3.6 を追加し是正済） |

## 2. 直接原因
| ファイル | 行 | 問題箇所 |
|---|---|---|
| `src/components/auth/AuthProvider.tsx` | 全体 | guest ticket セッションのみ。`linkWithGoogle` / external account 連携の経路が無い |
| `src/services/auth/` | — | `linkWithGoogle()` が未実装（`localGuest.ts:6` にコメント参照のみ） |
| `src/components/AppLayout.tsx` / `src/App.tsx` | nav 周辺 | ログイン/アカウント連携の inbound 動線（ボタン/リンク/ルート）が無い |

## 3. 根本原因
**「backend 先行 + UI 動線を後工程に先送り」した実装が、後工程で回収されないまま `_shared/auth` を ✅ 完了扱いにした**こと。そしてそれを **audit が検出できなかった**こと（O22 の 2 部構成契約のうち (B) login 動線に `required_signals` が無く、broad match が guest 部で pass）。= 「契約済み・✅完了扱いだが UI 動線ゼロ」という実装完全性バグ。

## 4. 寄与要因
| 種別 | 内容 |
|---|---|
| 実装漏れ | UI 動線フローを「後で」に切り出し、回収されなかった（IMPL_REPORT L33 の先送りが未消化） |
| 検出漏れ | audit #4 の broad `code_signals` が部分実装で pass、契約サブ能力の欠落をマスク（CF-20260609-009 で修正済） |
| ドキュメント | `_shared/auth` を「✅ 完了」とした完了判定が、UI 動線未配線を見落とした |

## 5. 仮説と検証
| 仮説 | 検証方法 | 結果 |
|---|---|---|
| client 関数 + UI 動線の欠落に限定（server merge は実装済） | `grep reassignOwner / linkWithGoogle` | ✅ `reassignOwner` 実装済 / `linkWithGoogle` 未実装。欠落は client + UI + post-link 配線に限定 |
| Clerk external account 連携で同一 userId 維持可能 | auth SPEC §3「同一 owner id を維持」+ Clerk `createExternalAccount` の挙動 | ✅ 同一 userId 維持パスが primary、reassignOwner は新 id 時の fallback |

## 6. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-09 | 初版 | /flow:fix |
