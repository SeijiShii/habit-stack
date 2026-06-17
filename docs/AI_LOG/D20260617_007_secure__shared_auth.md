# AI_LOG — /flow:secure（guest 自前署名 JWT 機構の L1 design 再レビュー）

- **実行日時**: 2026-06-17（JST）
- **コマンド**: /flow:secure（--phase=all 相当、/flow:auto §3.0c 鮮度ゲートから dispatch）
- **実行者**: seiji + Claude
- **状態**: 完了（新規 Critical 0 / High 0 / Medium 0）
- **含まれる decision 範囲**: 入力収集 / PJ 性質 / O23-O28+O54 照合 / レポート生成

## 主要決定サマリ

| decision_id | テーマ | chosen | type |
|---|---|---|---|
| D20260617-019 | L1 design 再レビュー（新 guest-JWT 機構） | O25/O23/O24/O26/O27/O28/O54 全 PASS。新規 §8 論点 0。HS256+timingSafeEqual+iss 検証+server 専用署名+404 存在秘匿+secret server-env-only を確認 | auto-recommended |

## 依存関係
- depends_on: D20260617-014（tdd C20260617-001 完了）、D20260616-006（前回 secure deps）

## 生成・更新したアーティファクト
- docs/SECURITY_REVIEW_20260617.md（L1、新規 finding 0）
- docs/AI_LOG/D20260617_007_secure__shared_auth.md
- docs/AI_LOG/INDEX.md（再生成）

## Decisions

```yaml
- id: D20260617-019
  timestamp: 2026-06-17T14:25:00+09:00
  question: 新 guest 自前署名 JWT 機構の L1 設計脆弱性照合
  chosen: 新規 Critical 0 / High 0 / Medium 0（全観点 PASS）
  chosen_type: auto-recommended
  context: |
    O25 秘密情報: GUEST_TOKEN_SECRET=server env のみ（VITE_ 露出なし）、.env.example 記載 + .gitignore 済、署名 server 専用・pure fn は secret 引数注入。
    O23 認可: 署名 server 専用 → client 不透明 token = sub 偽造不可（SEC-001 維持）。withOwner=server adapter のみ owner 解決・client 値不信用、requireOwner=owner 不一致を 404 存在秘匿。
    JWT 堅牢性: HS256 HMAC + timingSafeEqual（タイミング攻撃耐性）、header alg 無視で常に HS256 再計算（alg=none/confusion 不成立）、iss=habit-stack-guest 固定検証（Clerk JWT 誤受理防止）、exp 180日検証。
    O24 入力検証: parts!=3 malformed 弾き + JSON parse 失敗→401。O26 PII: token 値ログ非出力（コメント明記）。O27 レート: 既存 SEC-005 配下、POST 限定+secret 不在 503 degrade。
    O28 deps: node:crypto 組み込みのみ・lockfile 不変 → SECURITY_DEPS_20260616 fresh。
    O54 DSR: 既往充足（selfDelete/dataOps）、guest-JWT 化で履行性悪化なし。
    Info 注記（非 finding）: TTL 180日長命は owner churn 根治の設計意図、偽造不可・iss 固定で越境リスクなし。
    → 既存 SEC-001〜005（accepted-as-requirement）は新機構でも維持。release-pre セキュリティ面クリア。
```
