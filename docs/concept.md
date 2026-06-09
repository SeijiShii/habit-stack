# つみあげルーティン (habit-stack)

> **一行で言うと**: 続けたい良い習慣を「活動セット」として登録し、時間ベース（開始→終了→一時停止→再開）で実行・記録して、どれだけ継続できているかを可視化するアプリ。

| 項目 | 内容 |
|---|---|
| ユーザー | 良い習慣（筋トレ・語学・読書・ストレッチ等）を毎日続けたい個人。基本は匿名、引き継ぎたいときだけ Google ログイン |
| 解決する課題 | 習慣が続かない／「今日やったか」が曖昧／複数習慣のルーティン実行を支える手元の仕組みがない／継続の手応えが見えない |
| 提供価値 | ルーティン（活動セット）の時間ベース実行 ＋ 罪悪感を煽らない継続の手応え |
| 現フェーズ | 企画（concept 初版） |
| 最終更新 | 2026-06-08 |

> **source_wants**: `./wants.md`（origin: human-seed `I20260608-001`、`/flow:seed`）

---

## 1. プロダクト概要

「つみあげルーティン」は、筋トレ・語学・読書のような**続けたい良い習慣**を、時間帯ごとの**活動セット**として登録し、各アイテムを**時間ベース**で実行・記録するアプリ。チェックボックス型の習慣アプリと違い、**実際にどれだけ時間をかけたか**と**今日の中身メモ**が残り、**罪悪感を煽らない形での継続の手応え**を可視化する。

姉妹プロダクト `time-budget`（リリース済）が *時間の使い方 × ムード* の振り返り軸なのに対し、本案は**ルーティンの時間ベース実行 ＋ 継続率**に特化した別軸。技術構成は `time-budget` と同型で知見を流用する。

### 1.1 主要ユースケース

1. **活動セットを作る** — 「平日の朝」セット = ストレッチ→英単語→筋トレ のようにアイテムを並べる。セットは時間帯（朝/昼/夕/夜）を持つ。
2. **アイテムを CRUD** — 活動セット内のアイテム（個々の習慣）を追加・編集・並べ替え・削除。
3. **活動セットを CRUD** — セット自体を追加・編集・削除。
4. **時間ベースで実行・記録** — 最初のアイテムで「開始」、終了すると「次を開始／一時停止」を選択、一時停止後は「同じ活動を再開」か「次を開始してセット再開」。経過時間は**開始タイムスタンプと壁時計の差分**で算出（タイマーを生で回さないためバックグラウンド/スリープ/タブ閉じでも正確）。
5. **今日の中身メモ** — アイテムごとに短いメモ（読んだ本・ページ数など）を残す。
6. **継続サマリ** — 何日継続できているか／期間指定で何％の日数で継続できたかを可視化（罪悪感を煽らない手応えとして）。
7. **作者を応援（任意）** — 継続サマリ閲覧時など満足ピークで、非ブロッキングに「💛 100円で応援」ワンタップ投げ銭（Stripe 単発、**ログイン不要・ゲストのまま完結**）。応援は対価のないギフトのため、金額に関わらずログインを要求しない（O46🎁 / CF-20260609-010）。
8. **匿名 → アカウント連携** — 初回は匿名（IndexedDB に local-first 保存）で 0 タップ実行。**データを引き継ぎたいとき・デバイス間同期のとき**に Google ログインを段階的に要求し、ローカルデータを引き継ぐ（任意導線、`/account` 画面から）。

### 1.2 スコープ

**含むもの**:
- 活動セット / アイテムの CRUD・並べ替え
- 時間ベース実行フロー（開始/終了/一時停止/再開、タイムスタンプ方式）
- アイテム単位の今日メモ
- 継続サマリ（継続日数・継続率・期間指定）
- 匿名ゲスト → Google 段階的認証 + ローカルデータ引き継ぎ
- tip-jar（100円ワンタップ投げ銭）
- 法務公開ページ（プラポリ / 利用規約 / 特商法表記）
- フィードバック導線（好き嫌い + バグ報告 → feedback-hub、O40）

**含まないもの（明示除外）**:
- 連続記録ストリークで毎日開かせる中毒性演出 / ランキング / ガチャ（charter §2.2）
- SNS 強制シェア・招待競争（charter §2.2）
- 外部 AI 機能（MVP では使わない、記録・集計が主）
- サブスク / ペイウォール（完全無料 + tip-jar）
- 追跡型・UX 阻害広告
- Web Push 通知（MVP 外、PWA iOS Safari の不安定さ回避）

### 1.3 ドキュメントフォルダ分割設計

> ここで設計するのは `docs/` 配下の**ドキュメント置き場**の構造であり、実装コード（`src/`）の構造ではない。

#### 1.3.1 機能フォルダ（業務ドメイン別）

