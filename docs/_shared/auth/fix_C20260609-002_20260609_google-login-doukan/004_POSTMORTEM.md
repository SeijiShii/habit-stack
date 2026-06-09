# Postmortem: 契約済み Google ログイン動線が未実装のまま本番公開

> **重大度**: high
> **発生日**: 2026-06-09（本番公開時点で既に欠落、ユーザー指摘で発覚）
> **対応完了日**: （実装 + release OAuth 設定後に確定）
> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`

---

## 1. 概要
concept + auth SPEC が契約した「匿名 → Google 段階認証 + データ引き継ぎ」の **UI 動線（`linkWithGoogle` + ログインボタン）が未実装のまま `_shared/auth` を ✅ 完了扱いにして本番公開**した。backend は実装済みだったが UI 動線が「app-shell 配線時に」と先送りされ回収されず、audit もそれを検出できなかった。

## 2. 時系列
| 時刻 | イベント | 対応 |
|---|---|---|
| 2026-06-08 | _shared/auth tdd 実装。IMPL_REPORT L33 で「Google リンク UI フローは app-shell 配線時に」と先送り | — |
| 2026-06-09 | app-shell 配線・release。Google 動線は未配線のまま ✅ 完了 → 本番公開 | — |
| 2026-06-09 | audit（light+#4）が High 0 で通過（O22 broad match が guest 部で pass） | — |
| 2026-06-09 | seiji が「ログインがない / 契約違反。auditで検知しない」と指摘 | /flow:claim → bug 判定 → /flow:fix |

## 3. 影響範囲
| 項目 | 内容 |
|---|---|
| 影響ユーザー数 | データ引き継ぎ・複数端末を望む全ユーザー（公開直後で実害は限定的） |
| データ損失 | 潜在（端末紛失・ストレージ消去で復旧不能。引き継ぎ手段が無い） |
| ダウンタイム | なし（guest として正常動作） |
| 売上 / SLA 影響 | なし（tip はゲストで稼働） |
| セキュリティ影響 | なし |

## 4. 検知の経緯
- **ユーザー（開発者 seiji）の手動指摘**で発覚。自動検知（audit）は O22 broad `code_signals` が guest 部でヒットして「充足」と誤判定し、契約サブ能力（login 動線）の欠落をマスクしていた。

## 5. 対応の流れ
1. 検知: seiji の [flow] 指摘
2. triage: /flow:claim で三項照合 → bug 判定 + tip-gating 付随論点を O46 で確定
3. 横展開: audit がこのクラスを今後検出できるよう perspectives O22 + audit #4 3.6 を修正（CF-20260609-009）
4. 根本修正: 本 fix（linkWithGoogle + /account 動線 + post-link sync）
5. release: GCP/Clerk OAuth 設定 + 本番実ログイン検証

## 6. 直接原因 + 根本原因
（001_ROOT_CAUSE.md より）直接原因 = `linkWithGoogle` + UI 動線の未実装。根本原因 = backend 先行で UI 動線を後工程に先送りし回収されないまま ✅ 完了扱い + audit が 2 部構成契約の片方欠落を検出できなかった（O22 に (B) login 動線の `required_signals` が無かった）。

## 7. 学習事項

### 7.1 良かった点
- server merge 基盤（reassignOwner）が先に実装されていたため、修正範囲が client + UI + 配線に限定できた。
- ユーザー指摘から claim→fix で速やかに triage + 横展開できた。

### 7.2 改善点
- 「backend 実装済 = feature 完了」と判定してしまった（UI 動線という契約の半分が欠落）。
- IMPL_REPORT の「後で」先送りが追跡されず回収漏れ。
- audit が「契約済みだが動線ゼロ」を検出できなかった。

## 8. 再発防止策
| 対策 | 種別 | 担当 | 期限 |
|---|---|---|---|
| O22 に login/upgrade 動線の `required_signals` + `required_signals_when` 追加（broad match マスク防止） | プロセス（audit SoT） | 完了（commit a9ada65） | 完了 |
| audit #4 step 3.6「多部構成観点の broad-match マスク検出」追加 | プロセス（audit） | 完了（commit d119cd5） | 完了 |
| IMPL_REPORT の「後で/省略」項目を完了判定前に回収するチェック（UI 動線 = 契約の一部） | プロセス | seiji | 次回 feature/tdd 運用時 |
| claim→fix の auto-route 強制（triage が止まらず実装へ繋がる） | プロセス（claim SoT） | 完了（commit 72a35ff） | 完了 |

## 9. タイムライン KPI
| 指標 | 値 |
|---|---|
| MTTD（公開〜検知） | 同日（公開直後にユーザー指摘） |
| MTTR（検知〜修正完了） | 実装 + release OAuth 設定後に確定 |

## 10. 関連リンク
- 起点クレーム: `../claim_C20260609-002_20260609_no-login-doukan/001_TRIAGE.md`
- flow 横展開: CF-20260609-009（O22/audit）, CF-20260609-010（O46 donation）, CF-20260609-011（claim auto-route）
- auth SPEC: `../001__shared_auth_SPEC.md` §3

## 11. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-09 | 初版 | /flow:fix |
