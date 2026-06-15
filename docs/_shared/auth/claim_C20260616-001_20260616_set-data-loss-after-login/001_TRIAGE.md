# クレーム判定レポート

**claim id**: C20260616-001
**判定日**: 2026-06-16
**判定者**: Claude (claude-opus-4-8[1m]) + seiji
**判定**: **バグ (fix)**

## 1. 三項照合

### 1.1 期待 (Expected)
Google ログイン状態で作成・計時・振り返り登録まで完了した活動セットは、再起動・翌日をまたいでも
保持される（パーシャルにも消えない）。

### 1.2 既存仕様 (Spec)
- concept.md §1.1 UC4/UC5/UC8 + §1.2: local-first（IndexedDB 正本）でデータを保持し、Google ログインは
  「**データを引き継ぎたいとき**」の導線。連携でデータが失われる挙動は想定外。
- `revise_R20260615-001/001_*REVISE_SPEC.md` §UC-ACCT-LINK:「デバイスのゲストデータを当該アカウントへ
  **連携・保存（アップロード）**。データは保持」。
- 同 §4 後方互換:「永続データ形状・列・owner_id 体系すべて不変」「サインアウトで wipe されたデバイス
  ローカルは、**連携済みアカウントならサーバから再 pull で復元可能**」。
- 同 §UC-ACCT-OVERWRITE / spec-review R3: 物理 wipe は「**明示的に既存アカウントへサインインした場合だけ**」。
  「単なるゲスト churn では立てない（保持すべきデータを誤って消さない）」。
- `_shared/local-sync` SPEC: 読みは owner スコープ（`getAllByOwner` = **未削除レコードのみ**）、同期は
  last-write-wins。
- → **仕様上、ログイン状態でのデータ消失（特にパーシャル消失）は明確に「あってはならない」挙動**。

### 1.3 現実 (Actual)
昨日リリースした R20260615-001 が以下を新規導入（消失の機序候補が複数集中）:

- `src/components/auth/AuthProvider.tsx:111` / `:181` — 既存アカウントへのサインイン経路で
  `markDeviceOverwrite()` をセット（OAuth リダイレクト前）。`linkGoogle` が
  「選んだ Google が既に別/既存ユーザーに連携済み」のとき fallback（`:91-120`）でこの経路に入る。
- `src/app/repos.ts:49-53` — app 初期化時、`consumeDeviceOverwrite()` が true なら
  `store.wipeOtherOwners(ownerId)` を実行。
- `src/services/sync/localStore.ts:181-192` — `wipeOtherOwners(currentOwnerId)` は
  **ownerId が current と一致しない全ローカルエンティティを物理削除**（`wipeOwner` で entity + outbox 削除）。
- `src/services/sync/localStore.ts:82-91` — `getAllByOwner` は **未削除（deletedAt なし）レコードのみ**返す。

### 1.4 照合結果
**期待 = SPEC 記載（データは保持・パーシャル消失は禁止） ≠ 現実（夕方セット + 実績が消失）**
→ 三項関係は典型的な **バグ（実装が SPEC の保持保証に反した）**。SPEC 自体は曖昧でなく、消失を許容する
記述は無いため revise（仕様検討漏れ）ではない。該当 SPEC は存在するため feature でもない。

## 2. 判定根拠

1. concept・local-sync SPEC・R20260615-001 SPEC のいずれも「ログイン状態でのデータ保持」を明示し、
   パーシャル消失を許容する記述は皆無 → 期待は SPEC 記載どおりで、現実がそれに反している = バグ。
2. 消失タイミング（昨日 R20260615-001 デプロイ → 翌朝発覚）と、同 revise が新規導入した
   `wipeOtherOwners`（owner 不一致ローカルの物理削除）/ deviceOverwrite marker / 強制停止データ消失是正が
   時系列で強く整合し、**回帰の蓋然性が高い**。