| フォルダ (docs/ 配下) | 含む機能 | 担当する画面 / API | 依存 | 優先度 | 基盤 |
|---|---|---|---|---|---|
| docs/activity-sets/ | 活動セット + アイテムの構成管理（CRUD・並べ替え・時間帯） | セット一覧 / セット編集 / アイテム編集、`/api/sets` `/api/items` | _shared/db, _shared/auth, _shared/local-sync | 3 | ❌ |
| docs/execution/ | 時間ベース実行フロー（開始/終了/一時停止/再開、タイムスタンプ記録、今日メモ） | 実行画面 / セッション制御、`/api/sessions` `/api/records` | activity-sets, _shared/local-sync, _shared/db, _shared/auth | 4 | ✅ |
| docs/streak-summary/ | 継続サマリ（達成日判定・継続日数・継続率・期間指定可視化） | サマリ画面、`/api/summary` | execution, _shared/db | 5 | ❌ |
| docs/tip-jar/ | 100円ワンタップ投げ銭（満足ピークで非ブロッキング、Stripe 単発） | 応援ボタン / 完了画面、`/api/tip` `/api/stripe-webhook` | _shared/auth, _shared/db | 5 | ❌ |
| docs/feedback/ | 好き嫌い + バグ報告ウィジェット（自動コンテキスト + PII scrub → feedback-hub） | フィードバックウィジェット、`/api/feedback` | _shared/auth | 4 | ❌ |

#### 1.3.2 横断フォルダ（_shared/*）

| フォルダ (docs/ 配下) | 責務 | 含む設計 | 依存 | 優先度 | 基盤 |
|---|---|---|---|---|---|
| docs/_shared/db/ | DB スキーマ・マイグレーション（Neon + Drizzle） | テーブル・インデックス・制約 | (なし) | 1 | ✅ |
| docs/_shared/types/ | 共通型定義 | エンティティ型・enum（時間帯・実行状態） | (なし) | 1 | ✅ |
| docs/_shared/auth/ | 認証・認可基盤（Clerk 匿名ゲスト → 段階的認証 + ゲスト→アカウント連携データ引き継ぎ） | 匿名セッション・Google リンク・owner-check | _shared/db | 2 | ✅ |
| docs/_shared/local-sync/ | local-first 同期層（IndexedDB 保存 + Neon 同期キュー、タイムスタンプ方式、競合解決） | オフライン書き込み・同期キュー・last-write-wins | _shared/db, _shared/types | 2 | ✅ |
| docs/_shared/legal/ | 法務公開ページ（プラポリ / 利用規約 / 特商法表記） | `/legal/*` 静的ページ + 同意取得 | (なし) | 2 | ❌ |
| docs/_shared/app-shell/ | **アプリ合成レイヤ**（部品を動く・デプロイ可能なアプリに組み立てる、O57） | 合成ルート(main/App/router/providers) + UI↔data 配線 + API ルートハンドラ層 + Clerk セッション確立 + PWA + deploy scaffold | **全 feature + 全 _shared** | **最大（最後）** | ❌ |

#### 1.3.3 依存・優先度・基盤の定義

- **依存**: そのフォルダが先に必要とする他フォルダ。循環依存なし。
- **優先度**: topological sort 順（小さいほど先）。
- **基盤**: 他の多くから参照されるフォルダ。横断は基本 ✅。execution は activity-sets・summary・tip-jar から実行記録を介して参照されるため ✅。

#### 1.3.4 優先度算出（topological sort 結果）

```
優先度1: _shared/db, _shared/types        （依存なし＝基盤の基盤）
優先度2: _shared/auth (←db), _shared/local-sync (←db,types), _shared/legal
優先度3: activity-sets (←db,auth,local-sync)
優先度4: execution (←activity-sets,local-sync,db,auth), feedback (←auth)
優先度5: streak-summary (←execution,db), tip-jar (←auth,db)
優先度最後: _shared/app-shell (← 全部、O57 合成レイヤ)
```

循環依存: なし。

#### 1.3.5 命名規約

- 機能フォルダ: ケバブケース業務名（`activity-sets`, `streak-summary`）
- 横断フォルダ: `_shared/<技術領域>/`

### 1.4 実装コードフォルダ構成（たたき台）

> Q11 で確定した Vite + React + TypeScript（PWA）+ Vercel Functions に整合したたたき台。実装フェーズで詳細化。

```
src/
  features/           # 機能単位（§1.3.1 と命名統一）
    activity-sets/
    execution/
    streak-summary/
    tip-jar/
    feedback/
  components/         # 共通 UI 部品（shadcn/ui ベース）
  hooks/              # 共通フック（useTimer = タイムスタンプ差分, useSync 等）
  lib/                # ユーティリティ（日付・継続率算出・IndexedDB ラッパ）
  services/           # Neon/Drizzle クライアント・同期キュー・Clerk ラッパ
  types/              # 共通型（§1.3.2 _shared/types に対応）
  routes/            # ルーティング
api/                 # Vercel Functions（/api/sets, /api/sessions, /api/stripe-webhook 等）
db/                  # Drizzle スキーマ・マイグレーション（§1.3.2 _shared/db に対応）
```

- 機能名は §1.3.1 と揃える。横断は §1.4 では `src/lib` `src/services` `db/` に分散実装される（集約設計 → 分散実装）。

## 2. 前提条件・制約

