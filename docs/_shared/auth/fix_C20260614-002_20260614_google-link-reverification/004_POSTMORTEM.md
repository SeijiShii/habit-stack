# Postmortem: aged guest session の Clerk reverification 403 で Google 連携が恒久不能

> **重大度**: high
> **発生日**: 2026-06-14（fix C20260609-002 デプロイ後、aged session を持つ端末で顕在化）
> **対応完了日**: （CODE 実装済 + Clerk reverification 緩和 + aged guest 実機検証で確定）
> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, `./002_FIX_PLAN.md`

---

## 1. 概要
本番 /account「Google で引き継ぐ」が、**PC（fresh session）では動くが aged guest session では無反応**。原因は Clerk **reverification（step-up 再認証）**が `createExternalAccount`（機密操作）に最近の認証を要求し、window 切れの aged session を 403 で弾くこと。ticket ゲストは factor を持たず reverification を完了できず、サインアウト/リロードでも回復できないため**恒久的に詰む**。コードに catch が無く 403 が無言だったため「押しても何も起きない」になった。

## 2. 時系列
| 時刻 | イベント | 対応 |
|---|---|---|
| 2026-06-09 | fix C20260609-002 で動線（コード）実装。fresh session でのみ検証し ✅ 完了扱い | — |
| 2026-06-14 | seiji が本番スマホ（aged session）で「押しても何も起きない」を確認 | /flow:claim |
| 2026-06-14 | 当初仮説「本番 OAuth 設定欠落」→ PC で client_id 有効遷移を確認し否定 | TRIAGE §7 更新 |
| 2026-06-14 | chrome://inspect リモートデバッグで `403 "additional verification"` を直接観測 → reverification 確定 | /flow:fix |
| 2026-06-14 | CODE: onLink に catch + linkErrorMessage + role="alert"（無言失敗撲滅）。auth suite 32 tests green | 実装完了 |

## 3. 影響範囲
| 項目 | 内容 |
|---|---|
| 影響ユーザー数 | aged guest session を持つ全ユーザー（Google 連携＝データ引き継ぎ/複数端末同期が不能） |
| データ損失 | なし（連携が始まらないだけ。データ破壊・消失はない） |
| ダウンタイム | なし（guest として記録は正常に継続） |
| 売上 / SLA 影響 | 課金の前提（段階的認証）が aged guest で不全になり得る |
| セキュリティ影響 | なし |

## 4. 検知の経緯
- **開発者（seiji）の本番実機確認**で発覚。さらに推測で直さず chrome://inspect リモートデバッグで 403 を直接観測して原因を確定（CLAUDE.md「UI 不具合は実機ログで挙動を確かめてから直す」デバッグ方針に準拠）。

## 5. 対応の流れ
1. 検知: seiji の本番実機（aged session）確認。
2. triage: /flow:claim → 当初の設定欠落仮説を実機で否定 → reverification 403 を確定。
3. CODE 修正: onLink に catch + 可視化（本 fix、無言失敗の撲滅）。
4. release（PRIMARY 機能修正）: Clerk Dashboard で reverification 緩和 + aged guest 実機検証。
5. 横展開: perspectives O22 / release §3.4 #4.5 / audit #4 へ反映（CF-20260614-001）。

## 6. 直接原因 + 根本原因
（001_ROOT_CAUSE.md より）直接原因 = `onLink` の catch 欠如で 403 が無言 + aged session で reverification 403。根本原因 = **fresh session でしか検証していなかった**ことで、Clerk reverification が aged guest session を弾く挙動をテストでも本番検証でも捉えられなかった（外部要因 × テスト不足 × 検証ギャップの複合）。

## 7. 学習事項

### 7.1 良かった点
- 推測でコードを直さず、chrome://inspect リモートデバッグで **403 を直接観測して確定**（CLAUDE.md デバッグ方針の実践）。当初の設定欠落仮説を実機で否定できた。
- CODE 修正を防御（可視化）に限定し、機能修正（設定）と分離して整理できた。

### 7.2 改善点
- dev / fresh / E2E（stub auth）が **aged production guest を検証しない盲点**。
- 前回 fix C20260609-002 が動線実装で完了扱いし、**aged session 経路を未検証**だった。
- 連携失敗に catch が無く無言だったため原因究明が遅れた。

## 8. 再発防止策
| 対策 | 種別 | 担当 | 期限 |
|---|---|---|---|
| perspectives O22 に「guest/匿名 + 外部アカウント連携があるなら reverification 403 ハンドル（catch + 可視化）が必須」を required_signals 化（audit #4 step3.8 で静的検知） | プロセス（audit/perspectives SoT） | seiji（CF-20260614-001 で flow-suite に反映済） | 完了 |
| release §3.4 #4.5「aged guest social smoke（fresh だけでなく aged guest session で実機 1 回踏む）」追加 | プロセス（release） | seiji（CF-20260614-001 反映済） | 完了 |
| code: 連携失敗を無言にしない（onLink catch + role="alert"、本 fix） | コード | 完了（本 fix、auth suite 32 tests green） | 完了 |
| Clerk Dashboard で reverification 緩和（ゲスト中心アプリの初回連携に step-up 不要） | 設定（Class C） | seiji | release 時 |

## 9. タイムライン KPI
| 指標 | 値 |
|---|---|
| MTTD（前回デプロイ〜検知） | 数日（aged session を持つ端末で初めて顕在化） |
| MTTR（検知〜CODE 修正完了） | 同日（実機デバッグ → catch+可視化実装まで） |

## 10. 関連リンク
- 起点クレーム: `../claim_C20260614-002_20260614_google-login-no-op/001_TRIAGE.md` §7・§8
- 前回 fix: `../fix_C20260609-002_20260609_google-login-doukan/`
- flow 横展開: CF-20260614-001（O22 required_signals_reverification / release §3.4 #4.5 / audit #4 step3.8）

## 11. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-14 | 初版 | /flow:fix |
