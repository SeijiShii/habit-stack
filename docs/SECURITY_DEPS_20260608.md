# 依存ライブラリ脆弱性スキャン結果

**スキャン日**: 2026-06-08
**対象**: package-lock.json（npm）
**スキャナ**: npm audit
**実行**: /flow:secure --phase=deps（/flow:auto §3.0c 鮮度トリガ: lockfile 大幅変更）

## 1. サマリ
- スキャン前: 9 件（critical 1 / high 1 / moderate 7）
- **対応後**: 8 件（critical 1 / moderate 7）
- High 解消: 1 件（drizzle-orm → 0.45.2 にアップ、build/test green 維持）
- 残: critical 1（dev-only）+ moderate 7（全て dev-server tooling、本番曝露なし）

## 2. Critical / High 詳細

### 2.1 [SEC-DEP-001] drizzle-orm SQL injection via improperly escaped SQL identifiers（High）→ **closed**
- 影響: runtime 依存。ただし当 PJ は SQL 識別子（テーブル/カラム名）をユーザー制御させない（スキーマ定数 + パラメータ化値のみ）ため実曝露は低。
- 対応: **drizzle-orm 0.36.4 → 0.45.2 にアップ（patched）**。typecheck/115 テスト/build 全 green を確認。
- status: **closed**（dispatched-to-fix → 完了）

### 2.2 [SEC-DEP-002] vitest UI server arbitrary file read/exec（Critical）→ **accepted-risk（要ユーザー確認）**
- 影響: **dev 専用テストランナーの UI サーバ（`vitest --ui`）の脆弱性**。
- 実曝露評価: **ゼロ**。(a) vitest は本番バンドルに同梱されない（vite build 出力は React アプリのみ）、(b) `vitest --ui` を一切使わない（テストは `vitest run`）、(c) CI も `vitest run`。攻撃にはローカル UI サーバのポートへ到達する必要があり、当 PJ の運用に該当しない。
- 修正可否: 修正は vitest 3.x 必須 → peer で vite 6/7 を要求 → vite 7 は Node 22.12+ 必須 + rolldown native binding 問題で**当環境（Node 22.11）の build を破壊**。Node アップグレード（22.12+）後に vitest 3 + vite 6 へ移行で解消可能。
- **推奨対応**: 現時点は **accepted-risk**（dev-only・本番曝露ゼロ）。Node 22.12+ へ上げる際に vitest 3 + vite 6 移行で closed 化。
- status: **accepted-risk（pending user confirmation）** — リスク受容は本来ユーザー明示判断（/flow:secure 原則）。実曝露ゼロのため自動修正せず、本レポート + concept §8 + /flow:release 時にユーザーへ surface。

## 3. Medium 以下（記載のみ、dev-only）
| パッケージ | 内容 | 評価 |
|---|---|---|
| esbuild | dev server が任意サイトからのリクエストを許す | dev-only、本番ビルドは無関係 |
| @esbuild-kit/core-utils / esm-loader | esbuild 経由 | dev-only（drizzle-kit のマイグレーション tooling） |
| drizzle-kit | 上記 esbuild-kit 経由 | dev-only（マイグレーション生成のみ） |
| vite | Optimized Deps `.map` の Path Traversal（dev server） | dev-only、本番ビルドは無関係。Node 22.12+ で vite 6 へ移行時に解消 |

これらは**全て dev-server / dev-tooling の脆弱性**で、本番（静的ビルド成果物）には dev サーバが存在しないため曝露なし。

## 4. 自動更新メカニズム
- ✅ `.github/dependabot.yml`（weekly）設定済み（app-shell で配線）。
- ✅ CI に `npm audit --audit-level=high`（ci.yml）。

## 5. 次のアクション
- High（drizzle-orm）解消済み。
- Critical（vitest）は Node 22.12+ アップ + vitest3/vite6 移行で closed 化（accepted-risk、本番曝露ゼロ）。
- moderate 7 は dev-only、dependabot で追跡。
