// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { LocalStore, type LocalRecord } from '../../services/sync/localStore.js';
import { SummaryRepo } from './model/summaryRepo.js';
import { SummaryPage } from './SummaryPage.js';
import { asOwnerId } from '../../types/domain.js';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const wrap = (ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

async function seedAchievements(dates: string[]) {
  const store = await LocalStore.open();
  for (const date of dates) {
    const rec: LocalRecord = {
      id: `owner_1:set_1:${date}`,
      ownerId: 'owner_1',
      clientLocalId: `owner_1:set_1:${date}`,
      setId: 'set_1',
      date,
      achieved: true,
      itemDoneCount: 1,
      updatedAt: `${date}T09:00:00.000Z`,
      deletedAt: null,
    };
    await store.applyRemote('daily_achievement', rec);
  }
  return new SummaryRepo(store, asOwnerId('owner_1'));
}

describe('SummaryPage (UC6)', () => {
  it('SM-S1: 達成記録があれば継続率・連続日数・ドットを表示', async () => {
    const repo = await seedAchievements(['2026-06-08', '2026-06-07', '2026-06-06']);
    wrap(<SummaryPage repo={repo} setId="set_1" setName="平日の朝" today="2026-06-08" />);

    await waitFor(() =>
      expect(screen.getByTestId('streak').textContent).toContain('3日'),
    );
    // 7 日中 3 日 → 43%
    expect(screen.getByLabelText('継続率').textContent).toContain('3 日');
    // 達成ドットが描画される
    expect(screen.getByLabelText('達成日')).toBeTruthy();
  });

  it('SM-S4: 記録なしは前向きな空状態（咎めない）', async () => {
    const repo = await seedAchievements([]);
    wrap(<SummaryPage repo={repo} setId="set_1" setName="平日の朝" today="2026-06-08" />);
    await waitFor(() =>
      expect(screen.getByText(/ひとつから始めましょう/)).toBeTruthy(),
    );
  });
});
