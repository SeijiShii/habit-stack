# _shared/app-shell 実装計画書（合成 + bootstrap、O57/O36/O37）

> **入力**: `./001__shared_app-shell_SPEC.md`, 全 feature/_shared、concept §4.5/§4.7/§10
> **最終更新**: 2026-06-08

---

## 1. 実装対象ファイル一覧

| ファイル | 責務 | 依存 | LOC |
|---|---|---|---|
| `index.html` | エントリ HTML + PWA/icon link | — | 30 |
| `src/main.tsx` | Providers ツリー（Auth/Query/Theme/ErrorBoundary） | 全 _shared | 60 |
| `src/App.tsx` + `src/routes.tsx` | ルーティング + グローバル UI（ナビ/フッタ/Feedback/TipJar/「これは何？」） | 全 feature | 150 |
| `src/components/AppNav.tsx` / `Layout.tsx` | ナビ + レイアウト（O55 導線） | design | 90 |
| `api/health.ts` | health check | — | 15 |
| `vite.config.ts` + `vite-plugin-pwa` | ビルド + SW/manifest | — | 50 |
| `scripts/dev.sh` / `stop.sh` | dev launcher（O36） | — | 80 |
| `.github/workflows/ci.yml` + `dependabot.yml` | CI（O37） | — | 90 |
| `scripts/gen-favicon.js` | ブランドマーク派生（O56、design SVG 由来） | sharp/to-ico | 50 |
| `.env.example` | 全 env キー（SEC-003） | — | 30 |

## 2. 実装 Phase 分割

### Phase 1: プロジェクト基盤（Vite + TS + PWA scaffold）
- Vite + React + TS、vite-plugin-pwa、tsconfig、design トークン適用。
- テスト: ビルド成功、PWA manifest 生成。
### Phase 2: 合成ルート（main/App/routes + Providers）
- Provider ツリー、ルーティング、ErrorBoundary（Sentry）。
- テスト: 各 route がレンダー、Provider 配線。
### Phase 3: API ルートハンドラ配線 + 認証セッション（P4.46）
- 全 feature API を配線、withOwner、匿名サインイン。
- テスト: **匿名→authed で保護 API 200**（P4.46 hard gate）、health。
### Phase 4: グローバル UI（ナビ/フッタ O55/Feedback O40/TipJar/「これは何？」O41）
- LegalFooter 常設、FeedbackWidget、TipJarButton、入口リード文。
- テスト: 全 route inbound link（O55）、入口理解（O41）。
### Phase 5: bootstrap（O36/O37/O56）
- `scripts/dev.sh`（全起動 + health + smoke）、`stop.sh`、`ci.yml`、`dependabot.yml`、`gen-favicon.js`、`.env.example`。
- 完了条件: `bash scripts/dev.sh` で全起動 + smoke green、PR で CI green。

## 3. 依存関係順序
```
Vite基盤 → main/App/routes(Providers) → API配線+認証(P4.46) → グローバルUI(O55/O40/O41) → bootstrap(O36/O37/O56)
依存: 全 feature + 全 _shared + design-system（= 優先度最後）
```

## 4. 既存ファイルへの影響
- 全 feature/_shared を import・配線（最終統合）。

## 5. 横断フォルダへの追加・変更
- 全 _shared を Providers に組み込み。

## 6. リスク・注意点
- **O57**: これが合成の最終 target。全部品が揃っていても合成が無いと動かない。
- **P4.46**: 匿名→authed で保護 API が 200（401 でない）を build フェーズで担保。stub auth で誤魔化さない。
- PWA SW とローカル開発の整合（dev では SW 無効化推奨）。
- 本番デプロイは Class B（/flow:release）。

## 7. 完了の定義（MVP）
- [ ] `bash scripts/dev.sh` で全 service 起動 + `/api/health` + トップ smoke green（O36）
- [ ] PR で CI green（O37）
- [ ] 全 route に inbound link（O55）、入口「これは何？」（O41）
- [ ] 匿名→authed 保護 API 200（P4.46）
- [ ] ブランドマーク配置（O56）、PWA インストール可
- [ ] E2E（全 feature の E2E が app-shell 上で green）

## 8. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