- **業務前提**: 個人向け習慣記録ツール。1 ユーザー = 自分のデータのみ（マルチテナント、行レベル owner-check）。
- **技術制約**: 無料枠厳守（charter §0 Neon スタック）。PWA で local-first、オフライン記録可。匿名既定。
- **体制・予算・納期**: 個人開発・AI 駆動・予算 $0 厳守（tip-jar の従量手数料のみ）・納期は段階リリース（MVP → 公開）。

## 3. 非機能要件

| 項目 | 目標値 | 根拠 |
|---|---|---|
| 性能 | 起動 → 実行開始まで体感 1 秒以内（0 タップ匿名起動、local-first） | charter §1.1 気軽さ、UX 摩擦回避 |
| 可用性 | オフラインでも記録継続可（PWA + IndexedDB）。同期はオンライン復帰時 | 主要 UC4 の時間ベース記録が肝 |
| 記録の正確性 | バックグラウンド/スリープ/タブ閉じでも経過時間が正確（タイムスタンプ差分方式、生タイマー不使用） | 時間ベース記録の信頼性 |
| データ整合性 | 匿名 → Google リンク時にローカルデータを欠損なく引き継ぐ。同期競合は last-write-wins（端末時計ずれ考慮） | UC8、time-budget 知見流用 |
| セキュリティ | 行レベル owner-check（自分のデータのみ）、入力検証（Zod）、秘密情報は server side のみ、Sentry の PII scrub | [論点-SEC] /flow:secure 実施前提 |
| 運用・監視 | Sentry（エラー）、Vercel Web Analytics（cookieless）、自前コストログ（外部 API 積算） | 無料枠超過監視、§4.6 |
| UX 安全性 | ストリーク/継続率は「手応え」止まり。罪悪感・競争・射幸心を煽らない（穴あき許容＝セット単位だが一部未実行でも達成） | charter §2.2、§4.6 ではなく §1.2 除外と整合 |

### 3.X セキュリティ要件 (auto-added by /flow:secure 2026-06-08)

<!-- auto-generated-start -->
- **[SEC-001] 認可（O23）**: 全 API endpoint で行レベル owner-check（`ownerId = auth.userId()`）必須。owner resolver を `_shared/auth` に実装、Drizzle クエリは user_id で絞る。匿名 local_id → 認証 user_id の所有権移譲も設計。
- **[SEC-002] 入力検証（O24）**: 全 API 入力を Zod スキーマで検証。note は文字長制限 + 表示時エスケープ。CSV エクスポートは `=+-@` 始まりをエスケープ。
- **[SEC-003] 秘密情報（O25）**: secret key（Clerk/Stripe/DB/Stripe webhook/server Sentry）は `VITE_` プレフィックス禁止（クライアント露出防止）。publishable のみ `VITE_*`。`.env.example` 作成 + `.gitignore` で `.env*.local` 除外（済）。ビルド成果物 grep を CI 化。
- **[SEC-004] PII ログ（O26、法令必須）**: Sentry `beforeSend` で PII マスク。feedback 送信前 PII scrub。エラーに DB 内容/トークンを含めない。アナリティクスは匿名 ID（cookieless）。
- **[SEC-005] レート制限/webhook 署名（O27）**: Stripe webhook は署名検証必須（raw body + `STRIPE_WEBHOOK_SECRET`）。feedback/tip 開始はレート制限（Vercel Edge / Upstash）+ Turnstile。同期エンドポイントは認証必須でスコープ最小化。
<!-- auto-generated-end -->

## 4. 全体アーキテクチャ

```
ユーザー(PWA: Vite+React+TS)
  ├─ IndexedDB (local-first: 匿名でも即記録、オフライン可)
  │     └─ 同期キュー ──(オンライン時)──▶ Vercel Functions ──▶ Neon (Postgres/Drizzle)
  ├─ Clerk (匿名ゲスト → 段階的認証: Google リンク, 課金時必須)
  └─ Stripe (100円ワンタップ投げ銭) ◀── Webhook ──▶ Vercel Functions
監視: Sentry / Vercel Web Analytics(cookieless)
```

### 4.1 主要コンポーネント

| 名前 | 責務 | 技術領域（具体名は例示） |
|---|---|---|
| PWA フロント | 実行 UI・local-first 記録 | Vite + React + TS + shadcn/ui |
| local-sync 層 | IndexedDB 保存 + Neon 同期 | idb + 自前同期キュー |
| API 層 | CRUD・サマリ・課金 webhook | Vercel Functions |
| データ層 | 永続化 | Neon (Postgres) + Drizzle ORM |
| 認証基盤 | 匿名ゲスト → 段階認証 | Clerk |
| 課金 | 単発投げ銭 | Stripe |

### 4.2 技術スタック（方向性）

- フロント: クライアント主体 SPA + PWA（例: Vite + React + TypeScript）
- バック: サーバーレス関数（例: Vercel Functions）
- データ層: マネージド Postgres + 型安全 ORM（例: Neon + Drizzle）、クライアント側 local-first ストア（例: IndexedDB）
- 認証: 匿名ゲスト + 段階的認証（例: Clerk）
- 課金: 単発決済（例: Stripe）
- 監視・ログ: エラー監視 + cookieless アナリティクス（例: Sentry + Vercel Web Analytics）

### 4.3 リソース選定たたき台

