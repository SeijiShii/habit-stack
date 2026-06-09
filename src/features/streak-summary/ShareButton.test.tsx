// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from './ShareButton.js';

const URL = 'https://habit-stack.givers.work';
const DEFAULT = 'よかったら使ってみてください。';

describe('ShareButton', () => {
  it('編集可能な短文 + 共有/X 導線を表示', () => {
    render(<ShareButton url={URL} defaultText={DEFAULT} />);
    const ta = screen.getByLabelText('共有メッセージ') as HTMLTextAreaElement;
    expect(ta.value).toBe(DEFAULT);
    expect(screen.getByRole('button', { name: '共有する' })).toBeTruthy();
    const x = screen.getByRole('link', { name: /X/ }) as HTMLAnchorElement;
    expect(x.href).toContain(encodeURIComponent(DEFAULT));
    expect(x.href).toContain(encodeURIComponent(URL));
  });

  it('短文を編集できる', () => {
    render(<ShareButton url={URL} defaultText={DEFAULT} />);
    const ta = screen.getByLabelText('共有メッセージ') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '続いてます！' } });
    expect(ta.value).toBe('続いてます！');
  });

  it('Web Share 成功時は share を呼びお礼を表示', async () => {
    const share = vi.fn(async () => true);
    render(<ShareButton url={URL} defaultText={DEFAULT} share={share} />);
    fireEvent.click(screen.getByRole('button', { name: '共有する' }));
    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({ text: DEFAULT, url: URL });
      expect(screen.getByRole('status').textContent).toContain('ありがとう');
    });
  });

  it('Web Share 不可なら clipboard コピーに fallback', async () => {
    const share = vi.fn(async () => false);
    const copy = vi.fn(async () => {});
    render(<ShareButton url={URL} defaultText={DEFAULT} share={share} copy={copy} />);
    fireEvent.click(screen.getByRole('button', { name: '共有する' }));
    await waitFor(() => {
      expect(copy).toHaveBeenCalledWith(`${DEFAULT} ${URL}`);
      expect(screen.getByRole('status').textContent).toContain('コピー');
    });
  });
});
