# tip-jar E2E テスト計画

> **入力**: `./001_tip-jar_SPEC.md`
> **最終更新**: 2026-06-08
> **実行**: /flow:e2e（Playwright、Stripe は test/mock。実課金は /flow:release で B-4）

---

## 1. ユーザージャーニー
### UC7: 作者を応援（§1.1 #7）
| シナリオ ID | 前提 | 操作 | 期待結果 |
|---|---|---|---|
| TIP-S1 happy | 認証済み | 応援ボタン（100円明示）→ Checkout（test）→ 完了 | お礼表示、webhook で記録 |
| TIP-S2 anon | 匿名 | 応援ボタン | Google リンク誘導（課金前） |
| TIP-S3 nonblock | 任意 | 応援を押さない | 全機能が無料で使える |
| TIP-S4 cancel | 認証済み | Checkout 離脱 | 副作用なし、通常画面 |

## 2. 環境要件
| 項目 | 要件 |
|---|---|
| ブラウザ | Chromium |
| Stripe | test モード or mock（実課金は E2E でやらない） |
| 認証 | 匿名 + Google（test） |

## 3. データセットアップ
- Seed: なし。Cleanup: test tip 記録削除。

## 4. タグ別追加シナリオ
### analytics
- tip_prompt_shown / tip_completed（PII なし）。

## 5. レイアウト・ビジュアル検証（O34 / O43）
- Level 1: ✅ 応援ボタン/お礼 baseline。
- Level 2: ✅ **金額「100円」が CTA ボタンより前・ファーストビュー内に明示**（O43 価格透明性）、自作 SVG ハート（絵文字でない）、非ブロッキング配置（5-8 assert）。
- Level 3: ✅（課金導線のため、初回 + 月次で AI Vision 検証 = O43「金額が CTA 前に明示か」）。**Class B-4 コスト発生**、§4.6 に積算、採用は明示。

## 6. 期待 KPI
| 指標 | 目標 |
|---|---|
| 成功率 | 100% |
| 価格透明性違反 | 0（O43） |

## 7. 更新履歴
| 日付 | 変更概要 | 実行者 |
|---|---|---|
| 2026-06-08 | 初版作成 | /flow:feature |