> 各サービスの pricing は変動。採用判断時は最新公式 pricing を確認。

| カテゴリ | 推奨具体名 | 代替候補 | 選定根拠 | 想定単価 (USD/月、桁感) |
|---|---|---|---|---|
| フロント FW | Vite + React + TS | Next.js | preferences §2.1（6 PJ）/ クライアント主体・SEO 必須でない | $0 ※ {{2026-06 時点想定、最新 pricing 要確認}} |
| UI | shadcn/ui + Tailwind | MUI | preferences §2.14（6 PJ）/ 軽量・カスタム容易 | $0 ※ |
| 状態/データ取得 | TanStack Query | SWR | preferences §2.15 / 同期・キャッシュモデル適合 | $0 ※ |
| チャート | Recharts | visx | preferences §2.16 / 継続率の振り返りグラフ | $0 ※ |
| local-first ストア | IndexedDB (idb) | localStorage | オフライン記録・タイムスタンプ保存 | $0 ※ |
| BaaS/関数 | Vercel Functions | Cloudflare Workers | preferences §2.2（6 PJ）/ ホスティング一体 | $0 ※（Hobby） |
| DB | Neon (Postgres) | Supabase | preferences §2.3（6 PJ）/ サービスごと DB 分離・無料 10 DB | $0 ※（Free 0.5GB） |
| ORM | Drizzle | Prisma | preferences §2.13（6 PJ）/ Neon 親和・型安全 | $0 ※ |
| 認証 | Clerk | Supabase Auth | preferences §2.4（6 PJ）/ 匿名ゲスト + 段階認証（O22） | $0 ※（Free 10k MAU） |
| ホスティング | Vercel Hobby | Cloudflare Pages | preferences §2.5（6 PJ） | $0 ※ |
| 課金 | Stripe（単発） | Paddle | preferences §2.19 / 投げ銭・固定費ゼロ・従量手数料のみ | 従量（手数料のみ）※ |
| 監視 | Sentry (Free) | — | preferences §2.6（6 PJ）/ 5K events 無料 | $0 ※ |
| アナリティクス | Vercel Web Analytics (cookieless) | PostHog | preferences §2.7 / consent banner 不要 | $0 ※（Hobby） |
| CI/CD | GitHub Actions + Vercel Preview | — | preferences §2.8（6 PJ） | $0 ※ |
| ドメイン | 既存ドメインのサブドメ運用 | vercel.app デフォルト | O29 / 撤退リスク最小 | $0〜（年額別途）※ [論点-002] |

各行末 `※ {{2026-06 時点想定、最新 pricing 要確認}}`。

### 4.4 想定コストサマリ

| 区分 | 月額目安 (USD) | 内訳の例 |
|---|---|---|
| 個人・無料枠 | $0 | Neon Free + Vercel Hobby + Clerk Free + Sentry Free + Vercel Web Analytics Free（Stripe は従量手数料のみ） |

**本プロジェクトのレンジ**: 個人・無料枠（根拠: 個人ツール / charter §0 無料枠厳守 / tip-jar 従量のみ）。
**無料枠厳守**: 上限到達時は §4.3 の代替候補に切替判断。商用化想定なし。

### 4.5 ローカル開発環境計画

#### 4.5.1 開発スタイル
**サーバーレス emulation + ハイブリッド**: アプリ本体は Vite dev server（ホスト）、API は `vercel dev`、DB は Neon（クラウド開発ブランチ）。コンテナ不要寄り。
**理由**: §4.3 が Vercel Functions + Neon（マネージド）のため、ローカルに重い DB を立てず Neon の dev ブランチを使う。

#### 4.5.2 必要サービス
| サービス | 役割 | ローカル起動方式 | ポート | 永続化 |
|---|---|---|---|---|
| Vite dev server | フロント | `npm run dev` | 5173 | host-fs |
| Vercel Functions | API | `vercel dev` | 3000 | — |
| Neon (dev branch) | DB | クラウド（ブランチ） | — | クラウド |
| Clerk (dev instance) | 認証 | クラウド（dev keys） | — | クラウド |

#### 4.5.3 環境変数・シークレット管理
- `.env.example`（ダミー値、コミット可） / `.env.local`（実値、`.gitignore` 必須）
- 平文コミット禁止: `CLERK_SECRET_KEY` / `DATABASE_URL` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `SENTRY_DSN`(server) / `HUB_*`

#### 4.5.4 起動・停止・リセットコマンド
| 操作 | 抽象表現 | 例 |
|---|---|---|
| 起動 | 統合 launcher | `./scripts/dev.sh`（Vite + vercel dev 並行起動 + health check）|
| 停止 | 全停止 | `./scripts/stop.sh` / Ctrl+C |
| マイグレーション | スキーマ反映 | `npm run db:migrate`（Drizzle） |
| リセット | dev ブランチ再作成 | Neon ブランチ reset + `db:migrate` |

> **dev script 計画（O36）**: launcher = bash（`scripts/dev.sh`）。起動順 = DB 接続確認 → API（vercel dev）→ フロント（Vite）。health check = `/api/health`。smoke endpoint = `/api/health` / `/`（トップ）/ `/api/sets`（要認証 401 で疎通確認）。`scripts/stop.sh` は dev プロセス group を kill。

