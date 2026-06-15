# 修正計画: ログイン状態で活動セットがパーシャルに消失

> **入力**: `./000_調査レポート.md`, `./001_ROOT_CAUSE.md`, Step 2 実装
> **最終更新**: 2026-06-16

---

## 0. 方針サマリ
2 段構え:
- **即時 mitigation（止血・最小リスク）**: 破壊的 `wipeOtherOwners` 呼び出しを無効化。read が owner-scoped なため
  正当性に不要（R20260615-001 spec-review R2 自認）→ **機能リグレッションゼロでデータ消失を停止**。
- **恒久修正（root）**: owner churn 時にローカルデータを「破壊」ではなく「保全（同期 or owner 移行）」する。
  + 不可逆操作の前にユーザー意図を確認 + 診断 instrumentation で実機挙動を確証（CLAUDE.md FE デバッグ方針準拠）。

## 1. 修正対象ファイル

| ファイル | 修正内容 | before 抜粋 | after 抜粋 |
|---|---|---|---|
| `src/app/repos.ts` | **【即時】**`wipeOtherOwners` 呼び出しを撤去（or フラグで OFF）。orphan は許容（read で隔離）。 | `if (consumeDeviceOverwrite()) { void store.wipeOtherOwners(ownerId)... }` | 呼び出し削除。必要なら `consumeDeviceOverwrite()` のクリアのみ残す（marker 蓄積防止）。 |
| `src/services/sync/localStore.ts` | **【恒久】**`wipeOwner` を「未送信 outbox があるレコードは消さない／消す前に保全」へ。さらにローカル owner 付け替え API `reassignOwnerLocal(from,to)` を新設（エンティティ + outbox payload の ownerId を付け替え、削除しない）。 | `wipeOwner`: entity + outbox を delete | 未同期判定を追加 / `reassignOwnerLocal` 追加 |
| `src/components/auth/AuthProvider.tsx` | **【恒久】**既存アカウントサインイン時、`markDeviceOverwrite`（破棄）ではなく **ローカルゲストデータの保全（reassign→同期 push）** を既定に。真に「上書き」したい場合のみユーザー確認を経て破棄。 | `markDeviceOverwrite()`（無言で上書き印） | 保全 reassign を既定化、破棄は確認付き |
| `src/services/auth/dataOps.ts` | **【恒久】**`reassignOwner`（サーバ）を実際に配線（連携時に from=guest→to=account を呼ぶ）。dead code を解消し [論点-009] のコードと SoT を一致させる。 | 未呼び出し | 連携フローから呼び出し |
| `src/app/repos.ts`（診断） | **【診断・一時】**owner 解決・wipe・reassign の各境界に `console.log`（owner id 遷移、対象件数）。**原因確証後に必ず削除**（CLAUDE.md FE デバッグ方針 3）。 | — | 一時ログ |

> 実装の最小単位は /flow:tdd が決める。**最優先は「即時 mitigation」**（1 ファイル・低リスク）。

## 2. 修正範囲の限定方針
- **即時**: `repos.ts` の wipe 呼び出しのみ撤去（影響最小・可逆）。
- **恒久**: local-sync の保全 API + 連携フローの reassign 配線 + 上書き時確認。execution/streak のデータ形状は不変
  （DB schema・migration 不要）。
- 予防的に、`wipeOwner`（O54 セルフ削除でも使用）は「未同期 outbox の扱い」を**セルフ削除（意図的・確認済）と
  上書き cleanup（自動）で分離**する（セルフ削除は従来どおり全削除、自動 cleanup は保全優先）。

## 3. 副作用なき確認方法
- 既存テスト維持: `localStore.test.ts`（wipeOwner/getAllByOwner）、`AuthProvider.test.ts`、`useSync.test.tsx`、
  O54 セルフ削除系（`wipeOwner` 全削除挙動）が緑のまま。
- 追加テスト: §003_REGRESSION_TEST 参照（未同期データを消さない／owner churn でデータが保全される）。
- 手動確認項目:
  1. ゲストで作成 → 既存 Google アカウントへサインイン → **作成データが消えない**（保全 or 表示維持）。
  2. O54 セルフ全削除は従来どおり全消去される（保全ロジックが誤って削除を阻害しない）。
  3. 既存アカウントのデータと混在表示にならない（owner-scoped read 維持）。

## 4. リリース戦略
- **方式**: 即時 mitigation を**最優先で通常リリースに前倒し**（severity=high・データ消失・実害発生中）。
  恒久修正は同バンドル or 直近の次バンドル。
- 理由: データ消失は不可逆。止血（wipe 撤去）は 1 ファイル・機能リグレッションゼロで安全。
- フィーチャーフラグ: 不要（撤去はそれ自体が安全側）。恒久修正で大きく変える場合のみ検討。
- 展開計画:
  1. /flow:tdd で即時 mitigation 実装 + unit green。
  2. /flow:e2e で owner churn × 未同期データの消失再発防止 E2E green。
  3. ローカル実機（スマホ・実 Clerk キー）で手動確認項目 1-3 → /flow:release でデプロイ。
  4. デプロイ後、診断ログ（残っていれば）で実機 owner 遷移を観測 → 確証後にログ削除。

## 5. ロールバック方針
- コード revert で完全復旧: ✅（UI/配線/local-sync ロジックのみ。DB 変更・migration なし）。
- DB ロールバック: 不要（schema 不変）。
- 手順: 当該コミット revert → 再デプロイ。即時 mitigation は R20260615-001 の wipe 配線を外すだけなので
  revert しても R20260615-001 の他機能（停止条件緩和・確認ダイアログ）は維持される。

## 6. 関係者通知
- 通知先: 報告者（seiji）。
- 通知タイミング: 即時 mitigation デプロイ時（消失停止の周知）+ 復旧調査の結果（Postmortem §復旧）。

## 7. DoD
- [ ] 既存アカウントサインインでローカル未同期データが消えない（再現テストが修正前 fail → 修正後 pass）
- [ ] 003 REGRESSION_TEST 全成功
- [ ] O54 セルフ削除の全消去挙動が維持（既存テスト破壊なし）
- [ ] owner-scoped read による隔離が維持（混在表示なし）
- [ ] 診断 console.log が**全て削除**されている（コミット前 diff 確認、CLAUDE.md FE デバッグ方針 3）
- [ ] `/flow:spec-review` 通過
- [ ] Postmortem の再発防止策に担当 + 期限が設定された

## 8. 更新履歴
| 日付 | 変更 | 実行者 |
|---|---|---|
| 2026-06-16 | 初版 | /flow:fix |
