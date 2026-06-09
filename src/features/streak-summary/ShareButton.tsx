import { useState } from 'react';

export interface ShareButtonProps {
  /** 共有する URL（公開サイト）。 */
  url: string;
  /** 共有文の初期値（編集可能）。 */
  defaultText: string;
  /** Web Share ラッパ（テスト注入可）。成功 true / 未対応・失敗 false。 */
  share?: (data: { text: string; url: string }) => Promise<boolean>;
  /** クリップボードコピー（テスト注入可）。 */
  copy?: (text: string) => Promise<void>;
}

/** Web Share API（対応端末のみ）。未対応・キャンセル時は false。 */
async function webShare(data: { text: string; url: string }): Promise<boolean> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({ text: data.text, url: data.url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function clipboardCopy(text: string): Promise<void> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(text);
    } catch {
      /* 非 secure-context 等。静かに無視（fallback の更に先は X リンク）。 */
    }
  }
}

/**
 * このアプリを「だれかに勧める」常設シェア導線（O31 製品内グロース）。
 * Web Share → 未対応なら clipboard コピー / X intent リンク。
 * charter §2.2: 強制シェアモーダルにしない・非ブロッキング・押さなくても全機能無料。
 */
export function ShareButton({ url, defaultText, share = webShare, copy = clipboardCopy }: ShareButtonProps) {
  const [text, setText] = useState(defaultText);
  const [done, setDone] = useState<'shared' | 'copied' | null>(null);

  const onShare = async () => {
    const ok = await share({ text, url });
    if (ok) {
      setDone('shared');
      return;
    }
    await copy(`${text} ${url}`);
    setDone('copied');
  };

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  return (
    <section aria-label="このアプリを共有" className="share">
      <h2>続けられそうなら、だれかに</h2>
      <textarea
        aria-label="共有メッセージ"
        maxLength={140}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="share-actions">
        <button type="button" className="btn-primary" onClick={() => void onShare()}>
          共有する
        </button>
        <a href={xUrl} target="_blank" rel="noopener noreferrer">
          X で送る
        </a>
      </div>
      {done === 'shared' && <p role="status">ありがとうございます。</p>}
      {done === 'copied' && <p role="status">リンクをコピーしました。</p>}
    </section>
  );
}
