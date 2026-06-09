# クレーム判定レポート

**claim id**: C20260609-002
**判定日**: 2026-06-09
**判定者**: Claude (opus-4-8) + seiji
**判定**: バグ (fix) — 契約済み・✅完了扱いの能力（Google ログイン/アカウント連携動線）が未実装

## 1. 三項照合

### 1.1 期待 (Expected)
データ引き継ぎ・複数端末同期・課金のタイミングで、アプリ上の **Google ログイン（段階的認証）動線**から認証でき、ローカルデータを引き継げる。

### 1.2 既存仕様 (Spec)
- **concept.md §1.1 (L7)**: 「基本は匿名、引き継ぎたいときだけ Google ログイン」
- **concept.md §1.2 (L31–32)**: 「課金時のみ Google ログイン必須」/「匿名 → アカウント連携 … デバイス間同期・課金のタイミングでのみ Google ログインを段階的に要求し、ローカルデータを引き継ぐ」
- **concept.md §1.3.1 (L74)**: `_shared/auth` = 「匿名セッション・**Google リンク**・owner-check」→ 状態 **✅ 完了扱い**
- **_shared/auth SPEC §3 (L24, L58)**: `linkWithGoogle()` — 「匿名ユーザーを Google OAuth でアップグレード。**課金時・複数端末同期時に呼ぶ**」/ tip-jar = 「課金前に linkWithGoogle 必須」
- = SPEC は Google ログイン動線の存在を**明確に契約**している。

### 1.3 現実 (Actual)
- `src/components/auth/AuthProvider.tsx`: 匿名ゲスト ticket セッション（`signIn.create({strategy:'ticket'})`）の自動確立のみ。
- `linkWithGoogle` / `authenticateWithRedirect` / `<SignIn>` / sign-in ボタン: **コードベースに存在しない**（grep: `src/services/auth/localGuest.ts:6` のコメント言及のみ、実関数ゼロ）。
- `src/components/AppLayout.tsx:43`: 「ログインなしで今すぐ始められます」。
- **`docs/_shared/auth/101_*_IMPL_REPORT.md:33`**: 「省略/後続: **Google リンク UI フロー（app-shell の UI 配線時）** … サーバ側は実装済み」→ UI 動線を先送り → 未配線のまま ✅ 完了扱い + 本番公開。

### 1.4 照合結果
期待 = SPEC 記載（Google ログイン動線は契約済み・✅）≠ 現実（動線が一切無い）→ **実装が SPEC を満たしていない = バグ（契約違反）**。
backend（owner-resolver / guest セッション）は実装済みだが、契約の (B) 段階的認証 UI 動線が欠落。`_shared/auth` の「✅ 完了」は誤り。

## 2. 判定根拠

1. SPEC（concept §1.1/§1.2 + auth SPEC §3）が Google ログイン/アカウント連携動線を明示的に契約しており、解釈の余地がない（= 新機能 feature ではなく既存契約の未充足）。
2. backend は実装済みで、欠落しているのは「契約済み機能の UI 動線」部分 → 仕様の曖昧さ起因（revise）ではなく実装欠落（fix）。
3. IMPL_REPORT が「app-shell 配線時に」と先送りを明記したまま未配線で、しかも ✅ 完了・本番公開された = 完了判定の誤り（実装完全性バグ）。
4. perspectives O22 の 2 部構成契約のうち (B) 段階的認証動線が未実装。O55（orphaned route）は route 前提のため本パターン（route も関数も無い）を拾えず、これが「audit で検知しない」の正体。

## 3. 推奨分岐先

- **コマンド**: `/flow:fix`
- **引数**: `_shared/auth C20260609-002 --severity=high --from-claim=C20260609-002`
- **scope**: (a) `linkWithGoogle()` 実装（Clerk external account 連携、`flow-data/guest-auth-clerk-scaffold.md` 準拠 + GCP custom OAuth は release §3.1 手順）、(b) **app-shell に Google ログイン/アカウント連携の UI 動線**（設定 or ヘッダーに常設 + データ引き継ぎ文脈）、(c) ゲスト→アカウントの `mergeGuestData` 配線、(d) 到達テスト。
- **優先度**: high（本番公開済・中核価値の機能不全。ただし課金は現状ゲストで稼働中＝即時障害ではない）。

## 4. 付随論点 — 確定（seiji 判断 2026-06-09）

- **tip（応援投げ銭）はログイン不要・ゲスト継続で確定**。理由（seiji）: 「課金時ログイン必須という縛りが無意味。応援寄付で、かつ100円という少額だから」= **対価無しのギフト（donation）に復旧可能 ID は無意味**（perspectives O46🎁、CF-20260609-010）。
- → fix の本丸は **「ログイン/アカウント連携動線を在らせる」= データ引き継ぎ・複数端末同期のため**。**tip にはログインゲートを一切付けない**（現状の live ゲスト tip フローを維持）。
- **要校正（fix or 軽量 revise スコープ）**: 「課金前 linkWithGoogle 必須」と donation をゲートしている SPEC 文言を非ゲートに修正:
  - `concept.md §1.2 L31`「課金時のみ Google ログイン必須」→ donation は対象外に校正
  - `_shared/auth SPEC §3 L58`「tip-jar: 課金前に linkWithGoogle 必須」→ 削除/非ゲート化
  - `tip-jar SPEC` の課金前ログイン記述があれば同様に校正

## 5. 関連

- クレーム原文: `./000_CLAIM_REPORT.md`
- flow 横展開（同時実施済）: perspectives O22 `required_signals`/`required_signals_when` 追加（commit a9ada65）、audit #4 step 3.6 broad-match マスク検出（commit d119cd5）、CF-20260609-009。
- 分岐先サブフォルダ: （route 実行後に追記）