3. 「パーシャル消失（朝は残り夕方だけ消える）」は、2 セットの `ownerId` が一致しない状況で
   `wipeOtherOwners` が片方だけ削除した場合に厳密に再現する形（全消去でない点とも整合）。owner 不一致は
   ① Google 連携/churn 境界での `reassignOwner` 漏れ（一部 entity が旧 guest owner のまま）、
   ② `markDeviceOverwrite` の過剰発火（churn を「既存サインイン」と誤判定）で起こりうる。
4. 代替機序として、`getAllByOwner` が未削除のみ返す仕様下で、夕方セットに `deletedAt` が誤って付与される
   経路（R20260615-001 が是正対象とした「強制停止時データ消失」の残存、または sync conflict/last-write-wins で
   サーバ側の削除/古い状態が pull される）も否定できない。
5. 上記いずれもコードパス上の実装欠陥であり、仕様の曖昧さや未設計ではない → **バグ（fix）で確定**。

> 注: 根本原因は単一に未確定（複数の機序候補が併存）。確定は /flow:fix の調査フェーズに委ねる。
> 本 triage は「バグである」ことの確定と、調査の起点となる仮説群の提供までを責務とする。

### 2.1 /flow:fix へ引き継ぐ調査仮説（優先度順）
1. **deviceOverwrite marker の過剰発火**: churn / 再ログインを「既存アカウントサインイン＝上書き」と誤判定し、
   保持すべきローカルを `wipeOtherOwners` で削除（spec-review R3 の意図に反する取りこぼし）。
   - 確認: `AuthProvider.tsx:91-120` の `alreadyLinked` 正規表現判定と `linkGoogle` 正常連携時に
     marker が立たないこと、`sso_signin_fallback` のライフサイクル。
2. **owner_id 不整合**: 2 セット作成の間に guest ticket churn が起き、片方が別 ownerId で永続化 →
   `reassignOwner`（`dataOps.ts:37`）が全 entity（set/item/session/record/achievement + outbox）を
   網羅できておらず、上書き wipe で片方だけ消えた。
   - 確認: 連携/churn 時の `reassignOwner` が全ストアを走査するか。entity 種別の取りこぼし。
3. **wipeOtherOwners の不可逆性 × サーバ未保持**: 削除前に当該データがサーバへ未アップロード（outbox 滞留 or
   未連携 owner）だと、ローカル削除 = 恒久喪失。wipe を「サーバ反映済みを確認してから」に限定すべきか。
4. **soft-delete / sync 経路**: 夕方セットへの `deletedAt` 誤付与（強制停止データ消失是正の残存欠陥）または
   last-write-wins で古い/削除状態が pull され `getAllByOwner` から外れた。
   - 確認: `conflict.ts` の解決規則、`execution` 強制停止 → 保存 → 同期の経路。

## 3. 推奨分岐先

- **コマンド**: `/flow:fix`
- **引数**: `_shared/auth C20260616-001 --severity=high --from-claim=C20260616-001`
- **severity / scope**: high。理由 = 不可逆なユーザーデータ消失クラス（中核価値の毀損）。ただし現時点の報告は
  1 名・パーシャルのため critical ではなく high。scope = 同期/owner 境界（_shared/auth ⇔ _shared/local-sync 協働、
  execution 強制停止経路も視野）。
- **優先度**: 高（§000 緊急度 high を継承）。データ消失系のため Postmortem（fix 004）を推奨。

## 4. 却下時の対応
（該当なし）

## 5. 判定保留時の論点
（該当なし）

## 6. 関連

- クレーム原文: `./000_CLAIM_REPORT.md`
- 起点となった疑義の中心リリース: `../revise_R20260615-001_20260615_account-switch-stop-sync/`
- 関連 claim/fix: `../claim_C20260614-002_20260614_google-login-no-op/`、`../fix_C20260614-002_20260614_google-link-reverification/`
- local-sync 設計: `../../local-sync/001__shared_local-sync_SPEC.md`
- 分岐先サブフォルダ: `../fix_C20260616-001_20260616_set-data-loss-after-login/`（Step 6 で作成）
