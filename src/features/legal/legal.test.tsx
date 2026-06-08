// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivacyPage, TermsPage, SctPage } from './LegalPages.js';
import { LegalFooter } from '../../components/LegalFooter.js';
import { LEGAL_ROUTES } from './content.js';

describe('PrivacyPage', () => {
  it('N1: 取得項目/利用目的/第三者提供を含む', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('プライバシーポリシー');
    expect(document.body.textContent).toContain('Clerk');
    expect(document.body.textContent).toContain('Stripe');
  });

  it('N2: O54 ゲスト削除文言（運営側で特定不能 + セルフサービス削除）を含む', () => {
    render(<PrivacyPage />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('個人として特定できません');
    expect(text).toContain('セルフサービス');
  });
});

describe('TermsPage', () => {
  it('N3: 免責/準拠法/管轄を含む', () => {
    render(<TermsPage />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('免責');
    expect(text).toContain('日本法');
    expect(text).toContain('管轄');
  });
});

describe('SctPage', () => {
  it('N4: 投げ銭=応援/返金なし/請求あれば開示を含む', () => {
    render(<SctPage />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('応援');
    expect(text).toContain('返金は行いません');
    expect(text).toContain('遅滞なく開示');
  });
});

describe('LegalFooter (O55 到達性)', () => {
  it('N5: 3 つの法務リンクを常設', () => {
    render(<LegalFooter />);
    const hrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(LEGAL_ROUTES.privacy);
    expect(hrefs).toContain(LEGAL_ROUTES.terms);
    expect(hrefs).toContain(LEGAL_ROUTES.sct);
  });
});