#### 4.5.5 開発フロー上の留意点
- 初回: `npm i` → `.env.local` 整備 → `db:migrate`
- ホットリロード: Vite（フロント）/ vercel dev（API）
- WSL2: `scripts/dev.sh` を WSL 側で実行、スマホ実機確認時は port-forward（`/flow:release` Phase 2 で案内）

#### 4.5.6 CI/CD との関係
- CI は同じ Neon dev ブランチを使わず、ephemeral ブランチ or テスト DB。本番との差異は Clerk 本番 keys のみ。

### 4.6 コスト・収益追跡と継続判断ループ

#### 4.6.1 PJ 性質別の必要レベル
**本 PJ の該当レベル**: 個人ツール / 無料枠（tip-jar 従量のみ）。コスト追跡 ✅必須 / 無料枠超過アラート ✅必須 / 収益指標 ❌不要（投げ銭は経常収益でない）/ BEP ❌不要 / レビュー 四半期推奨 / 撤退判断 必須（無料枠超過時の対応方針）/ 判断主体 本人。

#### 4.6.2 コスト集計メカニズム（全 PJ 性質で必須）
- 外部呼び出しは少ない（Stripe webhook / Clerk）が、Neon 行数・Vercel Functions 実行数・帯域を自前ログ積算。
- 単価は `.env` で管理（コードへハードコード禁止）。例:
  ```
  COST_VERCEL_BANDWIDTH_PER_GB=0
  COST_NEON_STORAGE_PER_GB_PER_MONTH=0
  COST_STRIPE_FEE_PER_TXN_PCT=3.6
  ```
- 無料枠 80% / 100% / 120% でアラート（メール / Sentry）。
- 月次で Vercel/Neon ダッシュボードと突合（誤差 >10% で単価再調査）。

#### 4.6.3 追跡するコスト指標
| 指標 | 集計頻度 | 集計元 |
|---|---|---|
| Neon ストレージ / コンピュート時間 | 日次 | Neon ダッシュボード + 自前ログ |
| Vercel Functions 実行数 / 帯域 | 日次 | Vercel ダッシュボード |
| Clerk MAU | 月次 | Clerk ダッシュボード（10k 無料） |
| Stripe 手数料 | 月次 | Stripe（投げ銭額 × 従量） |

#### 4.6.4 収益指標
収益は tip-jar 投げ銭のみ（経常収益でない）。商用化想定なしのため MRR/ARR/BEP は不要。投げ銭累計のみ参考記録。

#### 4.6.7 継続 / 縮退 / 撤退判断基準
| 判断 | 基準 | 対応 |
|---|---|---|
| 継続 | 無料枠内 | 通常運用 |
| 縮退 | 一部機能が無料枠を圧迫 | 該当機能の軽量化 |
| 一時停止 | 無料枠超過予測 + 代替準備未完 | 新規受付制限 |
| 撤退 | 無料枠超過が続き代替も無し | §4.7.5 撤退手順、データエクスポート提供 |

**本 PJ の撤退基準**: 無料枠超過が継続し代替（§4.3）でも収まらない場合。判断主体: 本人。

### 4.7 公開戦略・ドメイン・リバースプロキシ

#### 4.7.1 ドメイン情報
- 既存ドメイン: あり想定（`givers.work` 等、保有ドメイン）→ サブドメ運用 `habit-stack.<domain>` 推奨（撤退時 DNS 1 行削除）。検証段階は `*.vercel.app` で開始。確定は [論点-002]。

#### 4.7.2 公開構成パターン
**(A) PaaS 完結**（Vercel）。運用負担ゼロ、リバースプロキシ不要。

#### 4.7.5 撤退時の手順
1. 事前通知（アプリ内バナー）→ 2. データエクスポート機能提供（JSON/CSV）→ 3. Stripe 投げ銭停止（不要、単発のため自然終了）→ 4. DNS サブドメ削除 → 5. Neon DB バックアップ N ヶ月保管 → 6. DB 削除 → 7. registry を `status=retired` に更新。

### 4.8 サービス公開周知 / マーケティング戦略

#### 4.8.1 チャネル使い分け（本 PJ 確定）
| 優先度 | チャネル | 本 PJ の採用 |
|---|---|---|
| ★★★ 必須 | 製品内グロース（成果物シェア）+ SEO | 継続サマリの「振り返りカード」を控えめなシェア導線で（§4.8.2） |
| ★★★ 必須 | note（汎用ブログ） | 月 1 記事 |
| ★ 既存維持 | X（Build in Public） | 週 1-3、超高速 AI 駆動開発 / time-budget 姉妹案として |
| 任意 | Product Hunt / Indie Hackers | 後日 |

#### 4.8.2 製品内グロース設計
- シェア対象: 継続サマリの「今週の手応えカード」（達成日数・継続率を穏やかに可視化）。
- 自然な OG カード生成（§4.8.5）+ 控えめな URL 埋め込み。
- **アンチパターン回避（charter §2.2）**: 強制シェアモーダル / 招待競争ランキング / ガチャ報酬は作らない。「シェアしなくても全機能使える」を維持。

