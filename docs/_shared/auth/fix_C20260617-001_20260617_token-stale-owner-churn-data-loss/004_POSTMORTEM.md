# Postmortem: 認証トークン陳腐化 → owner churn によるデータ消失

> **重大度**: high
> **発生日**: 〜2026-06-17（受動トリガー＝セッション失効後、継続的に潜在発生）
> **対応**: 2026-06-17（claim→fix 設計、案A 移植へ）
> **入力**: 000_調査レポート / 001_ROOT_CAUSE / 002_FIX_PLAN

---

## 1. 概要
匿名ゲストの owner を Clerk セッションの userId に直結し、guest identity をクライアント永続していなかったため、Clerk セッション失効後のリロードで新ゲスト userId が発行され owner が churn、owner-scoped なローカルデータが orphan 化（消失・再ログインでも復旧せず）。bousai-bag-checker は revise_003 で guest 自前署名 JWT 永続（Clerk 非セッション化）に移行済みで本事象なし。habit-stack/prayer-list は旧 ticket 方式のまま被災。

## 2. 時系列
| 時刻 | イベント | 対応 |
|---|---|---|
| 〜2026-06 | habit-stack/prayer-list が Clerk ticket 方式（ゲスト=Clerk セッション）で本番稼働 | — |
| 2026-06-02 | bousai/hana-memo/naze-bako は revise_003 で guest JWT 永続へ移行 | habit-stack は未追従 |
| 2026-06-16 | 別機序のデータ消失（C20260616-001 wipe）を fix・デプロイ | churn 経路は未着手 |
| 2026-06-17 | ユーザーがトークン失効→リロード消失を報告（claim C20260617-001） | バグ判定→fix |
| 2026-06-17 | bousai 比較で根本（guest identity 未永続）特定、案A 移植決定 | 本 fix |

## 3. 影響範囲
| 項目 | 内容 |
|---|---|
| 影響ユーザー数 | 報告 1 名。機序上、セッション失効する**全ゲスト/ユーザーに潜在波及**（受動・不可避トリガー） |
| データ損失 | あり（owner orphan 化。匿名で旧 userId 再到達不能なら事実上不可逆。ローカル分は migration で回収可） |
| ダウンタイム | なし（サイレント消失） |
| セキュリティ影響 | なし（消失方向。SEC-001 不変） |

## 4. 検知の経緯
- ユーザー（開発者）のドッグフーディング報告。**監視・計測では検知されない**（サイレント churn、エラーログなし）＝検知遅延の主因。

## 5. 対応の流れ
1. claim C20260617-001 でバグ判定。
2. 3 アプリ（bousai/habit-stack/prayer-list）の guest 認証アーキテクチャを比較 → 根本特定。
3. 案A（bousai guest-JWT 永続の移植）+ one-time orphan migration を決定。
4. **flow tooling 是正**（audit が本バグ class を検知できるよう perspectives + audit step 3.9 を CF-20260617-001 で修正）。
5. fix 実装は /flow:tdd へ。

## 6. 直接原因 + 根本原因
- 直接: `guestSession.ts:issueGuestTicket` が毎回 createUser、`AuthProvider` が owner=Clerk userId 直結、guest userId をクライアント未永続 → 失効で churn → `getAllByOwner` orphan（001 参照）。
- 根本: **匿名ゲストの owner 継続性（セッション失効耐性）が設計で未定義**。論点-009「案A（Clerk 永続化）」が未着手のまま放置。

## 7. 学習事項
### 7.1 良かった点
- bousai が同型問題を revise_003 で既に解決済みで、実証済みパターンを移植できた（新規設計リスク回避）。
- 「partial loss / silent churn」の症状切り分けで destructive wipe（C20260616-001）と別機序と即特定。

### 7.2 改善点
- 同型知見（O58 / guest-auth scaffold）が**他 PJ に横展開されていなかった**（bousai revise_003 → habit-stack/prayer-list 未追従）。
- 再発防止 perspective（CF-20260615-001）が **audit に配線されておらず検知できなかった**（signal を足して consumer step を配線し忘れる audit-hittability 欠落）。
- サイレント churn を捉える計測が無い。

## 8. 再発防止策
| 対策 | 種別 | 担当 | 期限 |
|---|---|---|---|
| audit step 3.9（owner churn / guest identity 永続）を新設し**機械検知**化 | ツール（audit/perspectives） | Claude | ✅ 2026-06-17 完了（CF-20260617-001、commit d01215a/829a1f1/9e451f8） |
| guest-auth-clerk-scaffold §1.7 で owner-scoped local-first は guest JWT 永続を必須化 | ツール（scaffold） | Claude | ✅ 2026-06-17 完了（commit 38fd50e） |
| habit-stack に bousai guest-JWT 機構を移植（本 fix 実装） | 実装 | /flow:tdd | 本チェーンで継続 |
| prayer-list の同型バグを別 claim+fix で起票・修正 | 実装（別 PJ） | seiji | tracked follow-up |
| 既に Neon に旧 owner で残るデータの復旧可否調査 | 調査 | seiji | follow-up |

## 9. タイムライン KPI
| 指標 | 値 |
|---|---|
| MTTD | 不明（サイレント、報告まで潜在）|
| MTTR（設計まで） | 同日 |

## 10. 関連リンク
- claim: `../claim_C20260617-001_20260617_token-stale-owner-churn-data-loss/`
- 範型: bousai-bag-checker `src/shared/auth/*` revise_003
- tooling 是正: flow-suite CF-20260617-001（audit #4 step 3.9 / perspectives O22 (D) / scaffold §1.7）

## 11. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-17 | 初版 | /flow:fix |
