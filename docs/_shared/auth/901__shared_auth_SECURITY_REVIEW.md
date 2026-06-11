<!-- auto-generated-start -->
# 設計レベル脆弱性レビュー — _shared/auth（新 endpoint DELETE /api/account）

**レビュー日**: 2026-06-12
**レビュー実施者**: Claude (claude-fable-5) + seiji
**対象**: `DELETE /api/account`（revise R20260611-002 self-service-delete）— release-pre 必須監査の後半（/flow:auto §3.0c から dispatch）
**入力**: `revise_R20260611-002_20260611_self-service-delete/001_REVISE_SPEC.md` + `api/account/delete.ts` + `src/services/auth/owner.ts` + concept §3/§8
**観点ソース**: ~/.claude/flow-data/perspectives.md (O23-O28 + O54)
**severity-threshold**: medium（legal_required は除外不可）
**前回レビュー**: SECURITY_REVIEW_20260608.md（プロダクト全体）/ SECURITY_DEPS_20260608.md（deps）

## 1. PJ 性質判定

- 複数ユーザー / 公開 / 有償（tip-jar donation）/ 個人情報扱いあり（活動記録）/ AI 利用なし / 国内向け — concept §1 確定値を採用（再確認なし）

## 2. 脆弱性パターン照合結果

### 2.1 サマリ

- Critical: 0 / High: 0 / Medium: 0 / Low: 0 / Info: 1
- 法令必須 (O54): 1 件 → **充足**（本 revise がまさに O54 消去権の履行実装）

### 2.2 詳細

#### [O23 認可漏れ] — ✅ 対応済み
- **照合結果**: SPEC §7.2 + 実装で対応済み。`withOwner`（owner はサーバ側 adapter からのみ解決、クライアント送信値を信用しない = SEC-001）+ `deleteAllData(db, owner)` は owner 配下行のみ物理削除（owner-scoped）。未認証 401。
- **越権削除の可能性**: なし（owner はサーバ強制、リクエストに owner 指定パラメータ自体が存在しない）。

#### [O24 入力検証] — ✅ 該当入力なし
- **照合結果**: body・クエリパラメータ不要の endpoint。ユーザー入力の攻撃面が存在しない。

#### [O25 秘密情報] — ✅ 新規秘密なし
- **照合結果**: 新規 env/secret の追加なし。`serverContext()` 経由の既存接続のみ。

#### [O26 PII ログ漏洩] (legal_required) — ✅ 問題なし
- **照合結果**: handler はログ出力なし。エラーレスポンスは AuthError メッセージのみで DB 内容を含まない。

#### [O54 DSR 履行可能性] (legal_required, O22×O12 ペア検査 CF-20260608-008) — ✅ **充足（本 revise が是正そのもの）**
- (a) in-app セルフサービス削除が実動作: `deleteAllData` + `wipeOwner` + AccountPage UI 導線（unit U-DEL-01〜09 + E2E E-DEL-01/02 green）
- (b) 開示 = in-app で自分の全データ閲覧可能（サマリ/記録画面）
- (c) 法務文書整合: プラポリは「アプリ内セルフサービスで削除」を約束、導線実装で約束を充足（REVISE_SPEC §3 で _shared/legal 整合確認済、文言変更不要）
- 匿名ゲストも有効な owner を持ち本人がアプリ内で自己完結削除可能（窓口代行の約束なし）。**履行不能な約束 anti-pattern に該当しない**。

#### [O27 レート制限] — Info（注記のみ）
- **照合結果**: 認証必須 endpoint（公開エンドポイントでない）のため require 対象外。破壊操作だが対象は本人データのみ + UI 二段階確認 + 冪等（再実行しても同じ最終状態）。専用レート制限は不要と判断。乱用時も被害は自己データに限定。

## 3. L4 依存スキャン差分（SECURITY_DEPS_20260608 以降）

- **lockfile 変更**: commit 11e4ad5 で `@playwright/test ^1.60.0`（devDependency）のみ追加。
- **npm audit (2026-06-12)**: 8 件（moderate 7 / critical 1）。Critical は **vitest UI server GHSA-5xrq-8626-4rwp（dev-only、[論点-011] accepted-risk 済）** で既知・変化なし。
- **`npm audit --omit=dev`: 0 脆弱性**（本番依存はクリーン）。Playwright 追加による新規脆弱性なし。

## 4. §8 未決事項への論点登録

新規論点なし（Critical/High 0）。既存 SEC 論点 status: 論点-004〜008 = accepted-as-requirement（実装充足済）、論点-011 = accepted-risk（dev-only）。

## 5. 次のステップ

- **release-pre 必須監査（audit full + secure）クリア** → P4.7 Release gate（`/flow:release` で未デプロイ改修 2 件を再デプロイ、Class B）。
<!-- auto-generated-end -->
