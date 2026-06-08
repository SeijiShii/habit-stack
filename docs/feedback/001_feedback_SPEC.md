# feedback 機能仕様書

> **役割**: 好き嫌いリアクション（👍/👎 相当の自作 SVG）+ バグ報告ウィジェット。自動コンテキスト付与（PII scrub）→ 中央 feedback-hub へ送信 + 運用者即時通知。
> **タグ**: analytics, auth-required（owner 任意）
> **最終更新**: 2026-06-08
> **入力**: `../concept.md` §1.3 feedback / §6、perspectives O40、SEC-004(PII)
> **関連**: [論点-003] feedback-hub 連携（hub 未構築なら別 PJ 化）

---

## 1. 詳細 UC

### UC: フィードバック送信（O40）
- トリガー: どの画面からでも 1 タップで開けるフィードバックボタン。
- 入力: リアクション（good/bad）+ 任意の自由記述（バグ報告）+ 任意スクショ添付。
- 処理:
  1. 自動コンテキスト付与（画面/ルート、アプリ version、UA、時刻、任意で直近操作）。
  2. **送信前 PII scrub**（メール/位置/本文中の個人情報を除去、SEC-004/O28 整合）。
  3. feedback-hub の ingestion 契約 `POST /api/feedback`（hub endpoint）へ送信。
  4. **二重シンク**: (a) 運用者へ即時通知（共有チャンネル: Telegram/メール push）で「気づく」、(b) hub に蓄積で「貯める・トリアージ」。
- 出力: 「ありがとうございます」控えめ表示。

## 2. 入出力
### 2.1 API
| メソッド | パス | 入力 | 出力 |
|---|---|---|---|
| POST | /api/feedback | {reaction, message?, screenshot?, context}（PII scrub 済） | 202 |

本サービスは hub の安定 ingestion 契約に `service`=habit-stack ID + hub endpoint env を設定してウィジェットを埋めるだけ（hub 無改修、O40）。

### 2.2 副作用
- hub へ送信、運用者通知。スクショは任意。

## 3. データモデル
- 自前 DB 保持は最小（送信は hub へ）。必要なら送信ログのみ。新規テーブルなし（MVP は hub 集約）。

## 4. バリデーション + エラーケース
| ID | 条件 | 振る舞い |
|---|---|---|
| V1 | message > 1000 | 切り詰め |
| E1 | hub 送信失敗 | ローカルにキューし再送（控えめ） |
| E2 | PII 検出 | scrub してから送信（除去をログ） |
| E3 | スパム連投 | レート制限（O27）+ Turnstile（必要時） |

## 5. 機能固有 NFR + 連携
### 5.1 NFR（SEC-004）
- 送信前 PII scrub 必須（メール/位置/本文 PII）。スクショもメタ除去。
### 5.2 連携
| 連携先 | 内容 |
|---|---|
| feedback-hub（外部） | ingestion `POST /api/feedback` |
| 運用者通知チャンネル | 即時 push |
| _shared/auth | owner（任意、匿名でも送信可） |
| app-shell | グローバルフィードバックボタン配置 |

## 6. タグ別追加項目
### 6.6 analytics
- イベント: feedback_submitted（reaction 種別、画面）。PII なし。
### 6.1 認可
- 匿名でも送信可（owner 任意）。owner があれば紐付け。

## 7. スコープ外
- hub 本体の構築（別 PJ、[論点-003]）
- トリアージ UI（hub 側 + /flow:claim）

## 8. 未決事項
### [論点-010] feedback-hub の所在
- **影響範囲**: /api/feedback 送信先、env、二重シンク
- **問い**: 既存 feedback-hub（service-hub 群）が稼働しているか。`HUB_FEEDBACK_ENDPOINT` / `HUB_SERVICE_INFO_SECRET` の中央発番。
- **推奨**: 既存 hub があれば ingestion 契約に接続のみ。未構築なら「共有 feedback-hub を別 PJ で立ち上げ」を ideate→concept（concept §8 論点-003 と統合）。MVP は env 未設定時ローカルキュー or 運用者通知のみで degrade。
- **判断期限**: 実装着手前 / **担当**: seiji（hub 状況確認）

## 9. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
