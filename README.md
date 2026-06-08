# つみあげルーティン (habit-stack)

続けたい良い習慣を「活動セット」として登録し、時間ベース（開始→終了→一時停止→再開）で実行・記録して、どれだけ継続できているかを可視化するアプリ。

## 概要

個人向けの習慣記録 PWA。チェックボックス型の習慣アプリと違い、各習慣に**実際にどれだけ時間をかけたか**と**今日の中身メモ**が残り、**罪悪感を煽らない形での継続の手応え**を可視化する。基本は匿名（ローカルファースト）で 0 タップ起動、デバイス間で引き継ぎたいときだけ Google ログイン。姉妹プロダクト `time-budget`（時間の家計簿）と同型の技術構成。

## 主要機能

- **活動セット / アイテム管理**: 時間帯（朝/昼/夕/夜）ごとにルーティンを組む（CRUD・並べ替え）
- **時間ベース実行**: 開始/終了/一時停止/再開。経過時間はタイムスタンプ差分で算出（バックグラウンド/スリープでも正確）
- **継続サマリ**: セット単位・穴あき許容で達成判定。継続日数・継続率を穏やかに可視化
- **作者を応援**: 満足ピークで非ブロッキングな 100 円ワンタップ投げ銭（任意）

## 技術スタック

- フロント: Vite + React + TypeScript（PWA）
- UI: shadcn/ui + Tailwind
- バック: Vercel Functions
- DB: Neon (Postgres) + Drizzle ORM
- ローカル: IndexedDB（local-first 同期）
- 認証: Clerk（匿名ゲスト → Google 段階認証）
- 課金: Stripe（単発投げ銭）
- 監視: Sentry / Vercel Web Analytics（cookieless）

## Getting Started (Local Development)

### 前提条件

- Node.js (LTS) / npm
- `.env.local` の準備（`.env.example` をコピーして実値を埋める。詳細は [docs/PREREQUISITES.md](./docs/PREREQUISITES.md)）

### 起動

```bash
./scripts/dev.sh   # Vite + vercel dev を並行起動（実装後に用意）
# または個別に
npm run dev
```

### よく使うコマンド

| 用途 | コマンド |
|---|---|
| dev サーバー起動 | `./scripts/dev.sh` または `npm run dev` |
| DB マイグレーション | `npm run db:migrate` |
| 型チェック | `npm run typecheck` |
| ユニットテスト | `npm run test` |

詳細: [docs/concept.md §4.5](./docs/concept.md)

## 開発状態

企画（concept 初版）。実装はこれから（`/flow:feature` 以降）。

## 設計ドキュメント

- [全体概念・要件・設計](./docs/concept.md) — プロジェクト中央書類（`/flow:concept` で生成・更新）
- [開発シナリオ](./docs/SCENARIO.md) — next-step 判断用ナラティブ
- [機能フォルダ INDEX](./docs/INDEX.md) — 全機能フォルダ + 横断フォルダのリスト
- [AI 用エントリポイント](./docs/DOC_MAP.md) — 目的別アクセスガイド
- [実装前準備チェックリスト](./docs/PREREQUISITES.md) — API キー / アカウント / 法務書類

## ライセンス

All Rights Reserved（公開時に判断）
