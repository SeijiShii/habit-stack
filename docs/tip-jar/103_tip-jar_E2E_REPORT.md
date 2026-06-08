# E2E 実行レポート: tip-jar

**状態**: 実キー必要のため Release gate (P4.7) へ繰り延べ
- tip-jar は実 Stripe/Clerk/hub（実キー = Class C）を要するフローのため、ローカル headless（キーなし）では完全実行不可。
- ウィジェット起動 / 署名検証 / 価格透明性 等の単体・統合は 102 で green（accumulated）。
- 実フローは `/flow:release` で実キー FILL 後、preview/実機で確認。
