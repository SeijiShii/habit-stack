import { useState } from 'react';
import { FeedbackClient, type Reaction } from './model/feedbackClient.js';

export interface FeedbackWidgetProps {
  client: FeedbackClient;
}

/**
 * どの画面からでも 1 タップで開くフィードバックウィジェット（O40）。
 * 好き嫌いリアクション + 自由記述。送信前 scrub は client が担う（SEC-004）。
 */
export function FeedbackWidget({ client }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [reaction, setReaction] = useState<Reaction>('good');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    await client.send({ reaction, message });
    setDone(true);
  };

  if (!open) {
    return (
      <button type="button" aria-label="フィードバックを送る" onClick={() => setOpen(true)}>
        フィードバック
      </button>
    );
  }

  if (done) {
    return <p role="status">ありがとうございます。</p>;
  }

  return (
    <div role="dialog" aria-label="フィードバック">
      <fieldset>
        <legend>このサービスはどうですか？</legend>
        <button type="button" aria-pressed={reaction === 'good'} onClick={() => setReaction('good')}>
          よい
        </button>
        <button type="button" aria-pressed={reaction === 'bad'} onClick={() => setReaction('bad')}>
          いまいち
        </button>
      </fieldset>
      <textarea
        aria-label="ご意見・不具合（任意）"
        maxLength={1000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button type="button" onClick={() => void submit()}>
        送信
      </button>
    </div>
  );
}