#### 4.8.4 Build in Public ストーリー軸
- 「AI 駆動で週 1 ペースの新サービス公開」「time-budget の姉妹（時間の家計簿 → 習慣の積み上げ）」「撤退も透明化」。

#### 4.8.5 OGP / Twitter Card
- `og:title/description/image/url` 全設定、`twitter:card=summary_large_image`、動的 OG 画像検討。

#### 4.8.7 コンテンツペース
- 最小: 月 1 記事 + 週 1 ツイート。疲弊しない継続を優先。

#### 4.8.9 計測
- UTM / Referer 流入計測（Vercel Web Analytics、cookieless で consent 不要）。

## 5. データ設計（高レベル）

### 5.1 主要エンティティ
- **user**: Clerk user id（匿名ゲスト id 含む）。匿名 → Google リンク時に id 統合。
- **activity_set**: id, user_id, name, time_of_day(enum: morning/noon/evening/night), sort_order, created_at, updated_at
- **activity_item**: id, set_id, name, sort_order, created_at, updated_at
- **execution_session**: id, user_id, set_id, started_at, ended_at(null=進行中), status(running/paused/done), local_id(IndexedDB 由来), synced_at
- **execution_record**: id, session_id, item_id, started_at, ended_at, elapsed_sec, paused_total_sec, note(短文), local_id, synced_at
- **daily_achievement**（導出 or キャッシュ）: user_id, set_id, date, achieved(bool) — **継続の定義: その日にセット内の 1 アイテム以上を実行 → 達成（穴あき許容）**

> **継続率の算出**: 期間指定で `達成日数 / 対象日数 × 100`（達成 = セット単位、1 アイテム以上実行）。セット完遂率（全アイテム実行日 / 達成日）は補助指標。all-or-nothing にしないため穴あき日も達成にカウント。

### 5.2 データフロー
1. 実行操作（開始/終了/一時停止）→ IndexedDB に即書き込み（local_id 付与、タイムスタンプ記録）
2. オンライン時、同期キューが未同期レコードを Vercel Functions 経由で Neon へ upsert（last-write-wins、サーバ受信時刻でなく端末タイムスタンプ基準、競合は updated_at 比較）
3. 継続サマリは Neon（認証済）or IndexedDB（匿名）から達成日を集計

## 6. 外部連携

| 連携先 | 用途 | 方式 | 認証 |
|---|---|---|---|
| Clerk | 認証（匿名ゲスト + 段階認証 + Google リンク） | SDK | API キー（`.env.local` / Vercel env）|
| Stripe | 100円ワンタップ投げ銭（単発） | SDK + Webhook | Secret Key / Webhook Secret（server side のみ）|
| Sentry | エラー監視 | SDK | DSN（server 側は秘匿、client DSN は公開可）|
| Vercel Web Analytics | cookieless アナリティクス | スクリプト | プロジェクト紐付け |
| feedback-hub | フィードバック集約（O40） | `POST /api/feedback` → hub ingestion | 共有シークレット env [論点-003] |

- **外部 AI サービス利用: なし**（Q12.5 で明示確認、根拠: 記録・集計が主で AI の差別化価値が薄い。MVP 外）。
- **アナリティクス: 使う（Vercel Web Analytics, cookieless）**（Q12.6、consent banner 不要のため個人情報保護法/GDPR でも banner 省略可）。

## 7. 決定事項ログ

