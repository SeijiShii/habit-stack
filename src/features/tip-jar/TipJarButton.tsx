import { useState } from 'react';
import { TIP_AMOUNT_JPY } from '../../../api/tip/checkout.js';

export interface TipJarButtonProps {
  /** 認証済みか（匿名は Google リンク誘導）。 */
  isAuthed: boolean;
  /** Checkout を開始（URL へ遷移）。 */
  onCheckout: () => Promise<void>;
  /** 匿名時の Google リンク誘導。 */
  onLinkGoogle?: () => void;
}

/** 控えめなハート（絵文字でない自作 SVG、O38/design）。 */
function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 21s-7-4.35-9.5-8.5C1 9 3 5.5 6.5 5.5 8.5 5.5 10 7 12 9c2-2 3.5-3.5 5.5-3.5C21 5.5 23 9 21.5 12.5 19 16.65 12 21 12 21z"
        fill="var(--color-accent, #E8A23D)"
      />
    </svg>
  );
}

/**
 * 満足ピークに置く非ブロッキングな応援ボタン（charter §1.7 / §2.2）。
 * **金額を CTA に明示**（O43 価格透明性）。押さなくても全機能は無料。
 */
export function TipJarButton({ isAuthed, onCheckout, onLinkGoogle }: TipJarButtonProps) {
  const [busy, setBusy] = useState(false);

  const click = async () => {
    if (!isAuthed) {
      onLinkGoogle?.();
      return;
    }
    setBusy(true);
    try {
      await onCheckout();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={() => void click()} disabled={busy} aria-label={`${TIP_AMOUNT_JPY}円で作者を応援`}>
      <HeartIcon /> {TIP_AMOUNT_JPY}円で作者を応援
    </button>
  );
}