| 日付 | 決定内容 | 根拠 | 影響セクション | decision_id |
|---|---|---|---|---|
| 2026-06-08 | 継続の定義 = セット単位・穴あき許容（1 アイテム以上実行で達成） | seiji 明示回答 | §1.1 §3 §5.1 | [D20260608-003](./AI_LOG/D20260608_001_concept_initial.md#decisions) |
| 2026-06-08 | 実行/同期 = ローカルファースト + タイムスタンプ方式（IndexedDB → Neon 同期） | Q 回答（推奨採用） | §1.1 §3 §4 §5.2 _shared/local-sync | [D20260608-004](./AI_LOG/D20260608_001_concept_initial.md#decisions) |
| 2026-06-08 | スタック = time-budget sibling（Neon/Clerk/Vercel/Drizzle/shadcn/Stripe tip-jar） | wants + preferences（6 PJ） | §4.2 §4.3 | [D20260608-005](./AI_LOG/D20260608_001_concept_initial.md#decisions) |
| 2026-06-08 | 認証 = Clerk 匿名ゲスト → 段階認証（O22）、課金時 Google リンク必須 | wants / preferences §2.4 | §1.1 §4.3 _shared/auth | [D20260608-006](./AI_LOG/D20260608_001_concept_initial.md#decisions) |
| 2026-06-08 | 外部 AI 使わない / アナリティクス = Vercel Web Analytics(cookieless) | wants / preferences §2.7 | §6 §4.3 | [D20260608-007](./AI_LOG/D20260608_001_concept_initial.md#decisions) |

## 8. 未決事項（論点リスト）

### [論点-001] ストリーク／継続率の見せ方（罪悪感を煽らない UX）
- **影響範囲**: §1.1 UC6、streak-summary、§4.8.2、design
- **詰めるべき問い**: 連続日数の演出は手応え止まりにできるか／穴あき日を「失敗」に見せない表現／期間サマリの基準日。
- **候補案**:
  - 案 A: 達成日を穏やかなドット/カードで可視化、連続記録は「🔥手応え」止まり、途切れを赤くしない ／ 利点: charter §2.2 適合 ／ 欠点: モチベの引きが弱い可能性
  - 案 B: 連続記録を強調しストリーク演出 ／ 利点: 引きが強い ／ 欠点: 罪悪感・中毒性（charter §2.2 抵触）
- **推奨**: 案 A。理由: charter §2.2 厳守 + 穴あき許容の決定（D20260608-003）と一貫。詳細は `/flow:design` で確定。
- **判断期限**: Phase 1.5 デザイン
- **担当**: seiji + /flow:design

### [論点-002] 公開ドメイン（サブドメ）の確定
- **影響範囲**: §4.7、PREREQUISITES §3
- **詰めるべき問い**: 既存保有ドメインのサブドメ（`habit-stack.<domain>`）か新規取得か。検証は `*.vercel.app`。
- **推奨**: 既存ドメインのサブドメ運用（O29、撤退リスク最小）。
- **判断期限**: 公開準備（Phase 4）
- **担当**: seiji

### [論点-003] feedback-hub 連携（共有シークレット / hub 構築状況）
- **影響範囲**: §6、feedback フォルダ
- **詰めるべき問い**: feedback-hub が既存稼働か（service-hub 群）。`HUB_SERVICE_INFO_SECRET` 系の中央発番。
- **推奨**: 既存 hub があれば ingestion 契約に接続するのみ（hub 無改修）。未構築なら別 PJ 化を検討。
- **判断期限**: feedback 設計時
- **担当**: seiji

### [論点-004] [SEC-001] 認可漏れ / 行レベル owner-check: High
- **status**: `accepted-as-requirement`
- **status 履歴**: 2026-06-08 16:30 open → accepted-as-requirement（concept §3.X NFR に要件化）
- **観点 ID**: O23_authorization_check ／ **影響範囲**: §3.X, _shared/auth, 全 feature
- **検出根拠**: 複数ユーザー PJ、§3 NFR に owner-check 記載ありだが全 API 認可マトリクスは feature 設計で詳細化
- **推奨/対応**: feature 設計時に `/flow:secure --scope=feature` で dispatched-to-feature へ。L1 レポート: `./SECURITY_REVIEW_20260608.md#sec-001`

### [論点-005] [SEC-002] 入力検証 (Zod): High
- **status**: `accepted-as-requirement` ／ **観点 ID**: O24_input_validation ／ **影響範囲**: §3.X, §5, §6
- **status 履歴**: 2026-06-08 16:30 open → accepted-as-requirement
- **対応**: 全 API 入力 Zod 検証。feature 設計で再照合。L1: `./SECURITY_REVIEW_20260608.md#sec-002`

### [論点-006] [SEC-003] 秘密情報管理 (VITE_ 露出): High
- **status**: `accepted-as-requirement` ／ **観点 ID**: O25_secrets_management ／ **影響範囲**: §3.X, §4.5
- **status 履歴**: 2026-06-08 16:30 open → accepted-as-requirement
- **対応**: secret key は VITE_ 禁止、`.env.example` 作成、CI grep。L1: `./SECURITY_REVIEW_20260608.md#sec-003`

### [論点-007] [SEC-004] PII ログ漏洩 (Sentry beforeSend): High（法令必須）
- **status**: `accepted-as-requirement` ／ **観点 ID**: O26_pii_logging ／ **影響範囲**: §3.X, §9.1, §9.2
- **status 履歴**: 2026-06-08 16:30 open → accepted-as-requirement
- **対応**: Sentry beforeSend マスク + feedback 送信前 scrub。L1: `./SECURITY_REVIEW_20260608.md#sec-004`

### [論点-008] [SEC-005] レート制限 / webhook 署名検証: High
- **status**: `accepted-as-requirement` ／ **観点 ID**: O27_rate_limit_scope ／ **影響範囲**: §3.X, §4.3, tip-jar, feedback
- **status 履歴**: 2026-06-08 16:30 open → accepted-as-requirement
- **対応**: Stripe webhook 署名検証必須 + feedback/tip レート制限 + Turnstile。L1: `./SECURITY_REVIEW_20260608.md#sec-005`

> O28 依存脆弱性は lockfile 生成後 `/flow:secure --phase=deps` で実施。O54 DSR 履行可能性は §9.2 で対応済み（ゲスト=セルフサービス削除）。

### [論点-011] [SEC-DEP-002] vitest UI server の Critical CVE（dev-only）
- **status**: `accepted-risk`（pending user confirmation）
- **観点 ID**: O28_dependency_vulnerabilities ／ **severity**: Critical（実曝露ゼロ）
- **検出**: `/flow:secure --phase=deps`（2026-06-08）。`vitest --ui` サーバの任意ファイル read/exec。
- **実曝露**: ゼロ（vitest は本番非同梱、`--ui` 未使用、CI は `vitest run`）。
- **対応**: drizzle-orm の High は 0.45.2 で closed。vitest critical は修正に vitest3→vite6/7 が必要で Node 22.11 の build を破壊するため、**Node 22.12+ アップ後に vitest3+vite6 移行で closed 化**。それまで accepted-risk。詳細: `./SECURITY_DEPS_20260608.md#22`
- **判断期限**: Node アップグレード時 / **担当**: seiji（accepted-risk の最終確認）

## 9. 法務・コンプライアンス書類

> 公開 + tip-jar（日本国内有償要素）のため §9.1 プラポリ + §9.4 特商法表記が必須。

### 9.1 必須書類チェックリスト
| 書類 | 必要性 | 状態 | 配置パス / URL | 備考 |
|---|---|---|---|---|
| プライバシーポリシー | ✅ | 未作成 | `/legal/privacy` | 個人情報（Clerk アカウント・Google 連携・決済）を扱う |
| 利用規約 | ✅ | 未作成 | `/legal/terms` | 公開サービス |
| 特定商取引法に基づく表記 | ✅ | 未作成 | `/legal/specified-commercial-transactions` | tip-jar（投げ銭）= 日本国内有償要素 |
| Cookie ポリシー | ❌ | — | — | Vercel Web Analytics は cookieless、不要 |

### 9.2 対応地域法規
| 法規 | 対象有無 | 対応方針 |
|---|---|---|
| 個人情報保護法（日本） | ✅ | 取得目的明示・第三者提供（Clerk/Stripe）同意・開示請求窓口 |
| GDPR / CCPA | ⚠️ 主に国内想定 | 越境ユーザーがいれば後日対応。cookieless で banner 不要 |

> **ゲスト/匿名のデータ主体権利（O12 × O22 ペア、CF-20260529-021）**: 匿名ゲストは運営側で個人を特定できないため、「削除請求は窓口まで」とは書かない。代わり「運営側で個人を特定できないため、データの確認・削除はアプリ内のセルフサービス機能でご自身で行える / アカウント連携後は窓口でも対応」と正直に明記。**全データ削除のセルフサービス導線は非交渉の必須**（§1.3 feedback でなく activity-sets/設定に実装）。エクスポートは自分のデータ閲覧 UI があるため一括 export は任意。

### 9.3 書類作成方針
- 作成手段: 自前ドラフト + テンプレ参照（公開前に確認）。配置: `docs/_shared/legal/` 原稿 → `/legal/*` 公開。
- 公開導線: フッタリンク + 会員登録（Google リンク）時の同意 + tip-jar 決済前の規約確認。

### 9.4 特定商取引法（tip-jar 公開時）
- 販売事業者 / 代表者 / 所在地（個人事業主は「請求あれば遅滞なく開示」で省略可）/ 連絡先 / 投げ銭の性質（返金なしの応援、対価でない旨）を投げ銭公開前に整備。

## 10. Git リポジトリ・運用

> 共通プロトコル: `~/.claude/flow-data/git-commit-policy.md`。本 §10 は PJ オーバーライド層。

### 10.1 リポジトリ情報
| 項目 | 値 |
|---|---|
| リポジトリ URL | （未設定、`git init` 済 → GitHub 作成は後日） |
| 可視性 | private（公開時に判断） |
| ホスティング | GitHub 想定 |
| デフォルトブランチ | main |

### 10.2 ブランチ戦略
- Trunk-based + Protected main（推奨）。protected_branches: `[main]`。auto_branch_prefix: `flow/`。

### 10.3 コミット規約
- Conventional Commits。flow コマンド自動コミット = `docs(flow:<command>): <target> — <要約>`。

### 10.6 flow コマンド自動コミット方針
```yaml
auto_commit: true
branch_strategy: trunk-based
commit_message_lang: ja
protected_branches: [main]
auto_branch_prefix: "flow/"
staging_extra_paths: []
staging_exclude_paths: []
```

### 10.7 セキュリティ
- `.env*.local` / 秘密情報を `.gitignore` 除外（O25）。pre-commit で gitleaks 推奨。

## 11. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:concept |

## 12. ヒアリング補足（主要回答）

### 12.13 デザイン方向（/flow:design で確定）
- 世界観: 穏やか・前向き・達成の手応え（罪悪感を煽らない）。主色: concept から /flow:design が提案。タイポ: 中立サンセリフ寄り。アイコン: OSS アイコンセット + 自作 SVG（no-key）。
- 注記: charter §2.2 厳守（ストリーク中毒・競争・射幸心なし）。詳細デザインシステムは Phase 1.5 `/flow:design`。

### 12.5 外部 AI: 使わない（MVP）
### 12.6 アナリティクス: Vercel Web Analytics（cookieless）
### 12.7 共通機能: 認証 = Clerk 匿名ゲスト→段階認証（パスキーは v2 検討）。通知 = MVP 外（Web Push 回避）。お問い合わせ = feedback ウィジェットで代替。監査 = 単一ユーザー自己データのため不要。
### 12.8 法務: 公開 + tip-jar のためプラポリ + 利用規約 + 特商法 必須（§9）。
### 12.11 公開周知: note + X（Build in Public）+ 製品内グロース（手応えカード）。
